# Spec Delta

## Purpose

Define how budgets are created through the public API, including ownership assignment, input validation, and machine-readable error responses.

## ADDED Requirements

### Requirement: Default owner assignment

The system SHALL assign every budget created through `POST /api/budgets/` to a single configured default owner. The owner username SHALL come from the `DEFAULT_BUDGET_OWNER_USERNAME` setting, which MUST default to `rkoch` when unset or empty. Ownership MUST be resolved server-side before persistence.

#### Scenario: Budget is created for the default owner

- **WHEN** a client submits a valid budget creation request and the default owner account exists
- **THEN** the created budget is persisted with `user_id` equal to the default owner's id
- **AND** the response reports the same owner id

#### Scenario: Configured owner overrides the built-in default

- **WHEN** `DEFAULT_BUDGET_OWNER_USERNAME` is set to an existing username
- **THEN** newly created budgets are assigned to that account instead of `rkoch`

### Requirement: Missing default owner configuration

The system SHALL NOT create a budget when the configured default owner account does not exist. It MUST respond with HTTP `503` and a JSON body containing an `error` message, and MUST NOT insert a row or alter existing data.

#### Scenario: Default owner account is absent

- **WHEN** a valid creation request is received and no user matches the configured default owner username
- **THEN** the response status is `503`
- **AND** the response body is JSON with an `error` field explaining the missing default owner
- **AND** the `budgets` table is unchanged

### Requirement: Server-authoritative ownership

The system SHALL ignore any ownership fields supplied by the client in the creation request. A client MUST NOT be able to create a budget for a different user by sending `user`, `user_id`, or equivalent fields.

#### Scenario: Client attempts to choose another owner

- **WHEN** a client submits `label` and `projection` together with `user_id` pointing to a different existing user
- **THEN** the budget is still assigned to the configured default owner
- **AND** the client-supplied owner value has no effect

### Requirement: Successful creation response

On successful creation, the system SHALL respond with HTTP `201` and a JSON object representing the persisted budget, including at least its `id`, `label`, `projection`, `status`, and owner id. The default status for a newly created budget MUST be `Active` when the client does not provide one.

#### Scenario: Valid budget is created

- **WHEN** a client sends `{"label": "October Budget", "projection": 5000}`
- **THEN** the response status is `201`
- **AND** the response body is JSON containing `id`, `label` `"October Budget"`, `projection` `5000`, `status` `"Active"`, and the default owner id

### Requirement: Budget name validation

The system SHALL require `label` to be a non-blank string of at most 255 characters. Invalid names MUST produce HTTP `400` with a JSON `error` field and MUST NOT create a budget.

#### Scenario: Name is missing or blank

- **WHEN** a creation request omits `label` or supplies an empty or whitespace-only value
- **THEN** the response status is `400`
- **AND** the response body is JSON with an `error` field describing the invalid name
- **AND** no budget is created

#### Scenario: Name exceeds the maximum length

- **WHEN** a creation request supplies a `label` longer than 255 characters
- **THEN** the response status is `400` with a JSON `error` field
- **AND** no budget is created

### Requirement: Budget projection validation

The system SHALL require `projection` to be a present, finite, numeric value greater than or equal to zero. Invalid projections MUST produce HTTP `400` with a JSON `error` field and MUST NOT create a budget.

#### Scenario: Projection is missing

- **WHEN** a creation request omits `projection`
- **THEN** the response status is `400` with a JSON `error` field
- **AND** no budget is created

#### Scenario: Projection is not a non-negative number

- **WHEN** a creation request supplies a non-numeric value, `null`, `NaN`, or a negative number as `projection`
- **THEN** the response status is `400` with a JSON `error` field
- **AND** no budget is created

### Requirement: Malformed request handling

The system SHALL return HTTP `400` with a JSON `error` field when the request body is not valid JSON or is not a JSON object, instead of raising an unhandled exception.

#### Scenario: Request body is malformed

- **WHEN** a client sends a body that cannot be parsed as JSON
- **THEN** the response status is `400`
- **AND** the response body is JSON with an `error` field
- **AND** no budget is created

### Requirement: JSON error responses

The system SHALL return JSON for every failed budget creation request, including unexpected persistence errors. It MUST NOT return an HTML error page or leak a stack trace to the client. Unexpected failures MUST return a JSON error with a `5xx` status.

#### Scenario: Unexpected persistence failure

- **WHEN** budget persistence raises an unexpected database error
- **THEN** the response status is a `5xx`
- **AND** the response body is JSON with an `error` field
- **AND** no stack trace or HTML is returned

### Requirement: Budget creation user feedback

The budgets page SHALL keep the New Budget modal open and display the server-provided error message when creation fails. It SHALL close the modal, clear the form, and refresh the budget lists when creation succeeds.

#### Scenario: Creation fails with a server error message

- **WHEN** the user submits the New Budget form and the API returns a JSON error
- **THEN** the modal remains open
- **AND** the entered values remain populated
- **AND** the error message from the API is shown to the user

#### Scenario: Creation succeeds

- **WHEN** the user submits the New Budget form and the API returns `201`
- **THEN** the modal closes and the form is cleared
- **AND** the budgets list and summary counts refresh to include the new budget

### Requirement: Existing budget endpoints unchanged

The system SHALL preserve the current behavior of the other budget endpoints: `GET /api/budgets/`, `GET /api/budgets/active/`, `GET /api/budgets/inactive/`, `GET /api/budgets/<id>/`, `GET /api/budgets/<id>/complete/`, and section endpoints.

#### Scenario: Existing reads still work

- **WHEN** a client performs any existing `GET` request against the budget API
- **THEN** the response status, body shape, and data semantics are unchanged by this capability
