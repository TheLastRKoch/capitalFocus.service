## 1. Subcategory Selection Form & Intermediate Template

- [x] 1.1 Create `SubcategorySelectForm` with a custom `ModelChoiceField` formatted as `({obj.parent.label}) {obj.label}` and queryset using `select_related('parent').order_by('parent__label', 'label')`
- [x] 1.2 Create the intermediate confirmation template at `src/templates/admin/transactions/select_subcategory.html` extending `admin/base_site.html` with selected transactions list, hidden inputs (`_selected_action`, `action`), and submit/cancel controls

## 2. Admin Action Handler & Bulk Update

- [x] 2.1 Implement the `select_subcategory` action method on `TransactionAdmin` in `src/core/admin.py` to handle both the initial changelist action trigger and the intermediate form submission
- [x] 2.2 Register `select_subcategory` in `actions` list with the description `"Select subcategory"`
- [x] 2.3 Execute queryset bulk update on `TransactionsModel` (updating `subcategory` and setting `status='Categorized'`) and display success message via `messages.SUCCESS` upon successful form submission

## 3. Verification

- [x] 3.1 Navigate to `admin/transactions/transactionsmodel/`, select multiple transactions, and verify `"Select subcategory"` appears in the dropdown
- [x] 3.2 Verify the intermediate page loads with the selected transactions and the subcategory dropdown displaying labels formatted as `(parent category) sub category`
- [x] 3.3 Submit the form and verify that the selected transactions are updated in the database and the success message is displayed on the changelist
