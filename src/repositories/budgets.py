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
    
    def get_by_status(self, target_status: str) -> list:
        """
        Retrieve budgets filtered by status.

        Args:
            target_status (str): The status to filter by (e.g., 'active', 'inactive').

        Returns:
            list: A list of budgets matching the given status.
        """
        budgets = self.all()
        return [
            budget for budget in budgets 
            if budget.get('fields', {}).get('status') == target_status
        ]
    
    def get_by_id(self, id):
        budgets = self.all()
        return [
            budget for budget in budgets 
            if budget.get('id') == id
        ] 