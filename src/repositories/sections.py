from environment import TEABLE_SECTIONS
from services.teable import TeableService


class SectionsRepository:
    """Repository for managing transaction records via Teable."""

    def __init__(self) -> None:
        """Initialize the transactions repository with a Teable service instance."""
        self.teable = TeableService()

    def all(self) -> list:
        """
        Retrieve a list of sections from the Teable service.

        Returns:
            list: A list of section records.
        """
        return self.teable.read(TEABLE_SECTIONS)

    def filter_by_budget(self, budget_id: str) -> list:
        """
        Filter sections by a specific budget ID.

        Args:
            budget_id (str): The unique identifier of the budget.

        Returns:
            list: A list of sections associated with the given budget ID.
        """
        sections = self.all()
        return [
            section for section in sections if section.get('fields', {}).get(
                'budgets', {}).get('id') == budget_id
        ]

    def get_by_id(self, id):
        sections = self.all()
        return [section for section in sections if section.get('id') == id][0]
