from django.db import models
from core.repositories.base import BaseRepository
from transactions.models import TransactionsModel


class TransactionsRepository(BaseRepository):
    """Repository for managing transaction records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(TransactionsModel)

    def all(self) -> list:
        """Retrieve all records with related labels."""
        return list(self.model.objects.annotate(
            category_name=models.F('subcategory__label'),
            budget_name=models.F('budgets__label')
        ).values(
            'id', 'date', 'commerce', 'amount', 'status',
            'category_name', 'budget_name'
        ))

    def list_uncategorized(self) -> list:
        """List all uncategorized transactions."""
        return self.filter_by_field('status', 'Uncategorized')

    def get_by_budget_id(self, budget_id: str) -> list:
        """Get transactions linked to a specific budget with related fields."""
        return list(self.model.objects.filter(budgets_id=budget_id).values(
            'id', 'date', 'commerce', 'amount', 'location', 'card', 'status',
            'subcategory_id', 'subcategory__parent_id'
        ))
