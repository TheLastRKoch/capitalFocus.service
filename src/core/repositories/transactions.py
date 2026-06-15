from django.db import models
from core.repositories.base import BaseRepository
from transactions.models import TransactionsModel
from budgets.models import BudgetsModel
from categories.models import CategoriesModel
from sections.models import SectionsModel


class TransactionsRepository(BaseRepository):
    """Repository for managing transaction records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(TransactionsModel)

    def all(self) -> list:
        """Retrieve all records with related labels."""
        return list(
            self.model.objects.annotate(category_name=models.F('subcategory__label'),
                                        budget_name=models.F('budgets__label')).values(
                                            'id', 'date', 'commerce', 'amount', 'location', 'card', 'authorization',
                                            'reference', 'transactionType', 'status', 'category_name', 'budget_name',
                                            'subcategory_id'))

    def list_uncategorized(self) -> list:
        """List all uncategorized transactions."""
        return self.filter_by_field('status', 'Uncategorized')

    def get_by_budget_id(self, budget_id: str) -> list:
        """Get transactions linked to a specific budget with related fields."""
        return list(
            self.model.objects.filter(budgets_id=budget_id).values('id', 'date', 'commerce', 'amount', 'location',
                                                                   'card', 'status', 'subcategory_id',
                                                                   'subcategory__parent_id'))

    def list_missing_sections(self, budget_id):
        budget = BudgetsModel.objects.get(id=budget_id)
        budget_transactions = TransactionsModel.objects.filter(budgets=budget)
        transaction_categories = list({
            transaction.subcategory.parent for transaction in budget_transactions if transaction.subcategory is not None
        })
        section_categories = [section.category for section in SectionsModel.objects.filter(budgets=budget)]
        return [category for category in transaction_categories if category not in section_categories]
