## Purpose

Enables users to detect and review duplicate transactions in the system by matching on amount, commerce, and date — preventing inflated totals caused by repeated imports.

## ADDED Requirements

### Requirement: Duplicate Detection API

The system SHALL expose a `GET /api/transactions/duplicates/` endpoint that scans `TransactionsModel` using the Django ORM and returns all groups of transactions that share the same `amount`, `commerce`, and calendar date (year, month, day — ignoring time).

The response SHALL be a JSON object with a `groups` key containing an array of duplicate groups. Each group SHALL be an array of transaction objects with at least the following fields: `id`, `amount`, `commerce`, `date`.

The endpoint SHALL return an empty `groups` array when no duplicates are found.

#### Scenario: Duplicates exist

- **WHEN** two or more transactions share the same `amount`, `commerce`, and calendar date
- **THEN** the API returns a 200 response with those transactions grouped together under a single group entry in `groups`

#### Scenario: No duplicates exist

- **WHEN** all transactions have unique combinations of `amount`, `commerce`, and date
- **THEN** the API returns a 200 response with an empty `groups` array

#### Scenario: Group contains more than two duplicates

- **WHEN** three or more transactions share the same `amount`, `commerce`, and calendar date
- **THEN** all matching transactions appear in the same group (not split into multiple groups)

### Requirement: Duplicate Detection UI Page

The system SHALL provide a template view at `GET /transactions/duplicates/` that renders the `duplicates.html` page using the standard base layout and active page marker.

#### Scenario: Page load

- **WHEN** a user navigates to `/transactions/duplicates/`
- **THEN** the server returns a 200 HTML response using the `transactions/duplicates.html` template

### Requirement: Duplicate Groups Display

The frontend duplicates page SHALL fetch data from `GET /api/transactions/duplicates/` and render each duplicate group as a set of Bootstrap 5 cards stacked vertically.

Within each group, cards SHALL be ordered so the transaction with the lowest `id` (the presumed original) appears first, followed immediately by the remaining duplicate(s).

Each card SHALL display: `id`, `amount`, `commerce`, and `date`.

#### Scenario: Duplicate pairs rendered in order

- **WHEN** the page loads and the API returns one or more groups
- **THEN** for each group, the original transaction card is rendered first (lowest id) and its duplicate card(s) appear directly beneath it, with no other groups interleaved

#### Scenario: No duplicates found

- **WHEN** the API returns an empty `groups` array
- **THEN** the page displays a message indicating no duplicate transactions were found

#### Scenario: API error

- **WHEN** the API request fails (non-200 response or network error)
- **THEN** the page displays an error message and does not show any card groups
