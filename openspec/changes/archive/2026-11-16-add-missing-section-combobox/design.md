# Design

## Context

See `proposal.md` — Why. The budget details page (`src/templates/budgets/details.html`) uses a Bootstrap modal plus `src/static/scripts/budgets/details.js`, a `BaseManager` subclass that fetches JSON from the Django API. The existing `#fetchMissingSections()` already calls `GET /api/budgets/<id>/missing_sections/` on every `init()`, but writes into a separate `#missing-sections-menu` dropdown and leaves the modal's `datalist` empty. Section creation currently posts only `label` and `projection` to `POST /api/budgets/<budgetId>/sections/`.

## Goals / Non-Goals

**Goals:**

- Populate the modal combobox from the existing missing-sections endpoint and carry the category ID with each option.
- Submit `label`, `category_id`, and `projection` in one request without backend changes.
- Keep the modal's options, section list, and budget totals in sync after creation.

**Non-Goals:**

- Changing the missing-sections query, the create-section endpoint, or `SectionsModel`.
- Removing or redesigning the standalone "Missing sections" dropdown above the accordion; it MAY continue to render from the same fetched data.
- Adding free-form category creation from the modal.

## Decisions

- **Native `<select>` instead of an input + datalist.** A native select enforces "choose one of the missing sections" and gives each option a stable value, so the category ID and label travel together. The existing `datalist`/`#newCategoryName` input is replaced by `<select id="newSectionCategory">`; the amount input keeps `id="newCategoryBudget"`.
  - Alternative: keep the datalist and look up the label client-side. Rejected because it allows arbitrary labels with no category, preserving the original failure.
  - Alternative: a custom JS combobox widget. Rejected as unnecessary complexity for a list that is already bounded and server-provided.
- **Option encoding.** Each `<option>` uses `value="<category id>"` and its text content is the category label. On submit, `label` is read from the selected option's text and `category_id` from its value. This avoids a second lookup request and keeps the payload explicit.
  - The payload uses the FK attname `category_id` (not the FK field name `category`), because the repository passes fields straight to `objects.create(**fields)`; assigning a raw integer to `category` raises `Cannot assign "1": "SectionsModel.category" must be a "CategoriesModel" instance`, while `category_id` accepts the primary key.
- **One fetch, two consumers.** Refactor `#fetchMissingSections()` to fetch once into an instance field and render both the modal combobox and the existing dropdown, preventing duplicate requests and divergent state.
- **Native constraint validation.** Both controls keep `required`; the select additionally starts with an empty disabled placeholder option, so an unselected submission is blocked before `fetch`. When the list is empty, render a disabled "No missing sections" option and disable `#saveNewCategoryBtn`.
- **Refresh by re-running `init()`.** After a successful create, reset and hide the modal, then `await this.init()`, which already re-fetches budget details and missing sections — the created category disappears from the combobox and the new section renders.

## Risks / Trade-offs

- [Category labels duplicated across budgets or renamed between fetch and submit] → Label is taken from the fetched option text, which matches the server response used to build the payload; no client-side derivation.
- [Empty or failed missing-sections fetch] → Render an explicit empty/error option and keep Save disabled; console error preserves diagnosability.
- [Backend rejects `category_id` as a string] → Convert the option value to an integer before posting.
- [Stale combobox after external changes] → Re-running `init()` on success and on the existing Refresh button re-syncs options.

## Migration Plan

Template and JavaScript only; no database migration or API contract change. Rollback is reverting the two frontend files.
