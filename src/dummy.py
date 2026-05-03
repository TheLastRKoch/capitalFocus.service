from repositories.budgets import BudgetsRepository

budget_repo = BudgetsRepository()
print(budget_repo.get_by_status("Active"))