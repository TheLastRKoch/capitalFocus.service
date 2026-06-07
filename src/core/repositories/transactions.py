from core.repositories.base import BaseRepository
from transactions.models import TransactionsModel
from budgets.models import BudgetsModel


class TransactionsRepository(BaseRepository):

    def __init__(self) -> None:
        super().__init__(TransactionsModel)

    def list_uncategorized(self) -> list:
        return list(
            TransactionsModel.objects.filter(status='Uncategorized').values())

    def list():
        return list(TransactionsModel.objects.all().values())

    def get_by_id(self, id: str) -> list:
        return TransactionsModel.objects.filter(id=id)

    def get_by_budget_id(self, budget_id):
        budget = BudgetsModel.objects.get(id=budget_id)
        return list(TransactionsModel.objects.filter(budgets=budget))
