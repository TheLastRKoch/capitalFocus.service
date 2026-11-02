## Purpose

Provide a Django Admin bulk action on `admin/transactions/transactionsmodel/` that redirects to an intermediate confirmation page, allowing administrators to choose a subcategory (formatted as `(parent category) sub category`) and apply it across all selected transactions.

## ADDED Requirements

### Requirement: Admin Action Registration for Subcategory Assignment
The Django admin site SHALL register a bulk action named `"Select subcategory"` on the `TransactionAdmin` model admin for `TransactionsModel`.

#### Scenario: Action is listed in the changelist dropdown
- **WHEN** an admin navigates to `admin/transactions/transactionsmodel/`
- **THEN** the action dropdown includes an option with the label `"Select subcategory"`

### Requirement: Intermediate Confirmation Form
When the administrator selects transactions and triggers the `"Select subcategory"` action, the system SHALL display an intermediate confirmation page containing the list of selected transactions and a form with a subcategory selection dropdown.

#### Scenario: Admin selects transactions and triggers action
- **WHEN** an admin selects one or more transaction rows in the changelist and submits the `"Select subcategory"` action
- **THEN** the system renders an intermediate confirmation page showing the count and list of selected transactions alongside a form with a subcategory selection input and Confirm/Cancel controls

#### Scenario: Form validation failure
- **WHEN** the admin submits the intermediate confirmation form without selecting a valid subcategory
- **THEN** the system re-renders the intermediate page displaying a validation error message prompting the user to select a subcategory

### Requirement: Subcategory Dropdown Label Formatting
The subcategory choice dropdown in the intermediate form SHALL format every subcategory entry as `(parent category) sub category` (for example, `(Living) Rent` or `(Food) Groceries`), ordered alphabetically by parent category label and subcategory label.

#### Scenario: Subcategory option format
- **WHEN** the intermediate page renders the subcategory select element
- **THEN** each option's display text follows the pattern `(<Parent Category Label>) <Subcategory Label>`

### Requirement: Bulk Update Execution and Feedback
Upon successful submission of the intermediate form, the system SHALL update all selected `TransactionsModel` records with the chosen `subcategory` foreign key and set `status` to `'Categorized'`, show a success notification with the count of updated records, and redirect back to the changelist view.

#### Scenario: Successful bulk update
- **WHEN** the admin selects a subcategory and submits the intermediate confirmation form for N selected transactions
- **THEN** all N transactions are updated in the database with the selected subcategory, a success message such as `"Successfully assigned subcategory to N transactions."` is displayed, and the admin is redirected to `admin/transactions/transactionsmodel/`
