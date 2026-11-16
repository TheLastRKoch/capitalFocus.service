# budgets/budget-details Specification

## Purpose
Provides client-side state handling and seamless in-place data synchronization for the budget details interface, preventing jarring page resets and preserving user context.

## Requirements

### Requirement: In-Place Refresh Data Fetching
When the user triggers a refresh on the budget details view, the system SHALL asynchronously re-fetch the budget completion data and missing sections from the API without reloading the browser page or blanking out the content container.

#### Scenario: User clicks refresh button
- **WHEN** the user clicks the Refresh button on the budget details page
- **THEN** the system sends background requests to `/api/budgets/<id>/complete` and `/api/budgets/<id>/missing_sections/` while maintaining the current DOM visible to the user.

### Requirement: Accordion Expansion State Persistence
The system SHALL preserve the expanded or collapsed state of all category section accordions across data refresh cycles.

#### Scenario: Refreshing with an expanded section
- **WHEN** the user has one or more category section panels open and triggers a data refresh
- **THEN** the updated section panels re-render with the exact same open panels remaining expanded.

### Requirement: Non-Disruptive Refresh Feedback
The system SHALL provide localized visual feedback on the Refresh control during background data fetching instead of displaying a full-container loading spinner over the page content.

#### Scenario: Refresh operation in progress
- **WHEN** a background data refresh is triggered
- **THEN** the Refresh button indicates loading state and prevents duplicate clicks until data retrieval finishes.

### Requirement: Smooth Overview and Section Reconciliation
Upon receiving refreshed budget data, the system SHALL update the summary cards (budget projection and remaining amount), individual section projections, transaction lists, and missing section dropdown items in-place.

#### Scenario: Budget metrics update
- **WHEN** refreshed budget data is returned by the API
- **THEN** the budget title, projection card, remaining balance card, and section tables update with new values without layout flicker.

### Requirement: Post-Balance Seamless Synchronization
When a user executes the Balance action on any budget section, the system SHALL update the section projection via API and subsequently run the in-place refresh process without closing active sections or resetting scroll position.

#### Scenario: Successful section balancing
- **WHEN** the user clicks the Balance button for an overspent or underspent section and the update succeeds
- **THEN** the system displays a confirmation notification and automatically refreshes budget overview and section calculations in-place.

### Requirement: Section Accordion Layout

Each section card header on the budget details page SHALL keep the section label, projection (`Proj`), and remaining (`Rem`) values, and SHALL NOT contain the Balance action. The expanded accordion body SHALL show, in order, the section's **total expended**, the **Balance** button, and the **Edit** button.

#### Scenario: Header retains summary values

- **GIVEN** a section card is rendered
- **WHEN** the header is displayed
- **THEN** it shows the section label, its projection, and its remaining amount
- **AND** it does not show a Balance button

#### Scenario: Accordion shows total and actions in order

- **GIVEN** a section card is rendered
- **WHEN** the accordion body is displayed
- **THEN** the total expended appears first, followed by the Balance button, followed by the Edit button

#### Scenario: Total expended comes from the API

- **GIVEN** the complete-budget response contains `total_spent` for the section
- **WHEN** the accordion body is displayed
- **THEN** the total expended shows that amount formatted as currency

#### Scenario: Missing total falls back to zero

- **GIVEN** the section has no `total_spent` value
- **WHEN** the accordion body is displayed
- **THEN** the total expended is displayed as the formatted zero amount

#### Scenario: Balance remains functional after moving

- **GIVEN** the accordion body is expanded
- **WHEN** the user clicks Balance
- **THEN** the section projection is updated through the existing section API
- **AND** the budget details refresh in place

### Requirement: Section Edit Mode

The Edit button in a section accordion SHALL open the existing section modal in edit mode for that section. In edit mode the title SHALL read **Edit Section**, the submit action SHALL read **Save Changes**, the section name SHALL be displayed but disabled, and the projection field SHALL be editable and pre-filled with the section's current projection.

#### Scenario: Opening edit mode

- **GIVEN** a section card is rendered
- **WHEN** the user clicks the Edit button
- **THEN** the section modal opens with the title **Edit Section** and submit label **Save Changes**
- **AND** the section name is shown and disabled
- **AND** the projection input contains the section's current projection

#### Scenario: Name cannot be changed

- **GIVEN** the section modal is in edit mode
- **WHEN** the user interacts with the section name field
- **THEN** the field cannot be edited

### Requirement: Saving a Section Projection

Saving in edit mode SHALL update the section's projection through `PUT /api/sections/<section_id>` without changing its name, close the modal, show a success notification, and refresh the budget details in place. A missing or non-numeric projection SHALL block the request and show validation feedback.

#### Scenario: Successful projection update

- **GIVEN** the section modal is in edit mode with a valid projection
- **WHEN** the user clicks **Save Changes**
- **THEN** the system sends `PUT /api/sections/<section_id>` with the new projection
- **AND** the modal closes, a success notification is shown, and the details refresh with the new projection and remaining values

#### Scenario: Invalid projection blocks the update

- **GIVEN** the section modal is in edit mode
- **WHEN** the projection is empty or not a valid number and the user clicks **Save Changes**
- **THEN** validation feedback is shown
- **AND** no update request is sent

#### Scenario: Section name is preserved

- **GIVEN** a section projection is updated in edit mode
- **WHEN** the request completes
- **THEN** the section name is unchanged

### Requirement: Section Modal Mode Reset

Closing the section modal after editing SHALL restore create mode, and opening it from the floating **New Section** button SHALL present the unchanged create flow.

#### Scenario: Closing edit mode restores create mode

- **GIVEN** the section modal was opened in edit mode
- **WHEN** the modal is closed
- **THEN** the next time it opens from the New Section button it has the **New Section** title, **Save** submit label, enabled section selector, and an empty projection input

#### Scenario: Creating a section still works

- **GIVEN** the modal is in create mode
- **WHEN** the user selects a missing section, enters a projection, and saves
- **THEN** the section is created as before and the details refresh in place

### Requirement: Section Totals Refresh Consistency

Refreshing the budget data SHALL update each section's total expended and header projection/remaining values without changing the expanded or collapsed state of the section accordions.

#### Scenario: Totals update in place

- **GIVEN** one or more section accordions are expanded
- **WHEN** refreshed complete-budget data is rendered
- **THEN** each section's total expended, projection, and remaining values update
- **AND** the previously expanded accordions remain expanded

### Requirement: Missing Sections Dropdown Removed

The budget details page SHALL NOT render the **Missing sections** dropdown or its menu. The section modal's selector SHALL continue to list missing sections from the same data source.

#### Scenario: Dropdown is absent

- **GIVEN** the budget details page has loaded
- **WHEN** the page content is rendered
- **THEN** no Missing sections dropdown or menu is present

#### Scenario: Modal selector still lists missing sections

- **GIVEN** the budget has missing sections
- **WHEN** the New Section modal is opened
- **THEN** its section selector still lists the missing sections
