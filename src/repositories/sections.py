from environment import TEABLE_SECTIONS
from services.teable import TeableService


class SectionsRepository:
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
        return self.teable.read(TEABLE_SECTIONS)
    
    def filter_by_budget(self, budget_id: str) -> list:
        sections = self.all()
        return [
            section for section in sections 
            if section.get('fields', {}).get('budgets',{}).get('id') == budget_id
        ]