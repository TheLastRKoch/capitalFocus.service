from django.db import models
from django.db.models import Count
from django.db.models.functions import TruncDate
from core.repositories.base import BaseRepository
from transactions.models import TransactionsModel
from budgets.models import BudgetsModel
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
        return [{
            'id': category.id,
            'label': category.label
        } for category in transaction_categories if category not in section_categories]

    def list_duplicates(self) -> list:
        """Return groups of duplicate transactions sharing the same amount, commerce, and calendar date.

        Uses a two-step ORM approach:
        1. Find duplicate keys (commerce, amount, day) with count > 1.
        2. For each key, fetch all matching transactions ordered by id ascending
           (lowest id = presumed original).

        Note: Comparison is case-sensitive on commerce. Performance is acceptable
        for typical personal-finance data volumes; a composite DB index on
        (commerce, amount, date::date) would help at larger scale.
        """
        # Step 1: find groups with more than one transaction on the same calendar date
        duplicate_keys = (
            self.model.objects.annotate(day=TruncDate('date')).values('commerce', 'amount',
                                                                      'day').annotate(count=Count('id')).filter(
                                                                          count__gt=1))

        groups = []
        for key in duplicate_keys:
            transactions = list(
                self.model.objects.annotate(day=TruncDate('date')).filter(
                    commerce=key['commerce'],
                    amount=key['amount'],
                    day=key['day'],
                ).order_by('id').values('id', 'amount', 'commerce', 'date'))
            if transactions:
                groups.append(transactions)

        return groups

