from core.repositories.budgets import BudgetsRepository
from core.repositories.sections import SectionsRepository
from core.repositories.transactions import TransactionsRepository
from core.repositories.catogories import CategoriesRepository, SubcategoriesRepository
import json
from django.forms.models import model_to_dict


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

    def get_section_transactions(self, budget_id: str) -> dict:
        section_transactions = []
        transactions = self.transactions_repo.get_by_budget_id(budget_id)
        sections = self.sections_repo.get_by_budget_id(budget_id)

        for section in sections:
            dic_section = model_to_dict(section)
            dic_section['transactions'] = [
                transaction for transaction in transactions
                if transaction.subcategory.parent == section.category
            ]
            section_transactions.append(dic_section)

        return section_transactions

    def get_by_id(self, budget_id: str) -> dict:
        return self.budgets_repo.get_by_id(budget_id)

    def create_budget(self, budget_data: dict) -> dict:
        """
        Create a new budget record.

        Args:
            budget_data (dict): The data for the new budget.

        Returns:
            dict: The created budget record.
        """
        if 'status' not in budget_data:
            budget_data['status'] = 'Active'

        return self.budgets_repo.create(budget_data)

    def create_section(self, budget_id: str, section_data: dict) -> dict:
        """
        Create a new section record linked to a budget.

        Args:
            budget_id (str): The ID of the budget to link the section to.
            section_data (dict): The data for the new section.

        Returns:
            dict: The created section record.
        """
        # Link to the budget. Teable link fields usually expect a list of IDs or objects.
        # In Teable, link fields are typically lists of IDs.
        section_data['budgets'] = {'id': budget_id}
        return self.sections_repo.create(section_data)
