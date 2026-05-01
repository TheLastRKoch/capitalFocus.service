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