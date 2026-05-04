from environment import TEABLE_TRANSACTIONS
from services.teable import TeableService


class TransactionsRepository:
    """Repository for managing transaction records via Teable."""

    def __init__(self) -> None:
        """Initialize the transactions repository with a Teable service instance."""
        self.teable = TeableService()

    def all(self) -> list:
        """
        Retrieve a list of transactions from the Teable service.

        Returns:
            list: A list of transaction records.
        """
        return self.teable.read(TEABLE_TRANSACTIONS)

    def get_uncategorized(self) -> list:
        """
        Retrieve all transactions with an 'Uncategorized' status.

        Returns:
            list: A list of uncategorized transaction records.
        """
        transactions = self.all()
        uncategorized_transactions = []
        for transaction in transactions:
            status = transaction.get('fields', {}).get('status')
            if status == 'Uncategorized':
                uncategorized_transactions.append(transaction)
        return uncategorized_transactions