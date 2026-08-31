## Context

Currently, `api_list` in `src/transactions/views.py` accepts a list of transaction dictionaries via `POST`. It iterates over the incoming payload and directly calls `transactions_repo.create(filtered_item)` without checking if the transaction already exists in the database. Furthermore, if any single record fails (for example during date parsing or database constraints), an unhandled exception is caught by the outermost `try...except` block, aborting the entire request and returning a 400 error. The frontend (`src/static/scripts/transactions/import.js`) expects `{ "status": "success", "created": N }` and shows a simple notification.

## Goals / Non-Goals

**Goals:**
- Add repository/service methods or query checks in `TransactionsRepository` and `api_list` to verify transaction existence by `(date, commerce, amount)`.
- Isolate per-transaction processing in a loop so that a failure on one item does not prevent subsequent items from being processed.
- Collect and return a structured summary containing counts and item details for `created`, `existing` (skipped duplicates), and `errors` (failed records with error messages).
- Update the frontend import view (`import.js`) to display an informative summary message or modal/banner detailing the results of the import.

**Non-Goals:**
- Overhauling duplicate detection on other views or modifying the existing duplicate cleanup endpoint (`api_duplicates`).
- Modifying the database schema (no migration needed since `TransactionsModel` already has `date`, `commerce`, and `amount`).

## Decisions

### Decision 1: Duplicate check criteria and execution
- **Choice**: Check existence for each transaction using `(date, commerce, amount)` against `TransactionsModel`.
- **Details**: Date comparison must compare exact timestamp or date match depending on parsed date. When parsing `date` (format `%Y-%m-%d %H:%M`), query `TransactionsModel.objects.filter(commerce=commerce, amount=amount, date=parsed_date).exists()`. In-batch duplicates will also be tracked during the loop to avoid inserting duplicates that appear multiple times in the same CSV/payload.
- **Alternatives considered**: Querying all existing transactions in one query vs per-item query. For batch CSV imports (usually dozens to hundreds of rows), checking existence per item or in chunks is straightforward and minimizes memory overhead while maintaining transaction-level isolation.

### Decision 2: Per-item error handling loop
- **Choice**: Wrap each transaction item processing step in a `try...except` block.
- **Details**:
  - `created`: items successfully inserted via `transactions_repo.create()`.
  - `existing`: items that matched existing `date`, `commerce`, `amount` in DB or previously processed in the same batch.
  - `errors`: items where parsing or DB insertion failed, storing the raw item and error reason.
- **Alternatives considered**: Transaction rollbacks with `transaction.atomic()`. This is not desirable here because the requirement explicitly states that if one item fails, the remaining valid items must still be processed and created.

### Decision 3: Response structure
- **Choice**:
  ```json
  {
    "status": "success",
    "summary": {
      "total": 10,
      "created_count": 6,
      "existing_count": 3,
      "error_count": 1,
      "created": [...],
      "existing": [...],
      "errors": [{"item": {...}, "error": "Invalid date format"}]
    }
  }
  ```
- **Rationale**: Backwards-compatible or comprehensive enough for frontend consumption while keeping rich debugging and reporting information.

### Decision 4: Frontend UI updates in `import.js`
- **Choice**: Update `NotificationService` call and/or render a summary alert/dialog showing total created, total existing duplicates skipped, and total errors encountered.

## Risks / Trade-offs

- **[Performance on large CSV files]** → Mitigation: Use index-friendly queries and resolve foreign keys (budgets and subcategories) using existing caches.
- **[In-batch duplicates]** → Mitigation: Track `(date, commerce, amount)` tuples processed within the current request batch so duplicates within the same import file are also detected and counted as existing.
