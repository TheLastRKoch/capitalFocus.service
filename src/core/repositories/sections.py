from core.repositories.base import BaseRepository
from sections.models import SectionsModel


class SectionsRepository(BaseRepository):
    """Repository for managing section records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(SectionsModel)

    def filter_by_budget(self, budget_id: str) -> list:
        """
        Filter sections by a specific budget ID.

        Args:
            budget_id (str): The unique identifier of the budget.

        Returns:
            list: A list of sections associated with the given budget ID.
        """
        return self.filter_by_field('budgets_id', budget_id)
