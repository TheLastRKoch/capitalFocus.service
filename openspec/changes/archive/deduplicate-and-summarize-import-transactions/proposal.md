## Why

During transaction imports via the `/api/transactions/` endpoint, all rows provided are created unconditionally, which causes duplicate transactions if the transactions already exist. Additionally, when an error occurs while processing a transaction item, the entire import request fails instead of processing the valid transactions. The import response currently only returns `{ "status": "success", "created": <count> }` without itemized breakdown or failure resilience.

Adding pre-creation duplicate checking (based on `date`, `commerce`, and `amount`) and fault-tolerant per-item processing will prevent duplicate records in the database and provide clear summary feedback on created, existing, and errored items.

## What Changes

- **Duplicate Detection on Import**: Check if a transaction with the same `date`, `commerce`, and `amount` already exists in the database before creating it. If it already exists, skip creation and track it as an existing transaction.
- **Fault-Tolerant Processing**: When an error occurs while processing a single transaction item (e.g. invalid date format or malformed data), isolate the error, continue processing the remaining transactions in the list, and record the failed transaction along with error details.
- **Detailed Import Summary Response**: Update the `/api/transactions/` POST response payload to return a summary containing:
  - Total created count and list/details of created transactions
  - Total existing (skipped) count and list/details of already existing transactions
  - Total error count and list/details of errored transactions with associated error messages
- **Frontend Feedback Update**: Update the transaction import UI (`import.js`) to display the new detailed summary (created, existing duplicates skipped, and errors) upon import completion.

## Capabilities

### New Capabilities
- `transactions/import-deduplication`: Deduplicate incoming transactions by date, commerce, and amount during import, handle item-level errors gracefully without failing the entire batch, and provide a structured summary response containing created, existing, and errored transactions.

### Modified Capabilities

## Impact

- **API Response Shape**: `POST /api/transactions/` response structure changes from `{"status": "success", "created": N}` to a rich summary format containing counts and item details for created, existing, and errored transactions.
- **Backend**: `src/transactions/views.py` (and/or `src/core/repositories/transactions.py`) will implement duplicate check queries and per-item error isolation.
- **Frontend**: `src/static/scripts/transactions/import.js` will handle and display the granular import summary to the user.
