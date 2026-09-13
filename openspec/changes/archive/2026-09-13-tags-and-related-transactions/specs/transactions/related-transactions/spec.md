## Purpose

Introduces the `TagModel` to allow semantic labelling of transactions, and a Related Transactions feature that groups transactions sharing the same date and amount or the same tag — enabling users to surface contextually connected records without relying on exact duplicates.

## ADDED Requirements

### Requirement: Tag Model

The system SHALL provide a `TagModel` Django model (db table `tags`) with:
- `id`: auto-increment integer primary key.
- `label`: `CharField(max_length=100, unique=True)` — required, non-blank.
- `created_at`: `DateTimeField(auto_now_add=True)`.

`TransactionsModel` SHALL gain a `tags` `ManyToManyField` pointing to `TagModel` through the join table `transaction_tags`. The field SHALL be optional (blank=True) so existing transactions are unaffected.

#### Scenario: Tag label is required

- **GIVEN** a request to create a tag
- **WHEN** the `label` field is missing or blank
- **THEN** the system rejects the request with a 400 error

#### Scenario: Tag label is unique

- **GIVEN** a tag with label "Recurring" already exists
- **WHEN** a request to create another tag with label "Recurring" is submitted
- **THEN** the system rejects the request with a 400 error

---

### Requirement: Tag CRUD API

The system SHALL expose the following tag management endpoints under the prefix `/api/tags/`:

| Method | Path | Behaviour |
|--------|------|-----------|
| `GET`  | `/api/tags/` | Returns a JSON array of all tags (`id`, `label`). |
| `POST` | `/api/tags/` | Creates a new tag from `{"label": "<value>"}`. Returns 201 with the created tag or 400 on validation error. |
| `DELETE` | `/api/tags/<id>/` | Deletes the tag with the given id. Returns 204 on success, 404 if not found. |

Deleting a tag SHALL remove the tag record and all rows in the `transaction_tags` join table referencing it (cascade). Existing `TransactionsModel` records SHALL be unaffected.

#### Scenario: List tags

- **WHEN** `GET /api/tags/` is called
- **THEN** the response is 200 with a JSON array; each element has `id` and `label`

#### Scenario: Create tag

- **WHEN** `POST /api/tags/` is called with `{"label": "Salary"}`
- **THEN** the response is 201 with `{"id": <n>, "label": "Salary"}`

#### Scenario: Delete tag

- **WHEN** `DELETE /api/tags/<id>/` is called for an existing tag
- **THEN** the response is 204 and the tag no longer appears in `GET /api/tags/`

---

### Requirement: Assign/Remove Tags on a Transaction

The system SHALL expose endpoints to manage the tags of a specific transaction:

| Method | Path | Behaviour |
|--------|------|-----------|
| `POST`  | `/api/transactions/<id>/tags/` | Assigns one or more tag ids to the transaction. Body: `{"tag_ids": [1, 2]}`. Returns 200 with the updated tag list. |
| `DELETE` | `/api/transactions/<id>/tags/<tag_id>/` | Removes a single tag from the transaction. Returns 204 on success, 404 if the association does not exist. |

#### Scenario: Assign tags to a transaction

- **WHEN** `POST /api/transactions/5/tags/` is called with `{"tag_ids": [3, 7]}`
- **THEN** tags 3 and 7 are associated with transaction 5 and returned in the response

#### Scenario: Remove a tag from a transaction

- **WHEN** `DELETE /api/transactions/5/tags/3/` is called
- **THEN** tag 3 is disassociated from transaction 5; the transaction record is unchanged

---

### Requirement: Related Transactions API

The system SHALL expose `GET /api/transactions/related/` that scans `TransactionsModel` and returns groups of transactions that are considered "related" by either of the following criteria:

1. **Same date and amount**: Two or more transactions share the same calendar date (year, month, day — ignoring time) and the same `amount`.
2. **Shared tag**: Two or more transactions share at least one common `TagModel` entry.

Each group SHALL contain at least two transactions. A transaction MAY appear in multiple groups if it satisfies more than one grouping criterion.

The response shape SHALL be:
```json
{
  "groups": [
    {
      "reason": "same_date_amount" | "shared_tag",
      "tag": {"id": 1, "label": "Recurring"} | null,
      "transactions": [
        {"id": 1, "amount": "49.99", "commerce": "ACME", "date": "2026-06-01T10:00:00Z", "tags": ["Recurring"]},
        {"id": 7, "amount": "49.99", "commerce": "ACME", "date": "2026-06-01T14:00:00Z", "tags": []}
      ]
    }
  ]
}
```

- For `reason: "same_date_amount"`, `tag` SHALL be `null`.
- For `reason: "shared_tag"`, `tag` SHALL be the tag object that caused the grouping.
- Groups with `reason: "same_date_amount"` SHALL be listed before groups with `reason: "shared_tag"`.
- The endpoint SHALL return an empty `groups` array when no related transactions are found.

#### Scenario: Same-date-and-amount group

- **WHEN** two or more transactions share the same calendar date and same `amount`
- **THEN** the API returns a group with `reason: "same_date_amount"` containing those transactions

#### Scenario: Shared-tag group

- **WHEN** two or more transactions share the same tag
- **THEN** the API returns a group with `reason: "shared_tag"` and the matching `tag` object

#### Scenario: No related transactions

- **WHEN** all transactions are unique by date/amount and no shared tags exist
- **THEN** the API returns `{"groups": []}`

#### Scenario: Transaction appears in multiple groups

- **WHEN** a transaction matches both a same-date-amount pair and a shared-tag pair
- **THEN** it is included in each applicable group

---

### Requirement: Related Transactions UI Page

The system SHALL provide a template view at `GET /transactions/related/` that renders `transactions/related.html` using the standard base layout and `active_page: 'transactions'` context.

The frontend page SHALL fetch from `GET /api/transactions/related/` on `DOMContentLoaded` and render each group as a visually distinct block of Bootstrap 5 cards.

Each block SHALL display a group header indicating the reason (`"Same date & amount"` or `"Shared tag: <label>"`), followed by one card per transaction showing: `id`, `amount`, `commerce`, `date`, and the transaction's tags (comma-separated labels).

When `groups` is empty the page SHALL display a message: "No related transactions found."

#### Scenario: Groups rendered with header

- **WHEN** the API returns groups with different reasons
- **THEN** each group is preceded by its reason header and the transaction cards appear directly beneath it

#### Scenario: Empty state

- **WHEN** the API returns `{"groups": []}`
- **THEN** the page shows "No related transactions found."

#### Scenario: API error

- **WHEN** the fetch request fails
- **THEN** the page shows an error alert and no group cards
