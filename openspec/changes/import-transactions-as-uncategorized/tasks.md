## 1. Backend Implementation

- [x] 1.1 In `src/transactions/views.py` (`api_list` POST handler), add status evaluation during item processing: if `status` is omitted, null, or empty/whitespace string, set `item['status'] = 'Uncategorized'`; otherwise preserve the trimmed provided `status`.
- [x] 1.2 Verify that `filtered_item` retains the evaluated `status` prior to `transactions_repo.create()`.

## 2. Verification

- [x] 2.1 Test importing transactions without `status` or with an empty string `""` via `POST /api/transactions/` and verify created transactions have `status="Uncategorized"`.
- [x] 2.2 Test importing transactions with explicit `status="Categorized"` via `POST /api/transactions/` and verify `status="Categorized"` is preserved.
- [x] 2.3 Test importing transactions with explicit `status="Pending"` via `POST /api/transactions/` and verify `status="Pending"` is preserved.
- [x] 2.4 Verify that transactions created with empty/omitted status appear in `GET /api/transactions/uncategorize/`.
