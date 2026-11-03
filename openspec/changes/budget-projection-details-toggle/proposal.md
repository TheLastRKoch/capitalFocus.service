# Proposal

## Why

The Budget projection card on `/budgets/<id>` shows only the budget's projection total. Users cannot see how much of that projection has actually been spent or how much of the encumbered amount remains without leaving the page; both values are already returned by `GET /api/budgets/<id>/complete/` but are never surfaced.

## What Changes

- Add a down-arrow toggle button to the **Budget projection** card.
- Collapsed by default; clicking it expands a details area under the projection value.
- The expanded area shows **Spent** (`budget_spent`) and **Encumbered remaining** (`budget_encumbered_remaining`) from the existing complete-budget API, formatted with the shared currency formatter.
- The arrow reflects state (down when collapsed, up when expanded) and exposes accessible expanded state.
- Refreshing the page data updates both values in place while preserving the expanded/collapsed state.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `budgets/budget-details`: adds the projection-card details toggle and its data display to the existing budget details behavior.

## Impact

- Template: `src/templates/budgets/details.html` (toggle button and details markup in the projection card).
- Frontend: `src/static/scripts/budgets/details.js` (bind toggle elements, render `budget_spent` / `budget_encumbered_remaining` from the already-fetched budget payload).
- APIs: `GET /api/budgets/<id>/complete/` reused as-is; no endpoint changes.
- Data: no models or migrations.
- Dependencies: none.
