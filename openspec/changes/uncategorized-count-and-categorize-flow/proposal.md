# Proposal

## Why

The `/transactions/uncategorize/` page shows a "Pending Transactions" panel with a hardcoded `...` placeholder, and its categorization modal cannot be used end-to-end: the Budget/Category dropdowns are never populated, no element opens the modal from the summary panel, and the save path sends payload keys the backend does not map to real model fields. Users can therefore neither see how much work remains nor categorize an uncategorized transaction from this page.

## What Changes

- Display the live count of transactions whose `status` is `Uncategorized` in the "Pending Transactions" panel.
- Make the panel open the existing `#transactionModal` populated with the first uncategorized transaction; add working Previous/Next navigation through the loaded transactions.
- Populate the Budget dropdown from the existing active-budgets API and the Category dropdown from subcategory data, so a transaction can actually be categorized.
- Enforce Budget + Category selection before saving; on success set the transaction `status` to `Categorized`, persist the selected budget and subcategory, close the modal, show a success notification, and refresh the list/count.
- Fix `PUT /api/transactions/<id>/` to map the submitted `budget`/`category` values onto the model's `budgets` and `subcategory` relations instead of writing non-existent `budgets`/`sections` values.
- Add a subcategory list endpoint (`GET /api/subcategory/`) so the Category dropdown has data; the existing API only supported lookup by id.
- Remove the temporary debug "Open Modal (temp)" button once the panel click path is in place.

## Capabilities

### New Capabilities

- `transactions/uncategorized-transactions`: Counting, presenting, navigating, and categorizing transactions whose status is `Uncategorized` on the `/transactions/uncategorize/` page, including the supporting JSON APIs.

### Modified Capabilities

- None. (`transactions/related-transactions` and `budgets/budget-details` behavior is unchanged.)

## Impact

- Templates: `src/templates/transactions/uncategorize.html` (count value, clickable panel, option placeholders, temporary button removal).
- Frontend: `src/static/scripts/transactions/uncategorize.js` (count rendering, panel click + prev/next navigation, option loading, save/handler refresh).
- Backend: `src/transactions/views.py` (`api_details` field mapping, `api_uncategorize` remains the count source), `src/categories/views.py` (subcategory list), `src/core/urls.py` (new subcategory list route).
- APIs: `GET /api/transactions/uncategorize/` (reused as count source), `GET /api/budgets/active/` (reused), new `GET /api/subcategory/`, corrected `PUT /api/transactions/<id>/`.
- Data: no migrations; `TransactionsModel.status`, `budgets`, and `subcategory` already exist.
- Dependencies: none.
