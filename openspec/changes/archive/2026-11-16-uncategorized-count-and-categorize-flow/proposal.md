# Proposal

## Why

The `/transactions/uncategorize/` page shows a "Pending Transactions" panel with a hardcoded `...` placeholder, and its categorization modal cannot be used end-to-end: the Budget/Category dropdowns are never populated, no element opens the modal from the summary panel, and the save path sends payload keys the backend does not map to real model fields. Users can therefore neither see how much work remains nor categorize an uncategorized transaction from this page. The count is also confined to that page, so users browsing anywhere else have no signal that uncategorized transactions are waiting.

## What Changes

- Display the live count of transactions whose `status` is `Uncategorized` in the "Pending Transactions" panel.
- Add an hourglass indicator (`bi-hourglass`) to the right of the bell in the global navigation, linking to `/transactions/uncategorize/`, with a numeric badge at its top-right showing the same uncategorized count on every page. The badge is hidden when the count is zero.
- Make the panel open the existing `#transactionModal` populated with the first uncategorized transaction; add working Previous/Next navigation through the loaded transactions.
- Populate the Budget dropdown from the existing active-budgets API and the Category dropdown from subcategory data, so a transaction can actually be categorized.
- Enforce Budget + Category selection before saving; on success set the transaction `status` to `Categorized`, persist the selected budget and subcategory, close the modal, show a success notification, and refresh the list/count.
- Fix `PUT /api/transactions/<id>/` to map the submitted `budget`/`category` values onto the model's `budgets` and `subcategory` relations instead of writing non-existent `budgets`/`sections` values.
- Add a subcategory list endpoint (`GET /api/subcategory/`) so the Category dropdown has data; the existing API only supported lookup by id.
- Remove the temporary debug "Open Modal (temp)" button once the panel click path is in place.
- Keep the navigation badge in sync after a categorization by updating it from the count the page already re-fetches; no separate count endpoint is added.

## Capabilities

### New Capabilities

- `transactions/uncategorized-transactions`: Counting, presenting, navigating, and categorizing transactions whose status is `Uncategorized` on the `/transactions/uncategorize/` page, surfacing the same count in the global navigation, including the supporting JSON APIs.

### Modified Capabilities

- None. (`transactions/related-transactions` and `budgets/budget-details` behavior is unchanged.)

## Impact

- Templates: `src/templates/base.html` (navigation hourglass indicator and badge), `src/templates/transactions/uncategorize.html` (count value, clickable panel, option placeholders, temporary button removal).
- Frontend: `src/static/scripts/script.js` (global indicator fetch/render and badge update listener), `src/static/scripts/transactions/uncategorize.js` (count rendering, panel click + prev/next navigation, option loading, save/handler refresh, publish the refreshed count for the navigation badge).
- Backend: `src/transactions/views.py` (`api_details` field mapping, `api_uncategorize` remains the count source), `src/categories/views.py` (subcategory list), `src/core/urls.py` (new subcategory list route).
- APIs: `GET /api/transactions/uncategorize/` (reused as the count source for both the panel and the navigation badge), `GET /api/budgets/active/` (reused), new `GET /api/subcategory/`, corrected `PUT /api/transactions/<id>/`.
- Data: no migrations; `TransactionsModel.status`, `budgets`, and `subcategory` already exist.
- Dependencies: none.
