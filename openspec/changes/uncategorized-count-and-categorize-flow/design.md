# Design

## Context

The uncategorize page is a Django template (`src/templates/transactions/uncategorize.html`) hydrated by a vanilla ES module (`src/static/scripts/transactions/uncategorize.js`). The module already fetches `GET /api/transactions/uncategorize/`, renders transaction cards, and holds a private `#transactions` array plus a `#currentId`. The modal markup already contains Previous/Next buttons with no handlers, and its Budget/Category selects are never populated. The update view `api_details` writes `budgets` and `sections` keys that are not valid model fields (the model uses `budgets` FK and `subcategory` FK), so a save would fail even if the form were valid. See proposal.md for motivation and the delta spec for required behavior.

## Goals / Non-Goals

**Goals:**
- Keep the page single-page and re-use the existing list endpoint as the count source.
- Re-use the existing modal, notification service, and `ApiService`.
- Make the categorize round-trip actually persist budget, subcategory, and `Categorized` status.
- Touch only the transactions/categories view layer and the uncategorize frontend module.

**Non-Goals:**
- No new transaction statuses, model fields, or migrations.
- No pagination, filtering, searching, or bulk categorization on this page.
- No redesign of the modal or its styling.
- No changes to the related/duplicates pages or the general transactions index.

## Decisions

### Reuse `GET /api/transactions/uncategorize/` for the count
The list is already required to render cards, so the count is `data.length` from the same response. This avoids a second request and keeps the count consistent with the rendered list.

- Alternative: a dedicated `/api/transactions/uncategorize/count/` endpoint. Rejected: duplicate logic, an extra round trip, and a risk of count/list divergence.
- Alternative: server-rendered count in the template. Rejected: the page is already client-rendered, and the count must refresh after each save.

### Panel click opens the modal at index 0
The module keeps a `#currentIndex` alongside `#currentId`. Panel click calls the existing selection/populate routine with `#transactions[0]`; Prev/Next move the index and call the same routine. Select a transaction by index (not by fresh DOM lookup) so the modal stays in sync with the loaded array.

- Alternative: make the panel just scroll/filter the list. Rejected: the requested flow is modal-driven.
- Alternative: reconstruct the transaction from the rendered card. Rejected: lossy and fragile.

Boundary behavior: Prev is disabled at index 0 and Next at the last index. Disabled state is recalculated each time the modal populates. Alternative wrap-around navigation rejected as surprising for a bounded review queue.

### Populate options from APIs on load
Budgets come from the existing `GET /api/budgets/active/`. Categories are subcategories; there is no list endpoint today, so add `GET /api/subcategory/` returning `id`, `label`, and `parent_label`, ordered by parent label then label. Rendering the label as `(Parent) Child` makes the hierarchy readable in a flat select.

- Alternative: derive categories from the selected budget's sections (`/api/budgets/<id>/complete`). Rejected: the transaction stores a `subcategory` FK, not a section, and it would couple the form to a budget before the budget is chosen.
- Alternative: embed options in the Django template. Rejected: stale data and duplicated query logic.

Option loading is independent of transaction loading: a failure in one must not blank the other. Each failure keeps the placeholder and surfaces a notification.

### Correct the update mapping in `api_details`
Replace the invalid `budgets`/`sections` payload with `budgets_id` and `subcategory_id`, always setting `status` to `Categorized`. Validate the transaction exists first and return 404 when it does not. The base repository update path already accepts `*_id` keys.

- Alternative: change the repository to accept nested relation objects. Rejected: broader blast radius across repositories and no other caller needs it.
- Alternative: let the client send `budgets_id`/`subcategory_id`. Rejected: the existing public contract uses `budget`/`category`; keep the API friendly and normalize server-side.

### Refresh by re-running the existing fetch
After a successful save, hide the modal, emit a success notification, and re-run the initial load so both the cards and the count reflect server truth. Recomputing locally is rejected because concurrent changes would make the local list diverge.

### Remove the temporary debug button
The "Open Modal (temp)" button was added only to inspect the modal; the panel click path supersedes it. Remove it in the same change and leave the summary panel as the entry point.

## Risks / Trade-offs

- [Concurrent updates shift the list between fetch and save] → the server remains the source of truth; a failed/404 save shows an error and the next refresh corrects the list.
- [Active budgets may not include a needed budget] → the endpoint is the existing product convention; expanding scope to all budgets is a separate decision.
- [Subcategory list can be large] → a native select is acceptable for the current data size; a searchable picker is deferred.
- [Saving while the index points past the list after a refresh] → the refresh is triggered only after a successful save and resets the loaded array; the index is reset on each load.
- [Removing the debug button could surprise someone using it internally] → the panel click provides the same capability.

## Migration Plan

1. Deploy the backend changes (`api_details` mapping and the subcategory list route).
2. Deploy the template/script changes; no database migrations are required.
3. Verify by loading `/transactions/uncategorize/`, categorizing one transaction, and confirming the count drops and the record shows `Categorized`.
4. Rollback: revert the commit; no data migration to undo. Transactions already categorized remain `Categorized` by design.
