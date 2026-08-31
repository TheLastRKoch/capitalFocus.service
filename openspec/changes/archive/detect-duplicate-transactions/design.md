## Context

The project uses a layered architecture: `TransactionsRepository` (in `core/repositories/transactions.py`) wraps ORM queries and is injected into view functions in `transactions/views.py`. API endpoints use `@csrf_exempt` + `JsonResponse`; pages are rendered by a thin template view that delegates all data rendering to vanilla JS via `fetch`.

The `TransactionsModel` already has `amount` (DecimalField), `commerce` (CharField), and `date` (DateTimeField) — no migration is needed. Date comparison must be on the calendar date only (ignoring time component), which requires a `TruncDate` database function.

## Goals / Non-Goals

**Goals:**
- Expose a read-only API endpoint that returns duplicate groups in a single ORM query.
- Render results in a new page following the existing hybrid template/JS pattern.
- Keep implementation changes local to the `transactions` app.

**Non-Goals:**
- Auto-deletion or merging of duplicates.
- Pagination of duplicates (number of duplicates is expected to be small).
- Filtering by budget or date range.

## Decisions

### Decision 1: Duplicate detection query strategy

**Chosen approach**: Use Django ORM `TruncDate` + `values()` + `annotate(Count)` + `filter(count__gt=1)` to find the duplicate keys, then fetch all matching transactions in a second query and group them in Python.

```python
from django.db.models.functions import TruncDate
from django.db.models import Count

duplicate_keys = (
    TransactionsModel.objects
    .annotate(day=TruncDate('date'))
    .values('commerce', 'amount', 'day')
    .annotate(count=Count('id'))
    .filter(count__gt=1)
)
```

For each key, fetch matching transactions with `.values('id', 'amount', 'commerce', 'date')` ordered by `id` (lowest id = presumed original first).

**Alternative considered**: Raw SQL `GROUP BY ... HAVING COUNT(*) > 1`. Rejected because the ORM approach is consistent with the project's no-raw-SQL convention and is readable enough.

**Alternative considered**: Single query with `Window()` functions. More complex, harder to maintain; two-step approach is clear and efficient for expected data volumes.

### Decision 2: Where to add the query — repository or view

**Chosen approach**: Add a `list_duplicates()` method to `TransactionsRepository` in `core/repositories/transactions.py`, and call it from a new `api_duplicates` view function. This stays consistent with the Repository pattern used for all other queries.

**Alternative considered**: Inline the query directly in the view. Breaks the layered convention and makes it harder to test or reuse.

### Decision 3: Frontend rendering

**Chosen approach**: Follow the existing hybrid pattern — a thin template view (`duplicates` function) renders `transactions/duplicates.html`, and a new `duplicates.js` module fetches `/api/transactions/duplicates/` on `DOMContentLoaded` and renders Bootstrap 5 cards dynamically.

Each duplicate group renders as a visually grouped block: original card first (lowest `id`), then duplicate card(s) immediately below, separated from the next group by a gap.

**Alternative considered**: Server-side rendered table. Inconsistent with the project's client-side rendering approach (other pages use the same fetch + JS pattern).

### Decision 4: API response shape

```json
{
  "groups": [
    [
      {"id": 1, "amount": "49.99", "commerce": "ACME Corp", "date": "2026-06-01T10:00:00Z"},
      {"id": 7, "amount": "49.99", "commerce": "ACME Corp", "date": "2026-06-01T14:00:00Z"}
    ]
  ]
}
```

Groups are arrays of transaction objects sorted by `id` ascending. Wrapping in `{"groups": [...]}` keeps the response extensible and avoids returning a bare array (consistent with existing `list_paginated` patterns).

## Risks / Trade-offs

- **Performance on large datasets**: Two-query approach is O(n) in the number of duplicate keys. For typical personal-finance data volumes this is fine; at scale (100k+ transactions) an index on `(commerce, amount, date::date)` would help. → Mitigation: acceptable for current scale; note in code comment.
- **Time zone handling**: `TruncDate` uses the database time zone. If transactions span time zones, the same timestamp could land on different calendar dates. → Mitigation: Acceptable assumption; the existing `date` field stores UTC values consistently.
- **Commerce name case sensitivity**: Two transactions with `"Acme"` vs `"ACME"` will not be detected as duplicates. → Mitigation: Matches current data entry conventions; noted as a known limitation.
