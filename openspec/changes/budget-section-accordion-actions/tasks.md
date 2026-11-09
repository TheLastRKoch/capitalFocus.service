# Tasks

## 1. Accordion Layout

- [x] 1.1 Move the Balance button from the section card header into the collapse body and add a row with total expended (`section.total_spent`, formatted) first, then Balance, then a new Edit button; verify the rendered section body shows the three items in order and the header no longer has Balance

## 2. Edit Mode

- [x] 2.1 Add ids to the section modal title and submit button, populate edit mode from the selected section (title **Edit Section**, submit **Save Changes**, section name shown/disabled, projection pre-filled), and open it from the accordion Edit button; verify the modal state after clicking Edit
- [x] 2.2 Branch the section form submit so edit mode validates the projection and sends `PUT /api/sections/<section_id>` with `{projection}` (no name), then closes the modal, shows a success notification, and refreshes in place; verify a changed projection persists and the section name is unchanged
- [x] 2.3 Block the update with validation feedback when the projection is empty or non-numeric; verify no request is sent
- [x] 2.4 Reset the modal to create mode on `hidden.bs.modal` (title **New Section**, submit **Save**, enabled selector repopulated from cached missing sections, empty projection) and verify creating a section still works from the FAB

## 3. Behavior Consistency

- [x] 3.1 Confirm Balance still updates the projection and refreshes from its new location, and that total expended plus header Proj/Rem values update without collapsing open accordions; verify with the Refresh/Balance paths

## 4. Verification

- [x] 4.1 Run `openspec validate budget-section-accordion-actions --strict` and confirm no errors or warnings
- [x] 4.2 Perform an end-to-end pass on `/budgets/<id>`: expand a section, check total/Balance/Edit order, balance it, edit its projection, then create a new section from the FAB

## 5. Missing Sections Dropdown

- [x] 5.1 Remove the Missing sections dropdown markup from `details.html` and `#renderMissingSectionsMenu()` plus its call from `details.js`, keeping `#fetchMissingSections()` and `#renderSectionOptions()`; verify `/budgets/<id>` has no `#missing-sections-menu` and the New Section selector still lists missing sections

## Workflow follow-up

- Archive the change after review and verification are complete.
