# Tasks

## 1. Core Refresh Refactor & State Preservation

- [x] 1.1 Decouple data fetching from initial page loading by introducing `refreshData({ isInitial = false })` in `src/static/scripts/budgets/details.js`, ensuring the full container loader (`#categoriesLoader`) and DOM clearing only trigger on `isInitial: true`. Verify that loading the page initially still displays the skeleton loader.
- [x] 1.2 Implement accordion collapse state capture and restoration in `BudgetDetailsManager.#render()`, capturing active `.collapse.show` identifiers before rebuilding section HTML and re-applying `show` and `aria-expanded` attributes. Verify that an expanded accordion section remains open after data re-renders.

## 2. Interactive Feedback & Balance Integration

- [x] 2.1 Connect `#refreshSections` click handler to `refreshData({ isInitial: false })`, adding temporary disabled state and spinning animation to the Refresh icon (`bi-arrow-clockwise`) during data retrieval. Verify that clicking Refresh updates budget figures without flickering the container or closing open sections.
- [x] 2.2 Update `#handleBalanceSection()` to call `refreshData({ isInitial: false })` upon a successful `PUT` response rather than invoking `this.init()`. Verify that clicking Balance updates section projection and overview numbers seamlessly without collapsing the section.
- [x] 2.3 Add non-destructive error handling to `refreshData()`, surfacing a danger toast via `NotificationService.show()` on background failure while leaving existing DOM content intact. Verify simulated network error during refresh retains current page content.

## 3. End-to-End Verification

- [x] 3.1 Validate the full `/budgets/<id>` user experience in the browser: test initial page load, clicking the Refresh button with multiple open accordion sections, balancing an overspent section, and creating a new section. Verify all operations execute smoothly with in-place data reconciliation.
