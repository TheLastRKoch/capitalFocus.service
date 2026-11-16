# Proposal

## Why

On `/budgets/<id>`, each section card keeps its actions in the header and never surfaces how much has actually been spent in that section, even though the complete-budget API already returns `total_spent`. There is also no way to adjust a section's projection without recreating it: the header only offers Balance, and the section is not editable after creation. The page also renders a **Missing sections** dropdown that duplicates the missing-sections data already used by the New Section modal and provides only jump links.

## What Changes

- Move the **Balance** button out of the section header and into the expanded accordion body.
- Inside the accordion body, lay out the section's **total expended** (`total_spent`), then **Balance**, then **Edit**, in that order.
- Keep the header showing the section label, projection (`Proj`), and remaining (`Rem`) as today.
- Add an **Edit** button that reuses the existing `#addCategoryModal`:
  - title changes to **Edit Section** and the submit button to **Save Changes**;
  - the section name is shown but disabled;
  - the projection is pre-filled and editable.
- Saving the edit updates the section projection through the existing section update API, shows a confirmation, and refreshes the page data in place.
- Closing the modal resets it to create mode so the floating **New Section** button continues to work unchanged.
- Total expended and the header values refresh in place after balancing, editing, or refreshing.
- Remove the **Missing sections** dropdown from the budget details page; the New Section selector continues to show missing sections.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `budgets/budget-details`: section card layout, accordion total/actions, and editing a section's projection through the shared section modal.

## Impact

- Template: `src/templates/budgets/details.html` (move Balance, add total expended and Edit inside the accordion; support the modal's edit mode; remove the Missing sections dropdown).
- Frontend: `src/static/scripts/budgets/details.js` (render `total_spent`, bind Balance/Edit inside the accordion, implement edit-mode modal population/reset and projection save; drop the dropdown menu renderer while keeping the missing-sections data for the modal selector).
- APIs: reuses `PUT /api/sections/<section_id>` for projection updates and `GET /api/budgets/<id>/complete/` for `total_spent`; no endpoint changes.
- Data: no models or migrations.
- Dependencies: none.
