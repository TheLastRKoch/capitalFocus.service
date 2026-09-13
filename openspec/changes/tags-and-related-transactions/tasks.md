## 1. Tag Model & Migration

- [ ] 1.1 Create `src/tags/` Django app: add `src/tags/__init__.py`, `src/tags/apps.py` (`TagsConfig`). Register `'tags'` in `INSTALLED_APPS` inside `src/core/settings.py`. Verify: `python src/manage.py check` passes with no errors.

- [ ] 1.2 Create `src/tags/models.py` with `TagModel`:
  ```python
  class TagModel(models.Model):
      label = models.CharField(max_length=100, unique=True)
      created_at = models.DateTimeField(auto_now_add=True)

      class Meta:
          db_table = 'tags'
          verbose_name_plural = 'Tags'

      def __str__(self):
          return self.label
  ```
  Verify: `python src/manage.py makemigrations tags` produces a migration file.

- [ ] 1.3 Add `tags` many-to-many field to `TransactionsModel` in `src/transactions/models.py`:
  ```python
  tags = models.ManyToManyField('tags.TagModel', related_name='transactions', blank=True, db_table='transaction_tags')
  ```
  Run `python src/manage.py makemigrations transactions` to produce the join-table migration. Verify: `python src/manage.py migrate` applies both migrations with no errors.

## 2. Tag Repository

- [ ] 2.1 Create `src/core/repositories/tags.py` with `TagsRepository(BaseRepository)`:
  - `__init__`: `super().__init__(TagModel)`.
  - `list_all() -> list`: returns `list(self.model.objects.values('id', 'label'))`.
  - `create(label: str)`: creates and returns `{'id': ..., 'label': ...}`; raises `ValueError` if label is blank or duplicate.
  - `delete(tag_id: int) -> bool`: deletes tag by id; returns `True` if found and deleted, `False` if not found.
  Verify by running `python src/manage.py shell` and exercising each method.

## 3. Tag CRUD API

- [ ] 3.1 Create `src/tags/views.py` with two view functions:
  - `api_list_create(request)`: `GET` returns `JsonResponse(tags_repo.list_all(), safe=False)`; `POST` reads `label` from JSON body, calls `tags_repo.create(label)`, returns 201 or 400 on error. Decorate with `@csrf_exempt`.
  - `api_delete(request, id)`: `DELETE` calls `tags_repo.delete(id)`; returns 204 on success, 404 if not found.
  Verify with: `curl -X POST http://localhost:8080/api/tags/ -H "Content-Type: application/json" -d '{"label":"Test"}'` returns 201.

- [ ] 3.2 Create `src/tags/urls.py`:
  ```python
  urlpatterns = [
      path('', views.api_list_create, name='tags_list_create'),
      path('<int:id>/', views.api_delete, name='tags_delete'),
  ]
  ```
  Mount in `src/core/urls.py` as `path('api/tags/', include('tags.urls'))`. Verify: `GET /api/tags/` returns `[]` (empty array) on a clean DB.

## 4. Transaction-Tag Association API

- [ ] 4.1 Add `api_transaction_tags(request, id)` to `src/transactions/views.py`:
  - `POST`: parse `{"tag_ids": [...]}` from body; fetch the transaction by id (404 if missing); call `transaction.tags.add(*tag_ids)`; return `JsonResponse({'tags': list(transaction.tags.values('id', 'label'))})` with status 200.
  Decorate with `@csrf_exempt`. Verify: after posting tag_ids, calling `GET /api/tags/` shows the tag still exists and the association is present.

- [ ] 4.2 Add `api_transaction_tag_delete(request, id, tag_id)` to `src/transactions/views.py`:
  - `DELETE`: fetch transaction (404 if missing); attempt `transaction.tags.remove(tag_id)` (404 if tag not on transaction); return 204.
  Decorate with `@csrf_exempt`.

- [ ] 4.3 Register new routes in `src/transactions/urls.py`:
  ```python
  path('api/<int:id>/tags/', views.api_transaction_tags, name='api_transaction_tags'),
  path('api/<int:id>/tags/<int:tag_id>/', views.api_transaction_tag_delete, name='api_transaction_tag_delete'),
  ```
  Verify both URLs resolve without 404.

## 5. Related Transactions Repository Method

- [ ] 5.1 Add `list_related() -> list` to `TransactionsRepository` in `src/core/repositories/transactions.py`:
  - **Part A — same date and amount**: Use `TruncDate` + `values('amount', 'day')` + `annotate(Count('id'))` + `filter(count__gt=1)` to find keys; for each key fetch transactions with `.prefetch_related('tags').order_by('id')` and serialize `id`, `amount`, `commerce`, `date`, `tags` (list of label strings). Append as `{'reason': 'same_date_amount', 'tag': None, 'transactions': [...]}`.
  - **Part B — shared tag**: For each `TagModel` that has two or more transactions, append `{'reason': 'shared_tag', 'tag': {'id': tag.id, 'label': tag.label}, 'transactions': [...]}`.
  - Return Part A groups first, then Part B groups.
  Verify by running `python src/manage.py shell` and calling `TransactionsRepository().list_related()` — confirm structure matches spec.

## 6. Related Transactions API Endpoint

- [ ] 6.1 Add `api_related(request)` view function to `src/transactions/views.py`:
  - `GET`: calls `transactions_repo.list_related()`, serializes Decimal/datetime values to strings, returns `JsonResponse({'groups': serialized})`.
  - Other methods: return 405.
  Verify with `curl http://localhost:8080/api/transactions/related/` — confirm valid JSON with `groups` key.

- [ ] 6.2 Register the API URL in `src/transactions/urls.py` as `path('api/related/', views.api_related, name='api_related')`, mounted under the correct prefix in `src/core/urls.py`. Verify URL resolves and returns 200.

## 7. Related Transactions Template View

- [ ] 7.1 Add `related(request)` template view function to `src/transactions/views.py` that renders `transactions/related.html` with `{'active_page': 'transactions'}`. Verify: `GET /transactions/related/` returns a 200 HTML response.

- [ ] 7.2 Register the template view URL in `src/transactions/urls.py` as `path('related/', views.related, name='related')`. Verify the URL resolves and the template loads without errors.

## 8. Frontend — HTML Template

- [ ] 8.1 Create `src/templates/transactions/related.html` extending `base.html`. Body must include a container div (`id="related-container"`) and a script tag loading `/static/scripts/transactions/related.js`. Verify the page loads with no console errors when JS data is absent.

## 9. Frontend — JavaScript Module

- [ ] 9.1 Create `src/static/scripts/transactions/related.js` that on `DOMContentLoaded`:
  1. Fetches `GET /api/transactions/related/`.
  2. For each group, renders a section header badge (`"Same date & amount"` in blue, `"Shared tag: <label>"` in green) followed by one Bootstrap 5 card per transaction showing `id`, `amount`, `commerce`, `date`, and tag labels (comma-separated).
  3. Groups are separated by `<hr>`.
  4. When `groups` is empty, shows `"No related transactions found."`.
  5. On fetch error, shows a Bootstrap danger alert.
  Verify by loading `/transactions/related/` in the browser with real tagged and same-date-amount data.

## 10. Navigation

- [ ] 10.1 Add a "Related" navigation link pointing to `/transactions/related/` in the transactions navigation section (alongside the existing "Duplicates" link). Verify the link is visible and navigates to the correct page.
