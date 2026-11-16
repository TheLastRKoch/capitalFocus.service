# Design

## Context

`src/templates/budgets/details.html` renders the **Budget projection** card with a pencil edit button and `#projectionValue`. `src/static/scripts/budgets/details.js` (`BudgetDetailsManager`) fetches `GET /api/budgets/<id>/complete` in `#fetchBudgetDetails()`, stores it in `#budget`, and renders summary values in `#render()` / `#updateOverview()`. The complete-budget response already includes `budget_spent` and `budget_remaining` (`projection - budget_spent`, computed in `src/budgets/views.py::api_get_by_id_complete`) as decimal strings; it also still returns `budget_encumbered_remaining`, which this card no longer shows. See proposal.md for motivation and the delta spec for required behavior.

## Goals / Non-Goals

**Goals:**
- Add the toggle and values with only template + existing manager changes.
- Reuse the already-fetched `#budget` payload; no extra request when toggling.
- Keep the values correct across the existing in-place refresh path.

**Non-Goals:**
- No changes to `/api/budgets/<id>/complete/` or any backend code.
- No changes to the edit-projection modal or its save behavior.
- No new summary cards or navigation changes.
- No persistence of the expanded state across full page reloads.

## Decisions

### Use the existing Bootstrap Collapse behavior
The toggle is a `<button data-bs-toggle="collapse" data-bs-target="#projectionDetails" aria-controls="projectionDetails" aria-expanded="false">` inside the projection card header, next to the pencil button. A `<div id="projectionDetails" class="collapse">` under `#projectionValue` holds the two rows.

Bootstrap already ships with the page bundle and is used for the section accordions, so this needs no custom open/close state or click handler.

- Alternative: hand-rolled class toggling in `details.js`. Rejected: duplicates state management and loses built-in transition/accessibility behavior.
- Alternative: a modal instead of an inline area. Rejected: the request is a disclosure panel; inline avoids interrupting the page context.

### Swap the chevron icon on collapse events
The button starts with `bi-chevron-down`. Listen to `show.bs.collapse` / `hide.bs.collapse` on `#projectionDetails` and swap to `bi-chevron-up` / `bi-chevron-down`. Bootstrap updates `aria-expanded` on the trigger, satisfying the accessible-state requirement.

- Alternative: CSS rotation of one icon. Rejected: requires a new style rule for a one-off control.
- Alternative: update the icon in the click handler. Rejected: click can race with the collapse transition; events are authoritative.

### Render values from the existing `#budget` payload
Add `spent` and `budgetRemaining` element references (bound to `#spentValue` and `#budgetRemainingValue`) and set their text in `#render()` using `Formatter.formatCurrency(budget.budget_spent || 0)` and `Formatter.formatCurrency(budget.budget_remaining || 0)`. The budget card markup is static, so refreshes only change text and the expanded state survives.

- Alternative: reuse `#remainingValue`. Rejected: that ID is the **Budget remaining** summary card (`this.#elements.remaining`), so a second `#remainingValue` would produce duplicate IDs and bind the wrong node.

- Alternative: fetch `/complete/` again when expanding. Rejected: redundant network work and would allow the values to diverge from the rest of the page.
- Alternative: compute values client-side from sections. Rejected: the server already computes and returns the authoritative amounts, including `budget_remaining`.

### Show Remaining instead of Encumbered remaining
The second details row shows `budget_remaining` rather than `budget_encumbered_remaining`. `budget_remaining` is derived server-side as `projection - budget_spent`, while `budget_encumbered_remaining` is `projection - budget_encumbered` (encumbered, not spent). The card therefore reports what is left of the projection after actual spending, which is the value requested for this panel.

This value is distinct from the existing **Budget remaining** summary card, which shows `projection - sum(section projections)` (unallocated). Both stay on the page: the card reports allocation space, the details row reports the API's spending remainder.

- Alternative: keep displaying both encumbered and unencumbered remainders. Rejected: the panel stays a two-row disclosure and the request is to replace, not add.
- Alternative: derive remaining client-side from `projection - budget_spent`. Rejected: duplicates server logic and can drift from the API's rounding.

### Labels
Use **Spent** and **Remaining** to mirror the API field names without internal underscores.

## Risks / Trade-offs

- [Decimal values arrive as strings] → `Formatter.formatCurrency` coerces them; missing/null values fall back to `0` per the spec.
- [`budget_remaining` restates the other rows] → it equals projection minus spent, so it overlaps the projection value and the Spent row; it is still shown because it is the server-computed remainder and keeps the panel aligned with the API contract.
- [Bootstrap collapse transition timing] → icon swaps on Bootstrap events, not on click, so it stays consistent with the visible state.
- [Users expect the panel to stay open after a page reload] → out of scope; state is per-session DOM state.
- [Extra vertical space when expanded] → the details area is inside the existing card and collapses fully, so the grid height returns to normal when closed.

## Migration Plan

1. Deploy the template and `details.js` changes; no backend or database migration is required.
2. Verify on `/budgets/<id>`: the details start collapsed, expanding shows the two formatted values (Spent and Remaining), refreshing keeps the state and updates values.
3. Rollback: revert the commit; no data changes to undo.
