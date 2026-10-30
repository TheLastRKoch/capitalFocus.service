## Why

Creating a budget from `/budgets/` is completely broken: `POST /api/budgets/` returns HTTP 500 because `budgets.user_id` is `NOT NULL`, but the create path never supplies an owner. The client only sees a generic “Failed to create budget.” toast. The product has no multi-user plan yet, so new budgets must be assigned to a single default owner (`rkoch`) while keeping the door open for real authentication later.

## What Changes

- **Assign a default owner server-side**: `POST /api/budgets/` resolves a default owner from the configurable `DEFAULT_BUDGET_OWNER_USERNAME` environment variable (fallback `rkoch`) and injects it into the create payload. Ownership is never trusted from the request body.
- **Fail clearly when the owner is missing**: if the configured owner account does not exist, respond with a JSON `503` configuration error instead of an unhandled `IntegrityError`.
- **Return structured JSON errors**: malformed JSON, missing/mistyped fields, and unexpected persistence failures return JSON `4xx`/`5xx` payloads (`{"error": "..."}`), never Django’s HTML error page.
- **Basic create validation**: `label` must be a non-blank string of at most 255 characters; `projection` must be a finite, non-negative number. Invalid input returns JSON `400` and creates no row.
- **Preserve the public request contract**: the frontend continues to send only `label` and `projection`; the create response stays a JSON object containing the persisted budget.
- **Surface the API error in the UI**: the New Budget modal shows the server-provided error message and stays open on failure, and closes/refreshes on success.
- **Add regression coverage**: API tests for successful creation, owner attribution, missing-owner configuration, validation failures, malformed JSON, and client-supplied ownership being ignored.

## Capabilities

### New Capabilities

- `budgets/budget-creation`: Server-authoritative creation of budgets through `POST /api/budgets/`, including default-owner assignment, input validation, and JSON error responses.

### Modified Capabilities

<!-- No existing capability's requirements change. -->

## Impact

- **Backend**: `src/budgets/views.py` (`api_index`), `src/core/services/budgets.py` (`create_budget`), and possibly `src/core/repositories/base.py` error propagation.
- **Configuration**: new optional `DEFAULT_BUDGET_OWNER_USERNAME` environment variable in `src/core/settings.py`, documented in `env.example`; no database migration.
- **API**: `POST /api/budgets/` keeps its request shape (`label`, `projection`) and success response, but now returns JSON errors (`400`, `503`) and ignores client-supplied ownership fields.
- **Frontend**: `src/static/scripts/budgets/list.js` displays the API error message; `src/static/scripts/app.js` may need to parse structured error payloads consistently.
- **Tests**: first budget-creation API tests in the `budgets` app.
- **Deployment**: environments must contain a `rkoch` user (or set `DEFAULT_BUDGET_OWNER_USERNAME`) before budget creation succeeds.
