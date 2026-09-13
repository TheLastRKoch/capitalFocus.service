## Context

In Django Admin, the changelist view at `admin/transactions/transactionsmodel/` lists all transaction records with a default action dropdown (`<select name="action">`). When an administrator selects multiple transactions and wants to update their subcategory, Django's action dropdown cannot display a popup selector inline without custom JavaScript. The standard and idiomatic Django pattern for actions requiring extra user input is to redirect to an intermediate confirmation page that presents a dedicated form and confirms the affected objects before applying changes.

`TransactionsModel` relates to `SubcategoriesModel` via a ForeignKey `subcategory`. `SubcategoriesModel` relates to `CategoriesModel` via ForeignKey `parent`.

## Goals / Non-Goals

**Goals:**
- Implement a custom Django Admin action `select_subcategory` registered on `TransactionAdmin` in `src/core/admin.py`.
- Create a dedicated intermediate form (`SubcategorySelectForm`) displaying all available subcategories with formatted labels `(parent category) sub category`.
- Create a clean intermediate admin template extending `admin/base_site.html` styled with Django admin's built-in CSS classes.
- Perform a bulk update on the selected queryset updating `subcategory` and setting `status='Categorized'`.
- Return clear user feedback via Django's `messages` framework and redirect back to the changelist.

**Non-Goals:**
- Creating custom client-side modal popups on the changelist view (Django standard intermediate page pattern is used instead).
- Altering the database schema or foreign key constraints.
- Modifying customer-facing SPA templates or APIs.

## Decisions

### Decision 1: Intermediate Page Action Workflow
- **Choice**: Implement `select_subcategory` on `TransactionAdmin` utilizing the two-stage action execution pattern.
- **Workflow**:
  1. **Stage 1 (Changelist -> Intermediate View)**: Admin selects transaction checkboxes, chooses `"Select subcategory"` from `<select name="action">`, and clicks "Go".
  2. Django calls `TransactionAdmin.select_subcategory(self, request, queryset)`.
  3. The action instantiates `SubcategorySelectForm` and renders `admin/transactions/select_subcategory.html` containing:
     - The subcategory dropdown form.
     - The list of selected transactions (showing ID, Date, Commerce, Amount).
     - Hidden inputs `<input type="hidden" name="_selected_action" value="{{ obj.pk }}">` and `<input type="hidden" name="action" value="select_subcategory">`.
     - A submit button `<input type="submit" name="apply" value="Confirm Subcategory">` and a Cancel link.
  4. **Stage 2 (Intermediate View -> Bulk Update & Return)**: When submitted with `apply` in `request.POST`, validate the form.
     - If valid: perform `queryset.update(subcategory=form.cleaned_data['subcategory'], status='Categorized')`, send `self.message_user(request, f"Successfully updated subcategory for {count} transactions.", messages.SUCCESS)`, and return `HttpResponseRedirect(request.get_full_path())`.
     - If invalid: re-render the intermediate page with form errors.

### Decision 2: Subcategory Dropdown Label Formatting
- **Choice**: Create a custom `ModelChoiceField` subclass:
  ```python
  class SubcategoryModelChoiceField(forms.ModelChoiceField):
      def label_from_instance(self, obj):
          return f"({obj.parent.label}) {obj.label}"
  ```
- **Query Optimization**: In `SubcategorySelectForm`, use `SubcategoriesModel.objects.select_related('parent').order_by('parent__label', 'label')` to avoid N+1 queries when populating the dropdown options.

### Decision 3: Intermediate Template Structure
- **Choice**: Place template in `src/templates/admin/transactions/select_subcategory.html`.
- **Details**: Extends `admin/base_site.html`, includes Django admin breadcrumbs, displays a summary card of affected transactions, renders form field errors cleanly, and includes standard Django admin styling classes (`class="button default"`, `class="button cancel-link"`).

## Risks / Trade-offs

- **[Large Selection Count]** → Passing hundreds of hidden inputs: Standard in Django admin (similar to `delete_selected`). Mitigation: Django's `DATA_UPLOAD_MAX_NUMBER_FIELDS` is 1000 by default, which is sufficient for typical admin pagination batch sizes (typically 100 items per page).
- **[Concurrent edits]** → Queryset bulk update (`queryset.update(...)`) executes in a single SQL `UPDATE ... WHERE id IN (...)` statement, ensuring atomicity and high performance.
