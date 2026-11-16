# Proposal

## Why

The "New Section" modal on `/budgets/<id>` currently asks the user to type a free-form name, but a budget section is defined by a category (which drives transaction matching) plus a projection. Submitting only a typed name either fails because `label`/`category` are missing or creates a section that matches no transactions. The backend already exposes `GET /api/budgets/<id>/missing_sections/`, which lists transaction categories that are not yet represented by a section — exactly the set of valid new sections for that budget.

## What Changes

- Replace the free-text `NAME` input in the "New Section" modal with a combobox (`<select>`) populated from `GET /api/budgets/<id>/missing_sections/`.
- Selecting an option carries both the visible label and the category ID; no free-form name entry remains.
- On submit, send a complete payload to `POST /api/sections/<budgetId>/sections`: the selected section `label`, its `category` (category ID), and the `projection` amount from the numeric input.
- Show a clear empty state in the modal when the budget has no missing sections, and disable the Save button in that case.
- Refresh the modal's options after a successful creation, since the newly created section is no longer missing.

## Capabilities

### New Capabilities

- `budgets/section-creation`: Creating budget sections from the budget's missing (unrepresented) transaction categories, including the combobox options contract and the complete create payload.

### Modified Capabilities

<!-- None: the transaction category and missing-sections listing endpoints keep their existing behavior. -->

## Impact

- **Frontend**: `src/templates/budgets/details.html` (modal markup) and `src/static/scripts/budgets/details.js` (option loading and submit payload).
- **API**: consumes existing `GET /api/budgets/<id>/missing_sections/` and `POST /api/sections/<budgetId>/sections`; both keep their current contract.
- **Backend**: no model, migration, service, or repository changes expected; the create endpoint already accepts `budgets_id`, `label`, `category`, and `projection`.
