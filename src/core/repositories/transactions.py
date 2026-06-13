from core.repositories.base import BaseRepository
from transactions.models import TransactionsModel


class TransactionsRepository(BaseRepository):
    """Repository for managing transaction records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(TransactionsModel)

    def list_uncategorized(self) -> list:
        """List all uncategorized transactions."""
        return self.filter_by_field('status', 'Uncategorized')

    def get_by_budget_id(self, budget_id: str) -> list:
        """Get transactions linked to a specific budget with related fields."""
        return list(
            self.model.objects.filter(budgets_id=budget_id).values('id', 'date', 'commerce', 'amount', 'location',
                                                                   'card', 'status', 'subcategory_id',
                                                                   'subcategory__parent_id'))

    def add(self,
            date,
            commerce,
            amount,
            location,
            card,
            authorization,
            reference,
            transactionType,
            subcategory,
            status,
            budget,
            json=None,
            html=None):

        new_transaction = TransactionsModel.objects.create(
            date=date,
            commerce=commerce,
            amount=amount,
            location=location,
            card=card,
            authorization=authorization,
            reference=reference,
            transactionType=transactionType,
            subcategory=subcategory,
            status=status,
            json=json,
            html=html,
            budget=budget,
        )
        new_transaction.save()
        return new_transaction
