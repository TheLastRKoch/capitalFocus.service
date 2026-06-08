from core.repositories.base import BaseRepository
from budgets.models import BudgetsModel


class BudgetsRepository(BaseRepository):
    """Repository for managing budget records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(BudgetsModel)

    def all(self) -> list:
        return list(BudgetsModel.objects.all().values())

    def list(self):
        return list(BudgetsModel.objects.all().values())

    def get_by_id(self, id) -> dict:
        return BudgetsModel.objects.filter(id=id).values().first()

    def get_by_status(self, status: str) -> list:
        return list(BudgetsModel.objects.filter(status=status).values())
