from core.repositories.base import BaseRepository
from transactions.models import TransactionsModel
from budgets.models import BudgetsModel


class TransactionsRepository(BaseRepository):

    def __init__(self) -> None:
        super().__init__(TransactionsModel)

    def all(self) -> list:
        return list(TransactionsModel.objects.all().values())

    def list_uncategorized(self) -> list:
        return list(
            TransactionsModel.objects.filter(status='Uncategorized').values())

    def list(self) -> list:
        return list(TransactionsModel.objects.all().values())

    def get_by_id(self, id: str) -> dict:
        return TransactionsModel.objects.filter(id=id).values().first()

    def get_by_budget_id(self, budget_id):
        return list(TransactionsModel.objects.filter(budgets_id=budget_id).values(
            'id', 'date', 'commerce', 'amount', 'location', 'card', 'status',
            'subcategory_id', 'subcategory__parent_id'
        ))
