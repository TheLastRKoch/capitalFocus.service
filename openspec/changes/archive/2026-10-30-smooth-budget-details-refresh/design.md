# Design

## Context

In `src/static/scripts/budgets/details.js`, the `BudgetDetailsManager` class handles all data loading and DOM updates for `/budgets/<id>`. Currently, both the Refresh button (`#refreshSections`) and the section Balance buttons call `this.init()`.

`init()` unconditionally executes:
```javascript
this.showLoader(this.#elements.loader);
if (this.#elements.accordion) this.#elements.accordion.innerHTML = '';
```
This causes the entire categories accordion to unmount, destroying user scroll context and collapsing all opened section panels while the API requests complete.

## Goals / Non-Goals

**Goals:**
- Separate initial page load (which displays the skeleton loader) from incremental data refreshes (`refreshData({ silent })`).
- Fetch `/api/budgets/<id>/complete` and `/api/budgets/<id>/missing_sections/` asynchronously in the background.
- Capture the set of currently expanded section IDs prior to re-render, and restore their expanded state in the generated HTML.
- Provide localized loading feedback on the Refresh button (temporary icon rotation/disable) without showing the full container loader.
- Maintain existing DOM content if a background refresh fails, notifying the user via `NotificationService` instead of replacing the page with an error block.
- Invoke the smooth refresh flow automatically upon completing section balancing.

**Non-Goals:**
- Real-time server-push (WebSockets or Server-Sent Events).
- Introducing external client-side libraries (e.g., React, Vue, or morphdom). The solution must remain Vanilla JavaScript ES6 per project standards.
- Altering backend API contracts or database models.

## Decisions

### 1. Dedicated `refreshData` Method
- **Decision**: Create an asynchronous `refreshData({ isInitial = false })` method. `init()` calls `refreshData({ isInitial: true })` to show the initial loader. Subsequent manual refreshes and post-balance updates call `refreshData({ isInitial: false })`.
- **Rationale**: Keeps code DRY while ensuring the disruptive container spinner and `innerHTML = ''` reset only occur on first load.
- **Alternatives Considered**: Full page reload `location.reload()` (current perception by user; causes full HTTP cycle and asset re-evaluation) or duplicating fetch logic in balance handlers.

### 2. State-Preserving Accordion Re-render
- **Decision**: Before re-rendering the accordion HTML, query open collapse elements:
  ```javascript
  const openCollapseIds = new Set(
      Array.from(this.#elements.accordion.querySelectorAll('.collapse.show')).map(el => el.id)
  );
  ```
  Pass these IDs into the render logic so matching panels render with `.collapse.show` and their toggle buttons with `aria-expanded="true"` and without the `.collapsed` class.
- **Rationale**: Ensures smooth continuity without visual collapse/expand animations or misplaced scroll positions.
- **Alternatives Considered**: Direct in-place DOM attribute patching (e.g. finding and updating each text node). Rejected because sections or transactions may be added, deleted, or reordered; re-rendering with preserved state is cleaner and simpler.

### 3. Localized Button Feedback
- **Decision**: When a refresh is triggered manually via `#refreshSections`:
  - Add a spinning CSS animation class to the `<i class="bi bi-arrow-clockwise"></i>` icon.
  - Set `refreshBtn.disabled = true`.
  - In a `finally` block, remove the animation class and re-enable the button.
- **Rationale**: Clear visual affordance that data is updating without blocking the user from reading existing data.

### 4. Non-Destructive Error Handling
- **Decision**: On background refresh error, keep the current DOM intact and display a warning toast (`NotificationService.show('Failed to refresh data', 'danger')`). Only show the blocking error screen (`renderError`) if the initial page load fails.
- **Rationale**: Prevents users from losing view of their data due to transient network hiccups.

## Risks / Trade-offs

- **[Rapid repeated clicks on Refresh or Balance]** → *Mitigation*: Guard with an `isRefreshing` boolean lock and disable action buttons while an operation is in flight.
- **[Stale state if budget ID changes in URL]** → *Mitigation*: Continue resolving budget ID from URL on each refresh pass if not cached.
