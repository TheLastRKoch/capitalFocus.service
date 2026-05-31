from core.repositories.base import BaseRepository


class TransactionsRepository(BaseRepository):
    """Repository for managing transaction records via Teable."""

    def get_uncategorized(self) -> list:
        """
        Retrieve all transactions with an 'Uncategorized' status.

        Returns:
            list: A list of uncategorized transaction records.
        """
        return self.filter_by_field('status', 'Uncategorized')

    def get_by_budget_id(self, budget_id):
        return self.filter_by_field('status', 'Uncategorized')
