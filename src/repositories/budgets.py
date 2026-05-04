from environment import TEABLE_BUDGETS
from services.teable import TeableService


class BudgetsRepository:
    """Repository for managing budget records via Teable."""

    def __init__(self) -> None:
        """Initialize the budgets repository with a Teable service instance."""
        self.teable = TeableService()

    def all(self) -> list:
        """
        Retrieve a list of budgets from the Teable service.

        Returns:
            list: A list of budget records.
        """
        return self.teable.read(TEABLE_BUDGETS)

    def get_by_status(self, target_status: str) -> list:
        """
        Retrieve budgets filtered by status.

        Args:
            target_status (str): The status to filter by (e.g., 'Active', 'Inactive').

        Returns:
            list: A list of budgets matching the given status.
        """
        budgets = self.all()
        return [
            budget for budget in budgets 
            if budget.get('fields', {}).get('status') == target_status
        ]

    def get_by_id(self, budget_id: str) -> list:
        """
        Retrieve a budget by its unique identifier.

        Args:
            budget_id (str): The unique identifier of the budget.

        Returns:
            list: A list containing the budget(s) matching the ID.
        """
        budgets = self.all()
        return [
            budget for budget in budgets 
            if budget.get('id') == budget_id
        ] 
 