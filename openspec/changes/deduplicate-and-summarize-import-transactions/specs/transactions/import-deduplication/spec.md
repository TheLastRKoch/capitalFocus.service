## Purpose

Provides duplicate checking during bulk transaction imports, error-resilient processing across items, and a structured response summarizing created, existing, and errored records.

## ADDED Requirements

### Requirement: Duplicate transaction detection during import
The system SHALL check if each incoming transaction matches an existing transaction based on identical `date`, `commerce`, and `amount` before creating a new record. If a matching record already exists in the database, the system SHALL NOT create a duplicate record and SHALL record the item as an existing transaction.

#### Scenario: Existing transaction is skipped
- **WHEN** a client posts a transaction list containing a transaction with date, commerce, and amount matching an existing record in the database
- **THEN** the system skips creation for that transaction and includes it in the existing summary list

#### Scenario: Non-existing transaction is created
- **WHEN** a client posts a transaction list containing a transaction whose date, commerce, or amount does not match any existing record in the database
- **THEN** the system creates the transaction record in the database and includes it in the created summary list

### Requirement: Fault-tolerant item processing
The system SHALL process each transaction item independently. If an error occurs while parsing or persisting an individual transaction item, the system SHALL capture the error, continue processing the remaining items in the payload, and record the failed transaction along with error details.

#### Scenario: Single item failure does not abort remaining items
- **WHEN** a client posts a transaction list where one item has invalid formatting and subsequent items are valid
- **THEN** the system records the invalid item in the error list, continues processing, and successfully creates or skips the subsequent valid items

### Requirement: Granular import summary response
The system SHALL respond to bulk transaction import requests with a structured summary containing the counts and details of created transactions, already existing transactions, and transactions that encountered errors.

#### Scenario: Complete summary in response payload
- **WHEN** a client posts a batch of transactions to the import endpoint
- **THEN** the system returns HTTP 200 or 201 with a response containing `status`, `summary` (or total counts and lists) partitioned by `created`, `existing`, and `errors`
