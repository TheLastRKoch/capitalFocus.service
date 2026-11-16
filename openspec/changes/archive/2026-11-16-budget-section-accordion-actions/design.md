# Design

## Context

`src/static/scripts/budgets/details.js` renders each section card in `#createSectionHtml()`. Today the header holds the collapse toggle (label, `Proj`, `Rem`) and the Balance button wired through `#setupBalanceButtons()` / `#handleBalanceSection()` using data attributes. The collapse body holds only the transactions table. The create modal (`#addCategoryModal`) is declared in `details.html` and submitted through `#handleCreateSection()`, which POSTs `/api/budgets/<id>/sections/`.

The complete-budget section payload includes `projection`, `remaining`, and `total_spent` as decimal strings. `PUT /api/sections/<section_id>` already accepts `{projection}` and is used by Balance. The page also renders a Missing sections dropdown (`#missing-sections-menu`) populated by `#renderMissingSectionsMenu()` from the same missing-sections fetch that feeds the modal selector. See proposal.md for motivation and the delta spec for required behavior.

## Goals / Non-Goals

**Goals:**
- Move Balance and add total expended + Edit inside the accordion body with minimal markup churn.
- Reuse the existing modal and section update API; no new endpoints or backend changes.
- Keep the create flow and existing refresh/balance behavior intact.
- Remove the redundant Missing sections dropdown while keeping the modal's missing-sections data.

**Non-Goals:**
- No section deletion or name editing.
- No change to the balance calculation or to the header's Proj/Rem values.
- No new modal implementation.
- No reordering or changes to the transactions table.

## Decisions

### Place the total/actions row at the top of the collapse body
Add a `d-flex` row before the table: total expended on the left, and Balance + Edit on the right, in that DOM order. The row lives inside the `collapse` element, so it disappears when the section is closed. The header keeps only the toggle and summary badges.

- Alternative: keep Balance in the header and only add total/edit inside. Rejected: the request explicitly moves Balance inside.
- Alternative: put the row below the table. Rejected: the requested order reads top-down as total, Balance, Edit.

### Render `total_spent` with the existing formatter
Use `Formatter.formatCurrency(section.total_spent || 0)` in `#createSectionHtml()`. No client-side aggregation, since the API already computes the value.

- Alternative: sum `section.transactions` amounts. Rejected: duplicates server logic and risks divergence.

### Reuse `#addCategoryModal` with an explicit edit mode
Track `#editingSectionId`. The Edit button stores the section id, sets the modal title and submit label, pre-fills the projection input, replaces the section selector options with the current section (label), selects it, and disables it. The header `h5` and submit button get ids so their text can change.

- Alternative: a separate edit modal. Rejected: duplicates markup and behavior; the request asks for the same modal.
- Alternative: a disabled text input for the name. Rejected: keeps the modal's field set and handlers unchanged; only the state of the existing selector changes.

### Branch the submit handler on edit mode
`#handleCreateSection()` checks `#editingSectionId`: in edit mode it validates the projection and sends `PUT /api/sections/<id>` with `{projection}`; otherwise it keeps the existing POST create path. Both paths show a notification and call `refreshData({ isInitial: false })`.

- Alternative: separate save handler. Rejected: two handlers would share validation and refresh logic.

### Reset the modal when it closes
Subscribe to `hidden.bs.modal` on `#addCategoryModal` to restore create mode: title **New Section**, submit **Save**, clear the projection, re-enable the selector, and repopulate it from the cached missing-sections list. Cache the last missing-sections response so the reset needs no extra request.

- Alternative: reset on each FAB click. Rejected: the FAB uses a declarative `data-bs-toggle`, so hooking the modal lifecycle is more reliable.
- Alternative: refetch missing sections on reset. Rejected: unnecessary traffic; the list is already loaded during `refreshData()`.

### Preserve accordion state across refresh
The existing `openCollapseIds` capture in `#render()` already preserves open sections when `#createSectionHtml()` re-renders. The new total/actions row is part of that markup, so it refreshes with the same rules and handlers are rebound by `#setupBalanceButtons()` plus the new edit binding.

### Remove the Missing sections dropdown, keep its data
Delete the `div.dropdown` / `#missing-sections-menu` block from `details.html` and remove `#renderMissingSectionsMenu()` plus its call in `#fetchMissingSections()`. Keep the fetch, the `#missingSections` cache, and `#renderSectionOptions()`, because the create/edit modal depends on them.

- Alternative: keep the dropdown hidden. Rejected: leaves dead markup and a renderer with no visible consumer.
- Alternative: relocate the quick-jump links elsewhere on the page. Rejected: not requested; section headers already provide access to each section.

## Risks / Trade-offs

- [Modal mode leaks into the create flow] → reset on `hidden.bs.modal` and repopulate the selector from cached data.
- [Disabled selector has no value when saving edit] → edit save sends only the projection and never reads the selector value.
- [Balance data attributes are lost while moving markup] → keep the same `data-*` attributes and move the binding with the button.
- [Section name is required by the create path] → create mode restores the enabled selector before the FAB opens the modal.
- [Refresh while editing] → after save the modal closes and data refreshes; the edit id is cleared on close.
- [Users lose the dropdown's quick-jump links] → accepted trade-off; section headers remain the navigation for each section.
- [Removing the menu renderer starves the modal selector] → only the menu call is removed; `#renderSectionOptions()` and the cached data stay.

## Migration Plan

1. Deploy the template and `details.js` changes; no backend or database changes.
2. Verify on `/budgets/<id>`: expand a section, confirm total/Balance/Edit order, balance a section, edit a projection, create a new section afterward, and confirm the Missing sections dropdown is gone while the New Section selector still lists missing sections.
3. Rollback: revert the commit; no data changes beyond user-submitted projections (which remain valid).
