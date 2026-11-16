## Why

When importing transactions via the `/api/transactions/` endpoint, imported records may lack an explicit status or have an empty status field, causing inconsistent behavior or bypassing the uncategorized review workflow (`/transactions/uncategorize/`). However, imported records that already specify a status (e.g., from an external system or export) must retain that status. Newly imported transactions that have an empty or omitted status must be assigned the status `Uncategorized` so they can be reviewed and categorized by the user.

## What Changes

- **Preserve Provided Status on Import**: When an incoming transaction item in `POST /api/transactions/` supplies a non-empty `status` (such as `'Categorized'` or `'Pending'`), preserve that status on creation.
- **Default Empty Status to Uncategorized**: If an incoming transaction item omits `status`, or provides an empty/whitespace or null value, automatically set `status = 'Uncategorized'`.
- **Workflow Integrity**: Ensure imported transactions with an empty or omitted status properly appear in the uncategorized transactions listing (`GET /api/transactions/uncategorize/`) for user review and categorization.

## Capabilities

### New Capabilities
- `transactions/import-uncategorized-status`: Preserves any explicit status provided during bulk transaction import via `POST /api/transactions/`, while automatically defaulting empty or omitted statuses to `'Uncategorized'`.

### Modified Capabilities

## Impact

- **Backend**: `src/transactions/views.py` (`api_list` POST handler) will inspect the incoming `status` for each item; if empty or omitted, it defaults to `'Uncategorized'`, otherwise it keeps the supplied status value.
- **API**: `POST /api/transactions/` persists items with their provided status if non-empty, or `'Uncategorized'` if empty.
- **User Experience**: Newly imported transactions without a status will consistently show up on `/transactions/uncategorize/` and display the "Uncategorized" badge, while transactions imported with explicit statuses will maintain them.
