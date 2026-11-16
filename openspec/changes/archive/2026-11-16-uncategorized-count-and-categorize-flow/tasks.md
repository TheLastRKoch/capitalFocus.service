# Tasks

## 1. Backend APIs

- [x] 1.1 Add a subcategory list method to the categories repository/layer and expose `GET /api/subcategory/` returning `id`, `label`, `parent_label` ordered by parent then label; verify with `python manage.py check` and a request to `/api/subcategory/` returning 200 and the expected JSON array
- [x] 1.2 Fix `api_details` so a `PUT /api/transactions/<id>/` maps `budget` → `budgets_id`, `category` → `subcategory_id`, sets `status` to `Categorized`, and returns 404 for an unknown id; verify by categorizing a seeded transaction and re-reading it from the API/DB

## 2. Uncategorize Page

- [x] 2.1 Render the `GET /api/transactions/uncategorize/` list length into the "Pending Transactions" count, showing `0` for an empty list; verify by loading `/transactions/uncategorize/` with and without uncategorized rows
- [x] 2.2 Make the summary panel open the modal with the first uncategorized transaction and wire Previous/Next to move through the loaded list with the controls disabled at the boundaries; verify by clicking the panel and stepping through several transactions
- [x] 2.3 Populate the Budget select from `GET /api/budgets/active/` and the Category select from `GET /api/subcategory/`, keeping placeholders and notifying on failure; verify both selects show options after load and that a failing endpoint leaves its placeholder plus an error notification
- [x] 2.4 Enforce Budget + Category selection before saving, submit `PUT /api/transactions/<id>/`, close the modal, show the success notification, and re-fetch the list/count; verify that an empty selection sends no request and a valid save removes the card and decrements the count
- [x] 2.5 Remove the temporary "Open Modal (temp)" debug button from the template and confirm the page still opens the modal from the summary panel
- [x] 2.6 Dispatch a `window` `uncategorized:updated` custom event carrying the current count whenever the page updates its count; verify the event fires on initial load and after a successful save

## 3. Navigation Indicator

- [x] 3.1 Add an hourglass anchor (`bi-hourglass`, linking to `/transactions/uncategorize/`, `aria-label` naming the destination) immediately to the right of the bell in `base.html`, containing a badge element that starts hidden; verify every page renders the indicator and the badge is not visible before data loads
- [x] 3.2 Add `#initUncategorizedIndicator()` to `GlobalManager` (`script.js`): fetch `/api/transactions/uncategorize/`, render `data.length` into the badge, keep the badge hidden at zero, and swallow failures so no notification is shown; verify on `/transactions/` that the badge matches the API count and that a forced failure leaves the indicator badge-less
- [x] 3.3 Subscribe to `uncategorized:updated` in `GlobalManager` and write the event's count into the badge (hiding it at zero); verify that categorizing a transaction on `/transactions/uncategorize/` updates the badge without an extra request

## 4. Integration Verification

- [x] 4.1 Run `openspec validate uncategorized-count-and-categorize-flow --strict` and confirm no errors or warnings
- [x] 4.2 Perform an end-to-end manual pass: load the page, open the modal from the panel, navigate, categorize a transaction, and confirm the list, count, notification, navigation badge, and stored `Categorized` status all agree
- [x] 4.3 Confirm the navigation badge shows the same number as the "Pending Transactions" panel and that it is hidden when no uncategorized transactions remain

## Workflow follow-up

- Archive the change after review and verification are complete.
