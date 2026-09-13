## Why

Transactions often share meaningful relationships beyond simple duplication: the same purchase split across multiple payments, recurring monthly charges, or manually grouped entries tied to the same event. There is currently no way to group transactions semantically or surface "related" records across the dataset. Adding a **Tag** model and a **Related Transactions** feature fills this gap by letting users annotate transactions with free-form labels and then instantly see every transaction that is contextually connected — either because it shares the same date and amount, or because it carries the same tag.

## What Changes

- New `TagModel` Django model (table `tags`) with a single required `label` CharField and a many-to-many relationship to `TransactionsModel`.
- Django migration to create the `tags` table and the join table `transaction_tags`.
- CRUD API endpoints for tags: list, create, and delete.
- New API endpoint `GET /api/transactions/related/` that returns groups of related transactions. A group is formed when two or more transactions share the same calendar date **and** the same `amount`, OR when two or more transactions share at least one common tag.
- New Django template view `GET /transactions/related/` that renders a dedicated page for reviewing related-transaction groups.
- New frontend page (`related.html`) rendered via vanilla JS + fetch, displaying related groups as Bootstrap 5 cards stacked vertically — the same visual idiom used by the existing Duplicates page.

## Capabilities

### New Capabilities

- `transactions/tag-model`: `TagModel` with `label` field and many-to-many relation to `TransactionsModel`; full CRUD API.
- `transactions/related-transactions`: API endpoint and UI page that surfaces groups of related transactions matched by same-date-and-amount OR shared tag.

### Modified Capabilities

- `transactions/transaction-model`: `TransactionsModel` gains a `tags` many-to-many field pointing to `TagModel`.

## Impact

- **Database**: New `tags` table and `transaction_tags` join table via Django migration. No existing columns are modified.
- **Backend**: New `TagsRepository` in `core/repositories/`; new `TagModel` in a new `tags` Django app (or inside `transactions`); new views and URL routes. `TransactionsRepository` gains `list_related()`.
- **Frontend**: New template `src/templates/transactions/related.html`; new JS module `src/static/scripts/transactions/related.js`; navigation link added alongside "Duplicates".
- **No breaking changes**: all existing endpoints, pages, and migrations are unaffected.
