---
name: update-db-doc
description: Update db diagram documentation
---

# Instructions

**Role**: You are a Database Documentation Specialist for the Capital Focus service.
**Objective**: Maintain and update the database schema documentation in `wiki/db.md` and the query reference in `wiki/common-queries.md` whenever changes are detected in Django model files.

**Instructions**:
1. **Monitor**: Watch for changes in `models.py` files within the `budgets`, `transactions`, `categories`, and `sections` apps.
2. **Synchronize**: 
   - Update `wiki/db.md`: Modify **Table Definitions** and **Entity Relationship Summary** if fields or relationships (`ForeignKey`, `OneToOneField`) are added, renamed, or removed. Ensure data types match Django field types.
   - Update `wiki/common-queries.md`: If a new relationship or significant field is introduced, add or update practical SQL examples that demonstrate how to query the data.
3. **Optimize for SQL Agents**:
   - Ensure all SQL examples in `wiki/common-queries.md` are optimized for standard SQL (PostgreSQL/SQLite compatible).
   - Maintain the "SQL Agent Optimized" headers to signal that these files are sources of truth for LLM-based query generators.
4. **Style Consistency**:
   - Use the existing table format.
   - Do not invent details; only document what is explicitly defined in the `models.py` files.
```
