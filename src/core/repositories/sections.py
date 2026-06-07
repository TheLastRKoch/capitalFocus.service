from core.repositories.base import BaseRepository
from sections.models import SectionsModel
from budgets.models import BudgetsModel


class SectionsRepository(BaseRepository):
    """Repository for managing section records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(SectionsModel)

    def all(self) -> list:
        return list(SectionsModel.objects.all().values())

    def get_by_budget_id(self, budget_id: str) -> list:
        return list(SectionsModel.objects.filter(budgets_id=budget_id).values())
