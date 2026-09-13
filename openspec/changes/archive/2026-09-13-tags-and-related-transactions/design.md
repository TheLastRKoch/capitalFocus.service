## Context

The project uses a layered architecture: repositories in `core/repositories/` wrap ORM queries; views in `<app>/views.py` handle HTTP routing and delegate to repositories. Pages are rendered via thin Django template views; data is populated client-side by vanilla JS fetching JSON APIs. All API endpoints use `@csrf_exempt` + `JsonResponse`. Code style: Google Python style, 120-char line limit.

`TransactionsModel` (table `transactions`) already has `amount` (DecimalField), `date` (DateTimeField), `commerce` (CharField). Date-only grouping requires `TruncDate`. No raw SQL is used; all queries go through the Django ORM.

## Goals / Non-Goals

**Goals:**
- Add a `TagModel` with a required `label` and a many-to-many join to `TransactionsModel`.
- Expose a minimal tag CRUD API and transaction-tag association endpoints.
- Expose `GET /api/transactions/related/` returning same-date-amount and shared-tag groups.
- Render a `/transactions/related/` page using the existing hybrid template/JS pattern.

**Non-Goals:**
- Full tag search / autocomplete UI (can be added later).
- Pagination of related groups (expected to be small).
- Editing tag labels after creation.
- Merging or deleting related transactions from the UI.

## Decisions

### Decision 1: Where to place `TagModel`

**Chosen approach**: Create a new Django app `tags` at `src/tags/` containing `TagModel`. Register it in `INSTALLED_APPS`. This keeps models in domain-scoped apps consistent with `budgets`, `categories`, `sections`, `transactions`.

**Alternative considered**: Embed `TagModel` in `src/transactions/`. Rejected because the Tag entity is shared / reusable and placing it in `transactions` creates an awkward import dependency.

### Decision 2: Many-to-many relationship

**Chosen approach**: Add a `ManyToManyField` on `TransactionsModel`:

```python
from tags.models import TagModel

class TransactionsModel(models.Model):
    ...
    tags = models.ManyToManyField(TagModel, related_name='transactions', blank=True, db_table='transaction_tags')
```

Django will create and manage the `transaction_tags` join table automatically. Using `blank=True` keeps the field optional so existing transactions are unaffected with no data migration.

**Alternative considered**: Explicit through-model with extra fields (e.g., `tagged_at`). Unnecessary for current scope; can be added later without breaking the implicit join table pattern.

### Decision 3: Tag CRUD API placement

**Chosen approach**: New `src/tags/` app with `src/tags/views.py` containing `api_list_create` and `api_delete` view functions. Mounted under `/api/tags/` in `src/core/urls.py`. A `TagsRepository` in `core/repositories/tags.py` wraps ORM operations.

**Alternative considered**: Inline tag management inside the transactions views. Breaks single-responsibility and makes the transaction views file even larger.

### Decision 4: Transaction-tag association endpoints

**Chosen approach**: Two new view functions in `src/transactions/views.py`:
- `api_transaction_tags(request, id)` — handles `POST` to assign tag_ids via `transaction.tags.add(*tag_ids)`.
- `api_transaction_tag_delete(request, id, tag_id)` — handles `DELETE` to remove a single tag via `transaction.tags.remove(tag)`.

These are registered in `src/transactions/urls.py` as API paths.

### Decision 5: Related transactions query strategy

**Chosen approach**: Two independent ORM queries, results merged and ordered in Python:

**Group A — same date and amount:**
```python
from django.db.models.functions import TruncDate
from django.db.models import Count

keys = (
    TransactionsModel.objects
        .annotate(day=TruncDate('date'))
        .values('amount', 'day')
        .annotate(count=Count('id'))
        .filter(count__gt=1)
)
for key in keys:
    txns = TransactionsModel.objects.annotate(day=TruncDate('date')).filter(
        amount=key['amount'], day=key['day']
    ).prefetch_related('tags').order_by('id').values(...)
    groups.append({'reason': 'same_date_amount', 'tag': None, 'transactions': txns})
```

**Group B — shared tag:**
```python
for tag in TagModel.objects.prefetch_related('transactions'):
    txns = list(tag.transactions.order_by('id').values(...))
    if len(txns) >= 2:
        groups.append({'reason': 'shared_tag', 'tag': {'id': tag.id, 'label': tag.label}, 'transactions': txns})
```

Unlike `list_duplicates`, the related query intentionally omits `commerce` — same date + same amount is enough to call transactions "related" (they need not be from the same merchant).

`list_related()` is added to `TransactionsRepository`.

**Alternative considered**: Single combined query using `UNION`. Harder to annotate reason per group; two-step approach is simpler and consistent with the existing `list_duplicates` pattern.

### Decision 6: API response shape

```json
{
  "groups": [
    {
      "reason": "same_date_amount",
      "tag": null,
      "transactions": [
        {"id": 1, "amount": "49.99", "commerce": "ACME", "date": "2026-06-01T10:00:00Z", "tags": ["Recurring"]}
      ]
    },
    {
      "reason": "shared_tag",
      "tag": {"id": 3, "label": "Recurring"},
      "transactions": [...]
    }
  ]
}
```

`tag` is `null` for same-date-amount groups, a tag object for shared-tag groups. `tags` inside each transaction is an array of label strings for display convenience. `reason` is a machine-readable enum string.

### Decision 7: Frontend rendering

**Chosen approach**: Follow the existing hybrid pattern. A thin template view (`related` function) renders `transactions/related.html`. A new `related.js` module fetches `/api/transactions/related/` on `DOMContentLoaded` and renders Bootstrap 5 cards.

Each group renders as:
- A section header badge: `"Same date & amount"` (blue) or `"Shared tag: <label>"` (green).
- One Bootstrap 5 card per transaction showing `id`, `amount`, `commerce`, `date`, and tag labels.
- A visual separator (`<hr>`) between groups.

**Alternative considered**: Server-side rendered table. Inconsistent with the project's client-side rendering approach.

## Risks / Trade-offs

- **Performance**: `list_related()` executes N+1 queries per tag for the shared-tag path. For typical personal-finance data volumes this is acceptable. A `prefetch_related('transactions')` on `TagModel` reduces round-trips.
- **Time zone**: `TruncDate` uses the database time zone (UTC). Acceptable; matches existing `list_duplicates` behavior.
- **Commerce not matched**: Same-date-amount grouping ignores `commerce` by design to catch cases like split payments. This may produce more groups than expected. → Noted as known behavior; users can use tags to refine.
