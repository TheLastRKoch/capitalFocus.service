from core.repositories.base import BaseRepository
from sections.models import SectionsModel
from budgets.models import BudgetsModel


class SectionsRepository(BaseRepository):
    """Repository for managing section records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(SectionsModel)

    def get_by_budget_id(self, budget_id: str) -> list:
        budget = BudgetsModel.objects.get(id=budget_id)
        return list(SectionsModel.objects.filter(budgets=budget))
