# Design

## Context

The uncategorize page is a Django template (`src/templates/transactions/uncategorize.html`) hydrated by a vanilla ES module (`src/static/scripts/transactions/uncategorize.js`). The module already fetches `GET /api/transactions/uncategorize/`, renders transaction cards, and holds a private `#transactions` array plus a `#currentId`. The modal markup already contains Previous/Next buttons with no handlers, and its Budget/Category selects are never populated. The update view `api_details` writes `budgets` and `sections` keys that are not valid model fields (the model uses `budgets` FK and `subcategory` FK), so a save would fail even if the form were valid. The global navigation lives in `src/templates/base.html` and currently ends with a bell button carrying a static red dot; `src/static/scripts/script.js` (`GlobalManager`) initializes on every page, so it is the natural host for a page-independent count indicator. See proposal.md for motivation and the delta spec for required behavior.

## Goals / Non-Goals

**Goals:**
- Keep the page single-page and re-use the existing list endpoint as the count source.
- Re-use the existing modal, notification service, and `ApiService`.
- Make the categorize round-trip actually persist budget, subcategory, and `Categorized` status.
- Surface the same uncategorized count in the global navigation on every page.
- Touch only the transactions/categories view layer, the uncategorize frontend module, and the shared navigation script.

**Non-Goals:**
- No new transaction statuses, model fields, or migrations.
- No pagination, filtering, searching, or bulk categorization on this page.
- No redesign of the modal or its styling.
- No changes to the related/duplicates pages or the general transactions index.
- No changes to the bell icon or its existing decoration, and no notification-center behavior for the new indicator.
- No polling or background refresh of the navigation badge.

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
After a successful save, hide the modal, emit a success notification, and re-run the initial load so both the cards and the count reflect server truth. Recomputing locally is rejected because concurrent changes would make the local list diverge. Each count update also publishes the refreshed number through the `uncategorized:updated` event so the navigation badge follows the same server truth without an extra request.

### Remove the temporary debug button
The "Open Modal (temp)" button was added only to inspect the modal; the panel click path supersedes it. Remove it in the same change and leave the summary panel as the entry point.

### Render the navigation indicator from the shared count
Add an hourglass anchor (`bi-hourglass`, `href` to `/transactions/uncategorize/`) immediately after the bell button inside the existing `ms-auto d-flex align-items-center` container in `base.html`. Its badge is a Bootstrap `position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger` element carrying a `d-none` class by default, so the indicator renders badge-less until data arrives and stays that way if the fetch fails.

`GlobalManager.init()` gains `#initUncategorizedIndicator()`, which fetches `GET /api/transactions/uncategorize/`, takes `data.length`, and sets the badge text and `d-none` state. Loading the count from the same endpoint the panel uses guarantees both numbers agree by construction, and an indicator-local `try/catch` keeps a failure silent so unrelated pages are never interrupted by a notification.

- Alternative: render the count server-side in `base.html`. Rejected: the count would be stale for the whole SPA session and `base.html` gains a per-request query on every page.
- Alternative: a dedicated `GET /api/transactions/uncategorize/count/` endpoint. Rejected: two count paths invite divergence; the list is small and already cached by the page.
- Alternative: poll on an interval. Rejected: unnecessary load, and the only mutation path in this change already refreshes the count.
- Alternative: place the indicator inside the offcanvas side menu next to the existing uncategorize link. Rejected: the request is a top-nav indicator beside the bell.

### Update the badge from the page's refreshed count
`uncategorize.js` already recomputes the count after a successful save. Instead of fetching again, it dispatches a `window` `CustomEvent('uncategorized:updated')` with `detail: { count }` after each count update; `GlobalManager` listens and writes that count into the badge, hiding it at zero.

- Alternative: re-fetch the list from the nav listener. Rejected: a duplicate request per save when the page holds the authoritative list.
- Alternative: share a singleton store module. Rejected: more indirection than a one-field event for a single consumer.

### Accessibility and zero state
The anchor carries an `aria-label` that names the destination. When a count is present the badge text is exposed as part of the anchor's accessible name via `aria-live="polite"` on the badge; at zero the badge is `d-none` and therefore absent from the accessibility tree, matching the hidden-state requirement.

- Alternative: co-locate a visually hidden count span. Rejected: duplicates text the badge already provides.

## Risks / Trade-offs

- [Concurrent updates shift the list between fetch and save] → the server remains the source of truth; a failed/404 save shows an error and the next refresh corrects the list.
- [Active budgets may not include a needed budget] → the endpoint is the existing product convention; expanding scope to all budgets is a separate decision.
- [Subcategory list can be large] → a native select is acceptable for the current data size; a searchable picker is deferred.
- [Saving while the index points past the list after a refresh] → the refresh is triggered only after a successful save and resets the loaded array; the index is reset on each load.
- [Removing the debug button could surprise someone using it internally] → the panel click provides the same capability.
- [The navigation indicator adds a request to every page load] → it is the same small list fetch the uncategorize page already makes, failures are swallowed, and the indicator simply renders without a badge.
- [The badge can go stale if a transaction is categorized in another tab or directly in the database] → the badge re-fetches on the next page load; polling is deliberately out of scope.
- [A page that fails to load the count could look like "zero pending"] → the indicator still renders, so a missing badge reads as unknown rather than a confirmed zero, and page navigation is unaffected.

## Migration Plan

1. Deploy the backend changes (`api_details` mapping and the subcategory list route).
2. Deploy the template/script changes (including the navigation indicator in `base.html` and `GlobalManager`); no database migrations are required.
3. Verify by loading `/transactions/uncategorize/`, categorizing one transaction, and confirming the count drops and the record shows `Categorized`; also load an unrelated page (for example `/transactions/`) and confirm the navigation badge shows the same number.
4. Rollback: revert the commit; no data migration to undo. Transactions already categorized remain `Categorized` by design.
