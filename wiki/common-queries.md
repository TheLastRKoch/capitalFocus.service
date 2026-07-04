## Common Join Queries

### 1. Transactions per date and category
```sql
SET search_path TO myschema, public;
SELECT 
      t.id AS transaction_id,
      t.date,
      t.commerce,
      t.amount,
      s.label
  FROM transactions t
  INNER JOIN subcategories s ON t.subcategory_id = s.id
  INNER JOIN categories c ON s.parent_id = c.id
  WHERE c.label = 'Payments'
    AND t.date >= '2026-06-01'
    AND t.date < '2026-07-01'
  ORDER BY t.date DESC;
```