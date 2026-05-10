from environment import TEABLE_TRANSACTIONS
from services.teable import TeableService


class TransactionsRepository:
    """Repository for managing transaction records via Teable."""

    def __init__(self) -> None:
        """Initialize the transactions repository with a Teable service instance."""
        self.teable = TeableService()

    def all(self) -> dict:
        """
        Retrieve a list of transactions from the Teable service.

        Returns:
            dict: The JSON response containing the list of transactions.
        """
        return self.teable.read(TEABLE_TRANSACTIONS)

    def get_uncategorized(self):
        transactions = self.all()
        uncategorized_transactions = []
        for transaction in transactions:
            status = transaction.get('fields', {}).get('status')
            if status == 'Uncategorized':
                uncategorized_transactions.append(transaction)
        return uncategorized_transactions

    def get_by_id(self, id):
        return [
            transaction for transaction in self.all()
            if transaction.get('id') == id
        ][0]
