## Why

Duplicate transactions can be accidentally imported (e.g., via repeated CSV uploads or bank feed errors), leading to inflated spending totals and incorrect budget projections. A dedicated detection feature lets users identify and review these duplicates before taking corrective action.

## What Changes

- New API endpoint `GET /api/transactions/duplicates/` that scans `TransactionsModel` using the Django ORM and returns groups of transactions sharing the same `amount`, `commerce`, and `date` (date-only, ignoring time).
- New Django template view `GET /transactions/duplicates/` that renders a dedicated page for reviewing duplicates.
- New frontend page (`duplicates.html`) rendered via vanilla JS + fetch, displaying duplicate groups as Bootstrap 5 cards with each pair stacked vertically: original on top, duplicate below it.

## Capabilities

### New Capabilities

- `transactions/duplicate-detection`: API endpoint and UI page to detect and display duplicate transactions grouped by `amount`, `commerce`, and `date`.

### Modified Capabilities

*(none)*

## Impact

- **Backend**: New view function and URL route added to `src/transactions/views.py` and `src/transactions/urls.py`. Uses `TransactionsRepository` or direct ORM query via `values()` + `annotate()` + `filter()` — no schema migrations required.
- **Frontend**: New template `src/templates/transactions/duplicates.html`; new JS module `src/static/scripts/transactions/duplicates.js`; navigation link added to the transactions section.
- **No breaking changes**: existing endpoints and pages are unaffected.
