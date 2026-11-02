# Bug Report: Cannot create a new budget from `/budgets/`

**Status:** Fixed — implemented by OpenSpec change `fix-budget-create-default-owner`
**Severity:** High — core feature (budget creation) is completely broken
**Component:** Budgets
**Endpoint:** `POST /api/budgets/`
**Reported:** 2026-10-30
**Triaged:** 2026-10-30
**Resolved:** 2026-10-30

---

## 1. Summary

Clicking the floating **+** button on the `/budgets/` page opens the **New Budget** modal. Filling in **Name** and **PROJECTION** and clicking **Create Budget** never creates the budget. The API returns HTTP `500 Internal Server Error`, no row is inserted into the `budgets` table, and the UI only shows a generic “Failed to create budget.” toast. The modal stays open with the entered values still populated.

The defect is **not** in the form, the modal, or the client-side submit handler. It is a server-side data-integrity failure: the frontend payload does not include the required `BudgetsModel.user` foreign key, and the service layer never supplies it, so the database rejects the `INSERT` with `NOT NULL constraint failed: budgets.user_id`.

---

## 2. Environment

| Item | Value |
|---|---|
| Repository | `TheLastRKoch/capitalFocus.service` |
| Branch | current working tree (`c25872c` at triage time) |
| Framework | Django 6.1.2 (migrations generated with 6.0.5) |
| Python | 3.12 |
| Database (local) | SQLite `db.sqlite3` (`DB_CONNECTION` from `.env`) |
| Deployment DB option | PostgreSQL (`psycopg2-binary` in `requirements.txt`) |
| Browser/UI | Bootstrap 5 modal + vanilla ES module frontend |

The failure is database-engine independent: both SQLite and PostgreSQL enforce the `NOT NULL` constraint on `budgets.user_id`.

---

## 3. Steps to reproduce

1. Start the app (`python src/manage.py runserver`).
2. Open `/budgets/`.
3. Click the blue floating action button (**+**).
4. Enter a **Name** (e.g. `October Budget`).
5. Enter a **PROJECTION** (e.g. `5000`).
6. Click **Create Budget**.

**Expected:** A `201 Created` response, a success toast, the modal closes, and the new budget appears in the **Active Budgets** grid/count.

**Actual:** The server responds `500`; the browser shows “Failed to create budget.”; the modal remains open and no budget is created. The server log contains `django.db.utils.IntegrityError: NOT NULL constraint failed: budgets.user_id`.

### Reproduction via API (isolated test database copy)

```bash
cp db.sqlite3 /tmp/cf_repro.sqlite3
cd src
DB_CONNECTION='{"default":{"ENGINE":"django.db.backends.sqlite3","NAME":"/tmp/cf_repro.sqlite3"}}' \
python - <<'PY'
import os, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django; django.setup()
from django.test import Client
c = Client(raise_request_exception=False)
payload = {"label": "October Budget", "projection": 5000}
r = c.post('/api/budgets/', data=json.dumps(payload),
           content_type='application/json', HTTP_HOST='127.0.0.1')
print(r.status_code, r.content[:120])
PY
```

Observed result:

```
500 b'<!DOCTYPE html>...<title>IntegrityError ... at /api/budgets/'
```

Control test — adding the missing foreign key resolves the failure:

```python
payload = {"label": "October Budget", "projection": 5000, "user_id": 2}
# -> 201 Created
# {"id": 2, "label": "October Budget", "user": 2, "status": "Active", "projection": 5000.0}
```

Note: sending `"user": 2` (instead of `"user_id": 2`) also fails, with
`ValueError: Cannot assign "2": "BudgetsModel.user" must be a "User" instance.`
because `Model.objects.create()` expects a model instance for FK assignment. Only `user_id` (or a resolved `User` instance) satisfies the ORM.

---

## 4. Root cause analysis

### 4.1 The model requires a user

`src/budgets/models.py:8-10`

```python
user = models.ForeignKey(User,
                         on_delete=models.CASCADE,
                         related_name='budgets')
```

The FK is declared without `null=True`/`blank=True`, so it is `NOT NULL`.
`src/budgets/migrations/0001_initial.py:26` confirms the database column was created as a required FK:

```python
('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                           related_name='budgets', to=settings.AUTH_USER_MODEL)),
```

The local `budgets` table reflects this:

```
PRAGMA table_info(budgets);
# id, label, status, created_at, updated_at, user_id, projection   (user_id NOT NULL)
```

### 4.2 The frontend does not send a user

`src/static/scripts/budgets/list.js:65-80`

```js
async #handleCreateBudget() {
    const nameInput = document.getElementById('budgetName');
    const projectionInput = document.getElementById('initialSalary');

    if (!nameInput || !projectionInput) return;

    const payload = {
        label: nameInput.value,
        projection: parseFloat(projectionInput.value)
    };

    await ApiService.fetchJson('/api/budgets/', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
```

The payload contains only `label` and `projection`.

### 4.3 The service defaults only `status`

`src/core/services/budgets.py:53-58`

```python
def create_budget(self, budget_data: dict) -> dict:
    """Create a new budget record."""
    if 'status' not in budget_data:
        budget_data['status'] = 'Active'

    return self.budgets_repo.create(budget_data)
```

No user is resolved from the session/request and no `user_id` is injected.

### 4.4 The repository passes fields straight to the ORM

`src/core/repositories/base.py:47-50`

```python
def create(self, fields: dict) -> dict:
    """Create a new record in the table."""
    obj = self.model.objects.create(**fields)
    return self._to_dict(obj)
```

`objects.create(label=..., projection=..., status=...)` omits `user_id`, so the `INSERT` violates the NOT NULL constraint.

### 4.5 The view does not translate the failure into a valid API response

`src/budgets/views.py:36-44`

```python
@csrf_exempt
def api_index(request):
    """API endpoint for listing or creating budgets."""
    if request.method == 'GET':
        return JsonResponse(budgets_repo.all(), safe=False)
    if request.method == 'POST':
        data = json.loads(request.body)
        return JsonResponse(budget_service.create_budget(data), status=201)
    return HttpResponse(status=405)
```

There is no `try/except`, so an `IntegrityError` (or malformed JSON) bubbles up to Django’s debug 500 HTML page instead of a JSON error payload.

### 4.6 The client therefore can only show a generic message

`src/static/scripts/app.js:80-89`

```js
if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
}
```

Because the 500 body is HTML, `response.json()` throws, the fallback `Unknown error` is used, and `list.js:90-92` shows only “Failed to create budget.” This hides the actual cause from the user and from support.

### 4.7 Full server traceback (abridged)

```
Internal Server Error: /api/budgets/
Traceback (most recent call last):
  ...
  File "src/budgets/views.py", line 43, in api_index
    return JsonResponse(budget_service.create_budget(data), status=201)
  File "src/core/services/budgets.py", line 58, in create_budget
    return self.budgets_repo.create(budget_data)
  File "src/core/repositories/base.py", line 49, in create
    obj = self.model.objects.create(**fields)
  ...
sqlite3.IntegrityError: NOT NULL constraint failed: budgets.user_id
The above exception was the direct cause of the following exception:
  ...
django.db.utils.IntegrityError: NOT NULL constraint failed: budgets.user_id
```

### 4.8 How the regression was introduced

The project migrated from Teable (a remote no-code backend) to Django ORM in commit `2c8fc3d` (“feat: migrate from Teable to Django ORM…”). Before the migration the budget `user` relation was not enforced locally on insert; after the migration the model/table enforces it, but the create path was never updated to supply a user. The old service (`ecf96406:src/services/budgets.py`) already only defaulted `status`, so the oversight carried over unchanged.

Related history:

```
2c8fc3d feat: migrate from Teable to Django ORM, refactor models, and update views and migrations
ecf96406 ... create_budget: only defaults status
baa6d0b feat: refactor database table names for budgets, sections, transactions, and users models
```

No code path anywhere in the repository assigns `BudgetsModel.user` on creation:

```
src/budgets/views.py:43           budget_service.create_budget(data)
src/core/services/budgets.py:58   self.budgets_repo.create(budget_data)
src/core/repositories/base.py:49  self.model.objects.create(**fields)
```

---

## 5. Contributing / secondary issues

These do not cause the primary failure but amplify it and should be considered when fixing:

1. **No auth-based user resolution.** `AuthenticationMiddleware` is enabled, but no view reads `request.user`, there is no login requirement, and the API accepts `AnonymousUser`. The application has no explicit “current user” strategy for new budgets, even though `budgets.user_id` is mandatory. Existing data belongs to `user_id = 2` (`rkoch`); `user_id = 1` (`admin`) also exists.
2. **No server-side validation.** `api_index` performs no validation of `label` (empty, length > 255), `projection` (numeric, range), or unknown/immutable fields. `json.loads` can also raise `JSONDecodeError` → 500 HTML.
3. **Error contract is broken for failures.** Successful responses are JSON, but exceptions produce HTML 500 pages. Clients cannot parse them; see §4.6.
4. **Potential projection edge case.** `parseFloat(projectionInput.value)` can yield `NaN`; `JSON.stringify` converts it to `null`, which is currently accepted because `projection` is `null=True`. This silently creates a budget with no projection. (Not the reported failure; the `required` attribute normally prevents this through the UI.)
5. **Return serialization uses `model_to_dict`.** `_to_dict()` (`src/core/repositories/base.py:12-16`) omits non-editable fields such as `created_at`/`updated_at` and returns FK as an id. This is sufficient for the current response but is an implicit contract; worth documenting if the create response is relied upon.
6. **No automated tests.** There are no tests covering budget creation, so this regression was not caught.

---

## 6. Impact

- **Functional:** 100% of attempts to create a budget from `/budgets/` fail. Budget management cannot be initialized for new periods.
- **Data:** No partial writes (the insert is rejected atomically), so there is no data corruption.
- **User experience:** Misleading generic error toast; modal does not close; no actionable guidance.
- **Operational:** The 500 HTML response pollutes logs and provides no machine-readable error for monitoring/alerting.

---

## 7. Suggested fix options (not applied)

> This section documents possible remediations only. No code was changed during triage.

### Option A — Resolve the owner server-side (recommended)

1. In `api_index` (`src/budgets/views.py`), pass the authenticated/selected user into the service, e.g. `budget_service.create_budget(data, user=request.user)`.
2. In `BudgetService.create_budget` (`src/core/services/budgets.py`), set `budget_data['user_id'] = user.id` (or `budget_data['user'] = user`) **before** calling the repository, and reject unauthenticated requests with `401`/`403`.
3. Add `try/except` around `json.loads` and creation; return `400` for invalid input and `409`/`400` for integrity errors as JSON, e.g. `{"error": "..."}`.
4. Optionally add a serializer/validation step for `label` and `projection`.

Because the app currently has no login flow, the team must decide the ownership policy first:

- enforce authentication and use `request.user`, or
- temporarily use a configured/default user (e.g. the existing `rkoch` account) and document it as a stopgap.

### Option B — Make the frontend send the owner

Add `user_id` to the payload in `list.js`. This is **not recommended alone**: it exposes ownership selection to the client, does not fix unauthenticated use, and can be tampered with.

### Option C — Make the relation optional

Change `BudgetsModel.user` to `null=True, blank=True` and add a migration. This is **not recommended**: it weakens the data model, contradicts the documented domain (“Budgets are the top-level containers owned by users”), and leaves orphan budgets.

### Recommended combination

Option A (+ validation and JSON error handling) is the correct fix. A focused regression test should POST `{label, projection}` as an authenticated user and assert `201`, a persisted row with the correct `user_id`, and that an unauthenticated request is rejected cleanly.

---

## 8. Verification plan for the fix

1. **Unit/API test:** authenticated `POST /api/budgets/` with `{"label": "October", "projection": 5000}` returns `201`, JSON body, and `BudgetsModel.objects.get(label="October").user_id == current_user.id`.
2. **Manual UI test:** `/budgets/` → **+** → name + projection → **Create Budget** → success toast, modal closes, budget appears under **Active Budgets**, active count increments.
3. **Negative cases:** missing name → `400`; non-numeric/absent projection → `400`; oversized label → `400`; unauthenticated request → `401`/`403` with JSON (not HTML); malformed JSON → `400`.
4. **Regression:** existing `GET /api/budgets/`, `/active/`, `/inactive/`, `/<id>/`, `/<id>/complete/` responses remain unchanged.
5. `python src/manage.py check` and the project’s test suite (once added) pass.

---

## 9. File reference index

| File | Lines | Relevance |
|---|---|---|
| `src/budgets/models.py` | 8-10 | Required `user` FK (`NOT NULL`) |
| `src/budgets/migrations/0001_initial.py` | 26 | DB constraint that rejects the insert |
| `src/budgets/views.py` | 36-44 | `api_index` POST handler; no user, no error handling |
| `src/core/services/budgets.py` | 53-58 | `create_budget`; defaults only `status` |
| `src/core/repositories/base.py` | 47-50 | `create()` passes fields unchanged to ORM |
| `src/static/scripts/budgets/list.js` | 65-93 | Frontend payload and generic error toast |
| `src/static/scripts/app.js` | 69-91 | `ApiService.fetchJson`; HTML 500 → “Unknown error” |
| `src/templates/budgets/list.html` | 76-101 | New Budget modal/form (works as designed) |
| `src/core/urls.py` | 34-44 | `/api/budgets/` route wiring |
| `wiki/db.md` | 8, 17-23 | Domain docs: budgets are owned by users |

---

## 10. Conclusion

The budget creation failure is a server-side bug, not a UI bug. The `budgets.user_id` column is mandatory, but the `POST /api/budgets/` path (`list.js` → `api_index` → `BudgetService.create_budget` → `BaseRepository.create`) never provides the owner, producing `IntegrityError: NOT NULL constraint failed: budgets.user_id`. The view also leaks the exception as an HTML 500 page, which the client degrades to a generic “Failed to create budget.” message. Fixing requires deciding how the owner is determined (authenticated user vs. configured default), injecting it into the create payload server-side, and returning structured JSON errors.
