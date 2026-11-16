# Spec Delta

## Purpose

Defines how the `/transactions/uncategorize/` page reports the number of uncategorized transactions, surfaces that same count in the global navigation, and lets a user open a modal, navigate between those transactions, and categorize them by assigning a budget and category.

## ADDED Requirements

### Requirement: Uncategorized Transaction Count

The "Pending Transactions" summary panel on `/transactions/uncategorize/` SHALL display the number of transactions whose `status` is exactly `Uncategorized`, derived from `GET /api/transactions/uncategorize/`.

#### Scenario: Count reflects uncategorized transactions

- **GIVEN** the API returns 7 transactions with status `Uncategorized`
- **WHEN** the page finishes loading
- **THEN** the panel displays `7`

#### Scenario: Zero uncategorized transactions

- **GIVEN** the API returns an empty list
- **WHEN** the page finishes loading
- **THEN** the panel displays `0`
- **AND** the transaction area displays the existing empty state

#### Scenario: Other statuses are excluded

- **GIVEN** transactions exist with statuses `Categorized`, `Pending`, and `Uncategorized`
- **WHEN** the count is computed
- **THEN** only the `Uncategorized` transactions contribute to the displayed count

### Requirement: Navigation Uncategorized Indicator

Every page SHALL show an hourglass indicator (`bi-hourglass`) in the global navigation to the right of the bell icon, linking to `/transactions/uncategorize/` and carrying a badge at its top-right with the number of `Uncategorized` transactions derived from `GET /api/transactions/uncategorize/`. The badge SHALL be hidden when that count is zero.

#### Scenario: Badge shows the pending count on any page

- **GIVEN** the API returns 7 uncategorized transactions
- **WHEN** any page finishes loading
- **THEN** the navigation shows the hourglass indicator to the right of the bell
- **AND** its badge displays `7`

#### Scenario: Badge is hidden at zero

- **GIVEN** the API returns an empty list
- **WHEN** any page finishes loading
- **THEN** the hourglass indicator is shown without a numeric badge

#### Scenario: Navigation badge matches the panel

- **GIVEN** the user is on `/transactions/uncategorize/`
- **WHEN** the uncategorized list finishes loading
- **THEN** the navigation badge and the "Pending Transactions" panel display the same number

#### Scenario: Indicator navigates to the uncategorize page

- **GIVEN** the hourglass indicator is visible
- **WHEN** the user activates it
- **THEN** the browser navigates to `/transactions/uncategorize/`

#### Scenario: Badge updates after a categorization

- **GIVEN** the user categorizes a transaction on `/transactions/uncategorize/`
- **WHEN** the page refreshes its list
- **THEN** the navigation badge shows the new count
- **AND** the badge is hidden if no uncategorized transactions remain

#### Scenario: Count source failure leaves the badge hidden

- **GIVEN** `GET /api/transactions/uncategorize/` fails during page load
- **WHEN** the page finishes loading
- **THEN** the hourglass indicator is shown without a numeric badge
- **AND** no error notification interrupts the page

### Requirement: Summary Panel Opens Categorization Modal

Clicking the "Pending Transactions" panel SHALL open the existing categorization modal populated with the first transaction in the loaded uncategorized list.

#### Scenario: Panel opens modal with first transaction

- **GIVEN** at least one uncategorized transaction is loaded
- **WHEN** the user clicks the "Pending Transactions" panel
- **THEN** the categorization modal opens
- **AND** the commerce, date, amount, location, and card fields show the first transaction's values

#### Scenario: Panel click with no transactions

- **GIVEN** no uncategorized transactions are loaded
- **WHEN** the user clicks the "Pending Transactions" panel
- **THEN** no modal opens

#### Scenario: Transaction card still opens the modal

- **GIVEN** the transaction list is rendered
- **WHEN** the user clicks a transaction card's "Categorize" button
- **THEN** the modal opens populated with that transaction's values

### Requirement: Navigate Between Uncategorized Transactions

The modal SHALL provide Previous and Next controls that move the selection through the loaded uncategorized transactions and repopulate the modal fields.

#### Scenario: Next moves forward

- **GIVEN** the modal shows the first of several transactions
- **WHEN** the user clicks Next
- **THEN** the modal shows the next transaction's values

#### Scenario: Previous moves backward

- **GIVEN** the modal shows a transaction that is not the first
- **WHEN** the user clicks Previous
- **THEN** the modal shows the preceding transaction's values

#### Scenario: Boundary controls are disabled

- **GIVEN** the modal shows the first or last transaction
- **WHEN** the modal is rendered
- **THEN** Previous is disabled at the first transaction and Next is disabled at the last transaction

### Requirement: Budget and Category Options Are Populated

On page load the system SHALL populate the modal's Budget dropdown from `GET /api/budgets/active/` and its Category dropdown from `GET /api/subcategory/`, each retaining a placeholder option.

#### Scenario: Options load successfully

- **GIVEN** both endpoints return data
- **WHEN** the page finishes loading
- **THEN** the Budget dropdown lists the active budget labels
- **AND** the Category dropdown lists the subcategory labels

#### Scenario: Options load failure

- **GIVEN** either endpoint fails
- **WHEN** the page finishes loading
- **THEN** the affected dropdown keeps only its placeholder option
- **AND** an error notification is shown

### Requirement: Subcategory List API

The system SHALL expose `GET /api/subcategory/` returning a JSON array of all subcategories, each with `id`, `label`, and the parent category label.

#### Scenario: List subcategories

- **WHEN** `GET /api/subcategory/` is called
- **THEN** the response is 200 with a JSON array of objects containing `id`, `label`, and `parent_label`

#### Scenario: Empty subcategories

- **GIVEN** no subcategories exist
- **WHEN** `GET /api/subcategory/` is called
- **THEN** the response is 200 with an empty array

### Requirement: Categorize Requires Budget and Category

Clicking "Categorize" SHALL require both a Budget and a Category to be selected; when either is missing the system SHALL show validation feedback and SHALL NOT send an update request.

#### Scenario: Missing selection blocks save

- **GIVEN** the Budget or Category dropdown holds its placeholder value
- **WHEN** the user clicks "Categorize"
- **THEN** validation feedback is shown on the form
- **AND** no `PUT /api/transactions/<id>/` request is sent

#### Scenario: Valid selection submits

- **GIVEN** both a Budget and a Category are selected
- **WHEN** the user clicks "Categorize"
- **THEN** the system sends `PUT /api/transactions/<id>/` with `{"budget": <budget id>, "category": <category id>}`

### Requirement: Categorization Persists Status and Associations

`PUT /api/transactions/<id>/` SHALL persist the submitted budget and category as the transaction's budget and subcategory, and SHALL set `status` to `Categorized`.

#### Scenario: Successful categorization

- **WHEN** `PUT /api/transactions/<id>/` is called with valid `budget` and `category` values
- **THEN** the response is 200 with the updated transaction
- **AND** the stored transaction has `status` `Categorized`, the given `budgets_id`, and the given `subcategory_id`

#### Scenario: Unknown transaction

- **WHEN** `PUT /api/transactions/<id>/` targets a non-existent transaction
- **THEN** the response is 404
- **AND** no record is created

### Requirement: Success Feedback and List Refresh

After a successful categorization the system SHALL close the modal, show a success notification, and refresh the uncategorized list and count.

#### Scenario: Successful save feedback

- **WHEN** the categorization request succeeds
- **THEN** the modal closes
- **AND** a success notification indicates the transaction has been categorized
- **AND** the categorized transaction no longer appears in the list
- **AND** the panel count no longer includes the categorized transaction

#### Scenario: Failed save feedback

- **WHEN** the categorization request fails
- **THEN** the modal stays open
- **AND** an error notification is shown
