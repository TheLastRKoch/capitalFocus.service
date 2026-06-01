from core.repositories.base import BaseRepository
from budgets.models import Section

class SectionsRepository(BaseRepository):
    """Repository for managing section records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(Section)

    def filter_by_budget(self, budget_id: str) -> list:
        """
        Filter sections by a specific budget ID.

        Args:
            budget_id (str): The unique identifier of the budget.

        Returns:
            list: A list of sections associated with the given budget ID.
        """
        return self.filter_by_field('budget_id', budget_id)
