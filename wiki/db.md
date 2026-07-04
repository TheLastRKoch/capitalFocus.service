# Capital Focus Database Schema (SQL Agent Optimized)

This schema tracks financial budgets, hierarchical categories, and individual transactions.

---

## Entity Relationship Summary
- **Budgets** are the top-level containers owned by users.
- **Categories** have many **Subcategories** (1:N).
- **Sections** act as a junction between **Budgets** and **Categories** to set specific spending projections.
- **Transactions** belong to a **Budget** and are classified by a **Subcategory**.

---

## Table Definitions

### 1. `budgets` (Model: `BudgetsModel`)
*High-level financial containers.*
- `id`: Integer (Primary Key)
- `label`: String (Budget name)
- `user_id`: Integer (Foreign Key -> `auth.User.id`)
- `status`: String ('Active', 'Inactive')
- `projection`: Decimal (Total planned budget amount)
- `created_at` / `updated_at`: DateTime

### 2. `categories` (Model: `CategoriesModel`)
*Top-level grouping.*
- `id`: Integer (Primary Key)
- `label`: String (Category name, e.g., "Food", "Utilities")
- `created_at` / `updated_at`: DateTime

### 3. `subcategories` (Model: `SubcategoriesModel`)
*Detailed classification.*
- `id`: Integer (Primary Key)
- `parent_id`: Integer (Foreign Key -> `categories.id`)
- `label`: String (Subcategory name, e.g., "Groceries", "Dining Out")
- `created_at` / `updated_at`: DateTime

### 4. `sections` (Model: `SectionsModel`)
*Budget-to-Category mapping with specific limits.*
- `id`: Integer (Primary Key)
- `label`: String (Custom section name)
- `budgets_id`: Integer (Foreign Key -> `budgets.id`)
- `category_id`: Integer (Foreign Key -> `categories.id`)
- `projection`: Decimal (Planned amount for this specific category within this budget)
- `created_at` / `updated_at`: DateTime

### 5. `transactions` (Model: `TransactionsModel`)
*Individual financial records.*
- `id`: Integer (Primary Key)
- `date`: DateTime (Transaction timestamp)
- `commerce`: String (Merchant name)
- `amount`: Decimal (Monetary value)
- `location`: String (Physical/Virtual location)
- `card`: String (Card identifier)
- `authorization`: String (Auth code)
- `reference`: String (Reference number)
- `transactionType`: String (e.g., 'Debit', 'Credit')
- `budgets_id`: Integer (Foreign Key -> `budgets.id`)
- `subcategory_id`: Integer (Foreign Key -> `subcategories.id`)
- `status`: String ('Categorized', 'Uncategorized', 'Pending', 'Mock')
- `json`: Text (Raw JSON payload)
- `html`: Text (Raw HTML source)
- `created_at` / `updated_at`: DateTime
