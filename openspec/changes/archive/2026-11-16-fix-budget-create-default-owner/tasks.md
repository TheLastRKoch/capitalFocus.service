# Tasks

## 1. Configuration

- [x] 1.1 Add `DEFAULT_BUDGET_OWNER_USERNAME = env('DEFAULT_BUDGET_OWNER_USERNAME') or 'rkoch'` to `src/core/settings.py`. Verify with `python src/manage.py shell -c "from django.conf import settings; print(settings.DEFAULT_BUDGET_OWNER_USERNAME)"` (prints `rkoch`) and with `DEFAULT_BUDGET_OWNER_USERNAME=someone python src/manage.py shell -c "from django.conf import settings; print(settings.DEFAULT_BUDGET_OWNER_USERNAME)"` (prints `someone`).
- [x] 1.2 Document `DEFAULT_BUDGET_OWNER_USERNAME` as an optional variable with default `rkoch` in `env.example`. Verify the file contains the variable and its default.

## 2. Service: Ownership and Validation

- [x] 2.1 Add `BudgetValidationError` and `BudgetOwnerConfigurationError` to `src/core/services/budgets.py`. Verify both are importable with `python src/manage.py shell -c "from core.services.budgets import BudgetValidationError, BudgetOwnerConfigurationError"`.
- [x] 2.2 Rewrite `BudgetService.create_budget` to reject non-dict payloads, whitelist `label`/`projection`/`status` (dropping `user`, `user_id`, and any other keys), validate and trim `label`, validate `projection` as a finite non-negative `Decimal` within `max_digits=15, decimal_places=2`, validate optional `status` against `Active`/`Inactive`, resolve the owner by `settings.DEFAULT_BUDGET_OWNER_USERNAME`, raise `BudgetOwnerConfigurationError` when absent, and set `user_id` plus the default `Active` status before calling the repository. Verify by running `python src/manage.py check` and calling the service against a throwaway database row, asserting the created `user_id` matches the configured owner and that a client-supplied `user_id` is ignored.
- [x] 2.3 Add `src/budgets/tests.py` with service-level tests for: successful creation assigned to the default owner, client-supplied `user_id` ignored, missing owner raising `BudgetOwnerConfigurationError`, and `label`/`projection` validation rejections. Verify with `python src/manage.py test budgets`.
- [x] 2.4 Document the default-owner policy in `wiki/db.md` (new budgets are assigned to `DEFAULT_BUDGET_OWNER_USERNAME`, default `rkoch`, until multi-user auth exists). Verify the documented note matches the implemented setting name and default.

## 3. API Error Contract

- [x] 3.1 Update `api_index` in `src/budgets/views.py` to parse the body in a `try/except (JSONDecodeError, UnicodeDecodeError)` returning JSON `400`, map `BudgetValidationError` to JSON `400`, `BudgetOwnerConfigurationError` to JSON `503`, and catch unexpected exceptions with `logger.exception` returning a generic JSON `500`. Verify with a test client that a malformed body returns JSON `400` with an `error` field (not HTML).
- [x] 3.2 Add API-level tests in `src/budgets/tests.py` for: malformed JSON → `400`, non-object JSON → `400`, missing owner → `503` with no row created, unexpected persistence failure → JSON `5xx` without a stack trace (mock the repository), and existing `GET /api/budgets/` behavior unchanged. Verify with `python src/manage.py test budgets`.
- [x] 3.3 Confirm all budget creation error responses use `Content-Type: application/json` and include an `error` field. Verify by asserting the content type and parsed body in the API tests.

## 4. Frontend Error Handling

- [x] 4.1 Update `ApiService.fetchJson` in `src/static/scripts/app.js` to read the structured error payload (`payload.error || payload.message`) before falling back to the HTTP status. Verify by temporarily returning a JSON `400` from the API and confirming the thrown `Error` message is the server text.
- [x] 4.2 Update `BudgetManager.#handleCreateBudget` in `src/static/scripts/budgets/list.js` to display `error.message` in the danger toast instead of the fixed text, while keeping the modal open and form values populated on failure. Verify in the browser: a forced failure shows the server message, a successful creation closes the modal, clears the form, and refreshes the lists and counts.
- [x] 4.3 Verify the success path end-to-end in the browser: `/budgets/` → **+** → name + projection → **Create Budget** → modal closes, success toast appears, new budget is listed under **Active Budgets**, and the active count increments.

## 5. Integration Verification

- [x] 5.1 Run `python src/manage.py check` and the full suite `python src/manage.py test`; both must pass.
- [x] 5.2 Manually confirm the created budget's `user_id` equals the `rkoch` user id using the Django shell or SQLite query.
- [x] 5.3 Verify a fresh environment without the configured owner returns a JSON `503` (use `override_settings` or a temporary database) and that no budget row is inserted.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result and that `openspec/specs/budgets/budget-creation/spec.md` exists.
