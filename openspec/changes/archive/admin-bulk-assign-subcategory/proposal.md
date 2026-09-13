## Why

In the Django Admin interface for Transactions (`admin/transactions/transactionsmodel/`), administrators frequently need to assign or update the subcategory for multiple transactions simultaneously. Currently, the admin changelist only provides the default action ("Delete selected Transactions"). Manually opening and editing transactions one by one is tedious and inefficient.

Adding a bulk "Select subcategory" action to the Django Admin action dropdown will streamline transaction categorization directly from the admin panel using Django's standard intermediate confirmation page pattern.

## What Changes

- **Custom Admin Action**: Register a new action named `"Select subcategory"` on `TransactionAdmin` in `src/core/admin.py` for `TransactionsModel`.
- **Intermediate Confirmation Page & Form**:
  - When the action is selected and submitted on the transaction changelist, redirect/render an intermediate admin page displaying the selected transactions and a custom subcategory selection form.
  - The subcategory dropdown will list all subcategories with choices formatted as `(parent category) sub category` (e.g., `(Food) Groceries`, `(Living) Rent`), ordered by parent category and subcategory label.
  - Include hidden inputs to preserve the selected transaction IDs (`_selected_action`) across the form submission.
- **Bulk Update & Feedback**:
  - When the administrator confirms the form, update the `subcategory` foreign key (and update `status` to `'Categorized'`) on all selected `TransactionsModel` records.
  - Show a confirmation message (using Django's `messages` framework) indicating how many transactions were updated.
  - Redirect the administrator back to the `admin/transactions/transactionsmodel/` changelist.

## Capabilities

### New Capabilities
- `transactions/admin-subcategory-action`: Bulk assign subcategories to multiple transactions from the Django Admin changelist using an intermediate confirmation form with formatted `(parent category) sub category` options.

### Modified Capabilities

## Impact

- **Admin Layer**: `src/core/admin.py` will be updated with the custom action method on `TransactionAdmin`.
- **Admin Templates & Forms**: Add a custom Django Form (`SubcategorySelectForm`) and an intermediate template (`select_subcategory.html` / `select_subcategory_intermediate.html`) extending Django's `admin/base_site.html`.
- **Database / Schema**: No schema changes or migrations required; uses existing foreign key relationship between `TransactionsModel` and `SubcategoriesModel`.
