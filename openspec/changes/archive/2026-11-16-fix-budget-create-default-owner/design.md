# Design

## Context

See `proposal.md` — Why. The current create path is `POST /api/budgets/` → `api_index` → `BudgetService.create_budget` → `BudgetsRepository.create` → `Model.objects.create(**fields)`. `BudgetsModel.user` is a non-null FK (`src/budgets/models.py:8-10`), but only `status` is defaulted, so the insert fails with `IntegrityError: NOT NULL constraint failed: budgets.user_id`. The view has no exception handling, so Django renders an HTML 500 page; the client cannot parse it and shows a generic toast.

Constraints:

- There is no authentication flow and no multi-user plan. The existing database already contains a `rkoch` user.
- The project uses a layered Repository/Service pattern; views route and delegate, services own orchestration and domain rules.
- API endpoints are JSON and `@csrf_exempt`; all failures must remain JSON.
- No test framework is configured yet; Django's built-in test runner is available.

## Goals / Non-Goals

**Goals:**

- Resolve and assign the default owner server-side with a single, configurable policy.
- Make every failure mode of budget creation return a deterministic JSON status and body.
- Validate the two client-provided fields so invalid input never reaches the ORM.
- Add the first automated tests for the budgets API.

**Non-Goals:**

- Introducing authentication, sessions, per-user login, or exposing owner selection in the UI.
- Reassigning existing budgets or migrating/backfilling ownership data.
- Changing other budget read endpoints or the budget detail/section flows.
- Supporting multiple owners or per-request owner overrides.

## Decisions

### Decision 1: Configuration via `DEFAULT_BUDGET_OWNER_USERNAME`

Add to `src/core/settings.py`:

```python
DEFAULT_BUDGET_OWNER_USERNAME = env('DEFAULT_BUDGET_OWNER_USERNAME') or 'rkoch'
```

Document `DEFAULT_BUDGET_OWNER_USERNAME` in `env.example` as optional with `rkoch` as the default.

- *Rationale*: Satisfies the “assign to `rkoch` for now” directive without hardcoding an identity inside business logic, and lets any deployment override it without a code change.
- *Alternatives considered*:
  - Hardcoding `username='rkoch'` in the service: rejected — impossible to override in another environment and encourages more hardcoded identities.
  - Using a numeric user id or `settings.AUTH_USER_MODEL` default manager lookup by email: rejected — username is the stable, documented identifier and matches the existing account.
  - Adding a database-backed setting model: rejected — overkill and adds a migration for a temporary stopgap.

### Decision 2: Ownership resolution and payload whitelisting in the service layer

`BudgetService.create_budget` owns the creation rules:

1. Reject a non-dict payload (`BudgetValidationError`).
2. Build a whitelist of `label`, `projection`, and optional `status`; drop every other key, including `user`, `user_id`, and `owner`.
3. Validate `label` and `projection` (Decisions 3 and 4).
4. Resolve the owner with `get_user_model().objects.filter(username=settings.DEFAULT_BUDGET_OWNER_USERNAME).first()`.
5. If no owner exists, raise `BudgetOwnerConfigurationError`.
6. Set `user_id` (the ORM accepts the scalar FK id) and `status` (default `Active`), then call the repository.

- *Rationale*: Keeps authorization/ownership policy out of the view and out of the generic repository, and guarantees the repository can never receive client-controlled ownership.
- *Alternatives considered*:
  - Resolving the user in the view: rejected — the view would need to know domain rules and the same logic would be duplicated by any future caller.
  - Adding a `UserRepository`: rejected — a single lookup by username does not justify a new abstraction; the Django user manager is already the repository for auth users.
  - Passing a `User` instance to `objects.create(user=...)`: works, but `user_id` is simpler and avoids loading the instance semantics into the repository.

### Decision 3: Validation rules and error types

Define two exception types in `src/core/services/budgets.py`:

- `BudgetValidationError(ValueError)` — maps to HTTP `400`.
- `BudgetOwnerConfigurationError(RuntimeError)` — maps to HTTP `503`.

Validation:

| Field | Rule |
|---|---|
| `label` | Must be a string; trimmed value non-empty; length ≤ 255. Persist the trimmed value. |
| `projection` | Must be a number or numeric string; parse with `decimal.Decimal`; must be finite (`is_finite()`), ≥ 0, and fit `max_digits=15, decimal_places=2`. Reject `bool`, `null`, `NaN`, `Infinity`, and empty strings. |
| `status` | Optional; if present, must be `Active` or `Inactive`. Defaults to `Active`. |

- *Rationale*: These are the model's real constraints plus the domain invariant; catching them before the ORM keeps failures deterministic and testable. Using `Decimal` avoids binary float surprises and rejects `NaN`/`Infinity` that SQLite might otherwise accept.
- *Alternatives considered*:
  - Relying on Django model validation: `objects.create` does not run full validation, so it would not protect the endpoint.
  - DRF serializers: rejected — the project has no DRF dependency and uses plain `JsonResponse`.

### Decision 4: View translates exceptions into JSON

`api_index` POST becomes:

```python
try:
    data = json.loads(request.body)
except (json.JSONDecodeError, UnicodeDecodeError):
    return JsonResponse({'error': 'Request body must be valid JSON.'}, status=400)

try:
    created = budget_service.create_budget(data)
except BudgetValidationError as exc:
    return JsonResponse({'error': str(exc)}, status=400)
except BudgetOwnerConfigurationError as exc:
    return JsonResponse({'error': str(exc)}, status=503)
except Exception:
    logger.exception('Unexpected error creating budget')
    return JsonResponse({'error': 'Unable to create budget.'}, status=500)

return JsonResponse(created, status=201)
```

A non-dict JSON body is rejected by `create_budget` as a validation error. The catch-all logs the traceback server-side and returns a generic JSON message, so no HTML or stack trace reaches the client.

- *Rationale*: Single place maps domain outcomes to HTTP semantics; unexpected errors are observable in logs and uniform on the wire.
- *Alternatives considered*:
  - A custom DRF-style exception handler or middleware: rejected — only this endpoint needs the contract now; a shared helper can be extracted later if more write endpoints adopt it.

### Decision 5: Frontend reads the API error field

`ApiService.fetchJson` (`src/static/scripts/app.js`) already throws an `Error` for non-2xx responses but only reads `error.message`. Update it to prefer the structured `error` field (`payload.error || payload.message`) while retaining the HTTP status fallback. `BudgetManager.#handleCreateBudget` (`src/static/scripts/budgets/list.js`) shows `error.message` in the danger toast instead of the fixed text.

- *Rationale*: The contract is `{"error": ...}`; the UI should surface the actionable server message (e.g. missing owner, invalid projection).
- *Alternatives considered*:
  - Changing the server contract to `{"message": ...}`: rejected — `error` is clearer for failures and is what the spec documents.

### Decision 6: Tests in the budgets app

Add `src/budgets/tests.py` using `django.test.TestCase` and `override_settings(DEFAULT_BUDGET_OWNER_USERNAME=...)`. Tests use the Django test client against `/api/budgets/`.

Coverage:

- `201` + correct `user_id`, trimmed label, `Active` status.
- Client-supplied `user_id` is ignored.
- Missing owner → `503`, JSON error, zero rows.
- Blank/long label, missing/negative/non-numeric projection → `400`, zero rows.
- Malformed JSON → `400`.
- Existing `GET /api/budgets/` still returns its list unchanged.

- *Rationale*: Django's test runner requires no new dependency and creates an isolated test database, so the developer SQLite file is never touched.

## Risks / Trade-offs

- **[Temporary identity model]** Every budget is owned by one account, which will be wrong once multiple users exist. → **Mitigation**: ownership is resolved in exactly one service method and the username is configurable; replacing it with `request.user` later is a localized change. Document this in the design and deployment notes.
- **[Missing account on fresh deployments]** A new database without `rkoch` would make creation fail with `503`. → **Mitigation**: the response is explicit and the env var allows pointing at an existing account; the deployment checklist calls out creating the owner first.
- **[Configuration is startup-time]** Changing `DEFAULT_BUDGET_OWNER_USERNAME` requires a process restart. → **Mitigation**: acceptable for a deployment-level setting; document it in `env.example`.
- **[Status field still client-controlled]** A client can submit `Active`/`Inactive` explicitly. → **Mitigation**: restrict to the model's choices; default to `Active` when omitted.
- **[Username matching]** Lookup is exact (case-sensitive), mirroring Django's authentication behavior; `Rkoch` will not match. → **Mitigation**: document the exact username; deployments copy the value from the user table.
- **[Catch-all handler]** A broad `except Exception` could hide programming errors. → **Mitigation**: the full traceback is logged with `logger.exception`, and only a generic message is returned.
- **[No ETag/idempotency]** Duplicate submissions still create duplicate budgets. → **Mitigation**: out of scope for this defect; the UI disables no button, but the reported issue is creation success, not deduplication.

## Migration Plan

1. Add `DEFAULT_BUDGET_OWNER_USERNAME` to `src/core/settings.py` and `env.example` (optional, default `rkoch`).
2. Deploy the backend changes (no database migration).
3. Ensure the target environment has the configured user (default `rkoch`); otherwise set the variable to an existing username or create the account.
4. Deploy the frontend JS changes; hard-refresh/clear static cache if assets are cached.
5. Rollback: revert the code and env change. No schema or data changes are made, so rollback is safe; budgets created while the fix was live retain their assigned owner (correct data).

## Open Questions

None. Future multi-user authentication is deliberately deferred; when it arrives, the owner resolution step is the single integration point.
