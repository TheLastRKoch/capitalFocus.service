## 1. Backend — Repository Method

- [x] 1.1 Add `list_duplicates()` method to `TransactionsRepository` in `src/core/repositories/transactions.py` using `TruncDate` + `values()` + `annotate(Count)` + `filter(count__gt=1)` to find duplicate keys, then fetch all matching transactions grouped by key and sorted by `id` ascending. Verify by running `python src/manage.py shell` and calling `TransactionsRepository().list_duplicates()` — confirm it returns a list of groups (each group is a list of dicts with `id`, `amount`, `commerce`, `date`).

## 2. Backend — API Endpoint

- [x] 2.1 Add `api_duplicates(request)` view function to `src/transactions/views.py` that calls `transactions_repo.list_duplicates()` on `GET` and returns `JsonResponse({"groups": [...]})`. Return 405 for other methods. Verify by running the Django dev server and calling `curl http://localhost:8080/api/transactions/duplicates/` — confirm a valid JSON response with a `groups` key.
- [x] 2.2 Register the new API URL in `src/transactions/urls.py` as `path('api/duplicates/', views.api_duplicates, name='api_duplicates')` under the `/api/transactions/` prefix in `src/core/urls.py` (or wherever the transactions API routes are mounted). Verify the URL resolves without a 404.

## 3. Backend — Template View

- [x] 3.1 Add `duplicates(request)` template view function to `src/transactions/views.py` that renders `transactions/duplicates.html` with `{'active_page': 'transactions'}`. Verify by navigating to `/transactions/duplicates/` and confirming an HTML response.
- [x] 3.2 Register the template view URL in `src/transactions/urls.py` as `path('duplicates/', views.duplicates, name='duplicates')`. Verify the URL resolves and loads the template.

## 4. Frontend — HTML Template

- [x] 4.1 Create `src/templates/transactions/duplicates.html` extending `base.html`. The page body should include a container div (`id="duplicates-container"`) and a script tag loading `duplicates.js`. Verify the page loads with no console errors when no JS data is present.

## 5. Frontend — JavaScript Module

- [x] 5.1 Create `src/static/scripts/transactions/duplicates.js` that on `DOMContentLoaded` fetches `GET /api/transactions/duplicates/`. On success, iterate over `groups`; for each group, render Bootstrap 5 cards — first card marked as "Original" (lowest `id`), subsequent cards marked as "Duplicate". Render each group inside a visually separated wrapper div. Each card displays: `id`, `amount`, `commerce`, and `date`. When `groups` is empty, show a "No duplicate transactions found" message. On fetch error, display an error alert. Verify by loading `/transactions/duplicates/` in the browser with real data — confirm original/duplicate pairs render in order, grouped together.

## 6. Navigation

- [x] 6.1 Add a "Duplicates" navigation link pointing to `/transactions/duplicates/` in the transactions section of the navigation template (e.g., `base.html` or the transactions sidebar partial). Verify the link is visible and navigates to the correct page.
