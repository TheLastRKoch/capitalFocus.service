from core.repositories.base import BaseRepository
from budgets.models import BudgetsModel


class BudgetsRepository(BaseRepository):
    """Repository for managing budget records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(BudgetsModel)

    def get_by_status(self, status: str) -> list:
        """Filter budgets by status."""
        return self.filter_by_field('status', status)
