## Purpose

Ensures that transaction bulk imports retain any explicit status provided in the import payload, while defaulting empty, null, or omitted statuses to `'Uncategorized'` so they correctly flow into the uncategorized transaction review interface.

## ADDED Requirements

### Requirement: Retain provided status or default empty status to Uncategorized on import
The system SHALL preserve any explicit, non-empty `status` value supplied for each transaction item in `POST /api/transactions/`. If the `status` is omitted, `null`, empty string, or whitespace-only, the system SHALL set `status` to `'Uncategorized'`.

#### Scenario: Imported transaction with explicit status supplied
- **WHEN** a client posts a transaction item with an explicit status (e.g., `status: "Categorized"` or `status: "Pending"`)
- **THEN** the transaction is created and persisted with the provided status

#### Scenario: Imported transaction with no status specified
- **WHEN** a client posts a transaction list where items omit the `status` field
- **THEN** each created transaction is persisted with `status` set to `'Uncategorized'`

#### Scenario: Imported transaction with empty or whitespace status
- **WHEN** a client posts a transaction list where an item has `status: ""` or contains only whitespace
- **THEN** the created transaction is persisted with `status` set to `'Uncategorized'`

#### Scenario: Imported uncategorized transaction appears in review listing
- **WHEN** transactions are imported with an empty or omitted status
- **THEN** `GET /api/transactions/uncategorize/` returns those newly imported transactions ready for user categorization

### Requirement: Subcategory handling for imported transactions
The system SHALL ensure that transactions imported without an explicit valid subcategory association have `subcategory_id` set to `None`. If such a transaction has no explicit status, its `status` remains `'Uncategorized'`.

#### Scenario: Import transaction without subcategory and without status
- **WHEN** a transaction is imported without a `subcategory` field and without a `status` field
- **THEN** the transaction is created with `subcategory` set to `None` and its `status` set to `'Uncategorized'`
