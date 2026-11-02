## Context

See `proposal.md` for motivation. Currently, in `src/transactions/views.py`, the `api_list` `POST` handler processes each incoming transaction item by extracting and normalizing fields (`date`, `commerce`, `amount`, `budget`, `subcategory`) and filtering through `valid_fields = {f.name ...}` on `TransactionsModel`.

Because `status` is a recognized field on `TransactionsModel`, if an imported item contains an empty string (e.g., `status: ""`, common when a CSV has a blank status column), it may be saved as an empty string instead of defaulting to `'Uncategorized'`. Conversely, records that legitimately specify a status (e.g. `'Categorized'` or `'Pending'`) should have that status preserved.

## Goals / Non-Goals

**Goals:**
- Preserve any explicit, non-empty `status` provided in the incoming import payload.
- Guarantee that if `status` is omitted, `null`, empty string, or whitespace-only, the transaction is persisted with `status = 'Uncategorized'`.
- Ensure newly imported transactions with empty/default status are immediately queryable via `GET /api/transactions/uncategorize/` and appear in the uncategorized UI view.

**Non-Goals:**
- Overriding valid statuses provided by clients when importing historical or pre-categorized records.
- Altering the categorization update endpoint `PUT /api/transactions/<id>/` (`api_details`), which transitions transactions to `'Categorized'` when assigned a category and budget.
- Altering admin actions (e.g., bulk subcategory assignment in `src/core/admin.py`).

## Decisions

### Decision 1: Inspect status and default to Uncategorized only when empty
In `src/transactions/views.py` (`api_list`), before assembling `filtered_item` and persisting via `transactions_repo.create()`, normalize and inspect `status`:
```python
raw_status = item.get('status')
if raw_status is None or (isinstance(raw_status, str) and not raw_status.strip()) or raw_status == '':
    item['status'] = 'Uncategorized'
else:
    item['status'] = str(raw_status).strip()
```
- *Rationale*: This guarantees that omitted or empty/blank status fields in import data (e.g. empty CSV cells) fall back to `'Uncategorized'`, while preserving explicit statuses if the import data already contains them.
- *Alternatives considered*:
  - Unconditionally setting `item['status'] = 'Uncategorized'`: Rejected because it discards existing categorization data when importing pre-categorized transactions.
  - Relying purely on model default without checking for empty string `""`: Fragile because empty strings in CSV imports satisfy `is in valid_fields` and get saved as `""` rather than triggering Django's `default='Uncategorized'`.

## Risks / Trade-offs

- **[Risk]** Clients might import unexpected or arbitrary status strings.
  → **Mitigation**: `TransactionsModel.status` has `STATUS_CHOICES` (`'Categorized'`, `'Uncategorized'`, `'Pending'`, `'Mock'`). Trimming and validating against known choices can optionally be applied, or standard choices preserved.
