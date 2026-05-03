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
    
    def get_by_status(self, status):
        budgets = self.all()
        filtered_budgets = []
        for budget in budgets:
            status = budget.get('fields',{}).get('status')
            if status == status:
                filtered_budgets.append(budget)
        return filtered_budgets