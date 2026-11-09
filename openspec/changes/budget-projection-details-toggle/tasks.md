# Tasks

## 1. Projection Card Markup

- [x] 1.1 Add a chevron toggle button (`bi-chevron-down`, `aria-expanded="false"`, `aria-controls`) beside the pencil button and a collapsed `#projectionDetails` area under `#projectionValue` containing labeled `#spentValue` and `#encumberedRemainingValue` outputs; verify `GET /budgets/<id>` renders both ids and the details area has the `collapse` class with no `show`

## 2. Details Behavior

- [x] 2.1 Add element references and render `budget.budget_spent` and `budget.budget_encumbered_remaining` with `Formatter.formatCurrency`, falling back to `0`; verify the displayed text matches `GET /api/budgets/<id>/complete/` for the loaded budget
- [x] 2.2 Swap the chevron between down and up on `show.bs.collapse` / `hide.bs.collapse` for `#projectionDetails` and confirm `aria-expanded` tracks the state; verify by expanding and collapsing the panel
- [x] 2.3 Confirm the values update in place while the expanded/collapsed state is preserved when Refresh re-fetches the complete budget; verify by expanding, refreshing, and checking the values and open state
- [x] 2.4 Confirm expanding or collapsing the details sends no additional budget request; verify no new `/api/budgets/<id>/complete` call appears in the network panel on toggle

## 3. Verification

- [x] 3.1 Run `openspec validate budget-projection-details-toggle --strict` and confirm no errors or warnings
- [x] 3.2 Perform an end-to-end pass on `/budgets/<id>`: details start collapsed, expanding shows both formatted amounts from the API, collapsing hides them, and Refresh updates them without changing the open state

## Workflow follow-up

- Archive the change after review and verification are complete.
