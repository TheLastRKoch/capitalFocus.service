from core.repositories.budgets import BudgetsRepository
from core.repositories.sections import SectionsRepository
from core.repositories.transactions import TransactionsRepository
from core.repositories.categories import CategoriesRepository, SubcategoriesRepository


class BudgetService:
    """Service for orchestrating budget-related data operations."""

    def __init__(self, budgets_repo: BudgetsRepository,
                 sections_repo: SectionsRepository,
                 transactions_repo: TransactionsRepository,
                 categories_repo: CategoriesRepository,
                 subcategories_repo: SubcategoriesRepository) -> None:
        self.budgets_repo = budgets_repo
        self.sections_repo = sections_repo
        self.transactions_repo = transactions_repo
        self.categories_repo = categories_repo
        self.subcategories_repo = subcategories_repo

    def get_section_transactions(self, budget_id: str) -> list:
        """Retrieve sections with their associated transactions for a given budget."""

        section_transactions = []
        transactions = self.transactions_repo.get_by_budget_id(budget_id)
        sections = self.sections_repo.get_by_budget_id(budget_id)

        for section in sections:
            section_txns = [
                transaction for transaction in transactions if transaction.get(
                    'subcategory__parent_id') == section.get('category_id')
            ]

            # Calculate remaining: projection - sum of all transactions in this section
            total_spent = sum(t.get('amount', 0) for t in section_txns)
            projection = section.get('projection') or 0
            remaining = projection - total_spent

            section['transactions'] = section_txns
            section['total_spent'] = total_spent
            section['remaining'] = remaining

            section_transactions.append(section)

        return section_transactions

    def get_by_id(self, budget_id: str) -> dict:
        """Retrieve a budget by its ID."""
        return self.budgets_repo.get_by_id(budget_id)

    def create_budget(self, budget_data: dict) -> dict:
        """Create a new budget record."""
        if 'status' not in budget_data:
            budget_data['status'] = 'Active'

        return self.budgets_repo.create(budget_data)

    def create_section(self, budget_id: str, section_data: dict) -> dict:
        """Create a new section record linked to a budget."""
        section_data['budgets_id'] = budget_id
        return self.sections_repo.create(section_data)
