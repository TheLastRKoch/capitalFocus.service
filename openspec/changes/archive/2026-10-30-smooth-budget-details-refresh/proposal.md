# Proposal

## Why

On the budget details page (`/budgets/<id>`), clicking the "Refresh" button or a section "Balance" button currently triggers a disruptive UI reset: the entire accordion container is emptied (`innerHTML = ''`), a large loading spinner flashes, and all open accordion sections collapse. Users need a smooth, in-place data refresh that silently recalls the API endpoints and updates numbers and transactions without resetting the user's view state or flickering the page.

## What Changes

- **Smooth In-Place Refresh**: Replace the disruptive DOM-clearing and full-container spinner logic with seamless background API fetching (`/api/budgets/<id>/complete` and `/api/budgets/<id>/missing_sections/`).
- **Accordion State Preservation**: Retain which category accordion panels are open across data refreshes so users do not lose their place while inspecting transactions.
- **Button-Level Loading Indicator**: Provide subtle visual feedback on the Refresh button (e.g., spinning icon and temporary button disable) instead of replacing page content with a loader.
- **Unified Balance Flow**: Align the section "Balance" button workflow with the smooth refresh mechanism, refreshing overview values and section numbers seamlessly upon successful balancing.
- **Summary & Dropdown Reconciliation**: Update overview cards (projection and remaining values) and the missing sections dropdown in-place without jarring layout jumps.

## Capabilities

### New Capabilities
- `budgets/budget-details`: Client-side presentation and smooth data synchronization for the budget details view, including in-place API re-fetching, accordion state persistence across updates, and non-disruptive refresh and balance triggers.

### Modified Capabilities
<!-- None: no existing capability specs modified -->

## Impact

- **Frontend Code**: `src/static/scripts/budgets/details.js` and minor styling/attributes in `src/templates/budgets/details.html`.
- **API Endpoints**: Reuses existing endpoints (`GET /api/budgets/<id>/complete`, `GET /api/budgets/<id>/missing_sections/`, `PUT /api/sections/<sectionId>`). No backend changes required.
- **Dependencies**: No external dependencies added.
