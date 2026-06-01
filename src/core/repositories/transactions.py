from core.repositories.base import BaseRepository
from transactions.models import TransactionsModel


class TransactionsRepository(BaseRepository):
    """Repository for managing transaction records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(TransactionsModel)

    def get_uncategorized(self) -> list:
        """
        Retrieve all transactions with an 'Uncategorized' status.

        Returns:
            list: A list of uncategorized transaction records.
        """
        return self.filter_by_field('status', 'Uncategorized')

    def get_by_budget_id(self, budget_id: str) -> list:
        return self.filter_by_field('budgets_id', budget_id)
