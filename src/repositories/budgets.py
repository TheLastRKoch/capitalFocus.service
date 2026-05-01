from environment import TEABLE_BUDGETS
from services.teable import TeableService


class BudgetsRepository:
    """Repository for managing budget records via Teable."""

    def __init__(self) -> None:
        """Initialize the budgets repository with a Teable service instance."""
        self.teable = TeableService()

    def all(self) -> dict:
        """
        Retrieve a list of budgets from the Teable service.

        Returns:
            dict: The JSON response containing the list of budgets.
        """
        return self.teable.read(TEABLE_BUDGETS)