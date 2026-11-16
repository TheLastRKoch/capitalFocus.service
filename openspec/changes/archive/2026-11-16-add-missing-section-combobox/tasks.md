# Tasks

## 1. Modal Markup

- [x] 1.1 In `src/templates/budgets/details.html`, replace the `#newCategoryName` text input and `#datalistOptions` datalist with `<select id="newSectionCategory" required>` containing a disabled placeholder option, keeping `id="newCategoryBudget"` for the projection; confirm the rendered modal has no free-text name field.
- [x] 1.2 Give the Save button an empty-state hook (e.g. `id="saveNewCategoryBtn"`) that can be disabled when no missing sections are available; verify the button exists in the modal footer and toggles disabled state.

## 2. Loading Missing Sections Into the Combobox

- [x] 2.1 Refactor `#fetchMissingSections()` in `src/static/scripts/budgets/details.js` to fetch the missing sections once and populate `#newSectionCategory` with one option per section (`value` = category ID, text = category label); verify the options match `GET /api/budgets/<id>/missing_sections/`.
- [x] 2.2 Render a disabled "No missing sections" option and disable the Save button when the response is empty or the request fails; verify the empty state appears for a budget with all categories already sectioned.
- [x] 2.3 Keep (or re-render) the existing `#missing-sections-menu` dropdown from the same fetched data so the page does not issue duplicate requests; verify both lists stay consistent after Refresh.

## 3. Complete Create Payload

- [x] 3.1 Update `#handleCreateSection()` to read the selected option and POST `{ label, category_id, projection }` (label from option text, category as an integer, projection parsed from `#newCategoryBudget`) to `/api/budgets/<budgetId>/sections/`; verify via browser dev tools that the request body contains all three fields.
- [x] 3.2 Guard submission when no option is selected or the projection is not a finite number, preventing the request and leaving native required-field feedback; verify nothing is sent for an empty form.
- [x] 3.3 On success, reset and hide the modal, show the success notification, and re-run `init()`; on failure show the error notification and keep the modal open. Verify the created section appears in the accordion and disappears from the combobox.

## 4. Integration Verification

- [x] 4.1 Manually exercise the flow on `/budgets/<id>`: select a missing section, enter a projection, save, and confirm the created section's `label`, `category`, and `projection` in the database/API (`GET /api/budgets/<id>/complete`).
- [x] 4.2 Confirm the second save attempt for the same category is impossible because it is no longer listed, and that the standalone missing-sections dropdown is unchanged.

## Workflow follow-up

- Archive the change after manual verification is complete.
