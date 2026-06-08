from core.repositories.base import BaseRepository
from sections.models import SectionsModel


class SectionsRepository(BaseRepository):
    """Repository for managing section records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(SectionsModel)

    def get_by_budget_id(self, budget_id: str) -> list:
        """Filter sections by budget ID."""
        return self.filter_by_field('budgets_id', budget_id)
