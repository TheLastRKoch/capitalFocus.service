## Common Join Queries

### All transactions with category
```sql
 SELECT 
		TO_CHAR(t.date, 'YYYY-MM-DD MI:SS') AS date,
        t.commerce,
        t.amount,
        t.location,
        t.card,
        t.authorization,
        t.reference,
        --t.transactionType,
        s.label AS subcategory,
        t.status
    FROM transactions t
    LEFT JOIN subcategories s 
        ON t.subcategory_id = s.id;
```

### Transactions per date and category
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

### Search transactions per day and category
```sql
SET search_path TO myschema, public;

SELECT
  sum(t.amo)     
  FROM transactions t
  INNER JOIN subcategories s ON t.subcategory_id = s.id
  INNER JOIN categories c ON s.parent_id = c.id
 	WHERE lower(c.label) like '%house%'
    AND t.date >= '2026-06-29'
    AND t.date < '2026-07-31'
```

### Get the month expendings per category
```sql
SET search_path TO myschema, public;

SELECT 
    c.label AS cegory_name, 
    TO_CHAR(SUM(t.amount), 'FM999 999 990.00') AS total_amount
FROM transactions t
JOIN  budgets b ON t.budgets_id = b.id
JOIN  subcategories s  ON t.subcategory_id = s.id
JOIN  categories c ON s.parent_id = c.id
WHERE  b.label = 'July'
GROUP BY  c.label
ORDER BY  SUM(t.amount) DESC;
```