## 1. Backend Duplicate Checking & Resilient Import

- [x] 1.1 Add existence checking method in `TransactionsRepository` (or check directly on `TransactionsModel` in `views.py`) by `date`, `commerce`, and `amount`, and verify with Python interactive shell / unit test
- [x] 1.2 Update `api_list` POST handler in `src/transactions/views.py` to isolate each item in a try/except block, check for existing transactions, skip duplicates, catch errors per item, and continue processing remaining items
- [x] 1.3 Update the JSON response of `api_list` to return the detailed summary structure with `created`, `existing`, `errors`, and their counts (`created_count`, `existing_count`, `error_count`)

## 2. Frontend Summary Feedback

- [x] 2.1 Update `TransactionImportManager.#handleImport` in `src/static/scripts/transactions/import.js` to process the structured summary response
- [x] 2.2 Enhance frontend feedback to display total created, existing skipped, and any errored transactions clearly to the user after import

## 3. Verification

- [x] 3.1 Verify with a test payload containing a mix of new transactions, already existing transactions, and an invalid transaction to confirm proper deduplication, fault tolerance, and summary output
