# Design

## Context

`src/templates/budgets/details.html` renders the **Budget projection** card with a pencil edit button and `#projectionValue`. `src/static/scripts/budgets/details.js` (`BudgetDetailsManager`) fetches `GET /api/budgets/<id>/complete` in `#fetchBudgetDetails()`, stores it in `#budget`, and renders summary values in `#render()` / `#updateOverview()`. The complete-budget response already includes `budget_spent` and `budget_encumbered_remaining` as decimal strings (verified: `"1653348.10"` and `"0.00"` for budget 1). See proposal.md for motivation and the delta spec for required behavior.

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
Add `spent` and `encumberedRemaining` element references and set their text in `#render()` using `Formatter.formatCurrency(budget.budget_spent || 0)` and `Formatter.formatCurrency(budget.budget_encumbered_remaining || 0)`. The budget card markup is static, so refreshes only change text and the expanded state survives.

- Alternative: fetch `/complete/` again when expanding. Rejected: redundant network work and would allow the values to diverge from the rest of the page.
- Alternative: compute values client-side from sections. Rejected: the server already computes and returns the authoritative amounts.

### Labels
Use **Spent** and **Encumbered remaining** to mirror the API field names without internal underscores.

## Risks / Trade-offs

- [Decimal values arrive as strings] → `Formatter.formatCurrency` coerces them; missing/null values fall back to `0` per the spec.
- [Bootstrap collapse transition timing] → icon swaps on Bootstrap events, not on click, so it stays consistent with the visible state.
- [Users expect the panel to stay open after a page reload] → out of scope; state is per-session DOM state.
- [Extra vertical space when expanded] → the details area is inside the existing card and collapses fully, so the grid height returns to normal when closed.

## Migration Plan

1. Deploy the template and `details.js` changes; no backend or database migration is required.
2. Verify on `/budgets/<id>`: the details start collapsed, expanding shows the two formatted values, refreshing keeps the state and updates values.
3. Rollback: revert the commit; no data changes to undo.
