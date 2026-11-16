# Spec Delta

## Purpose

Lets users create a budget section by choosing one of the budget's missing (unrepresented) transaction categories, capturing both the category relationship and the projection in a single action.

## ADDED Requirements

### Requirement: Modal options list only missing sections

The "New Section" modal SHALL present a combobox whose options are exactly the categories returned by `GET /api/budgets/<budgetId>/missing_sections/` for the current budget. Each option's value SHALL be the category ID and its visible text SHALL be the category label. The modal SHALL NOT offer free-form name entry.

#### Scenario: Missing sections exist

- **WHEN** the user opens the "New Section" modal on a budget that has missing sections
- **THEN** the combobox is populated with one option per missing section, showing the category label and carrying the category ID

#### Scenario: No missing sections exist

- **WHEN** the user opens the "New Section" modal and the budget has no missing sections
- **THEN** the combobox displays a "No missing sections" empty state
- **AND** the Save button is disabled

### Requirement: Save sends complete section details

Submitting the "New Section" modal SHALL POST to `/api/budgets/<budgetId>/sections/` with `label` from the selected option's category label, `category_id` from the selected option's category ID, and `projection` from the numeric input. The endpoint SHALL create a section linked to the budget with those values.

#### Scenario: Creating a section from a selected missing section

- **WHEN** the user selects a missing section and enters a projection, then clicks Save
- **THEN** the request body contains the selected label, the selected category ID, and the parsed projection amount
- **AND** a section is created for the budget with that label, category, and projection

#### Scenario: Selection or projection is missing

- **WHEN** the user submits the modal without selecting a missing section or without a numeric projection
- **THEN** no request is sent and the modal reports that both fields are required

#### Scenario: Creation fails

- **WHEN** the create request returns an error
- **THEN** the modal remains open and an error notification is shown

### Requirement: Modal state after successful creation

After a section is created successfully, the system SHALL close and reset the modal, re-render the budget sections, and reload the missing sections so the created category is no longer offered.

#### Scenario: Successful creation refreshes the page state

- **WHEN** a section is created successfully
- **THEN** the modal closes and its form resets
- **AND** the budget sections are re-rendered including the new section
- **AND** the combobox no longer lists the created section's category
