from datetime import datetime
from core.repositories.transactions import TransactionsRepository
from categories.models import SubcategoriesModel
from budgets.models import BudgetsModel


class TransactionService:

    def __init__(self, transactions_repo: TransactionsRepository) -> None:
        self.transactions_repo = transactions_repo

    def add_list(self, transactions):
        for transaction in transactions:

            formated_date = datetime.strptime(transaction.get('date'), "%Y-%m-%d %H:%M:%S")
            subcategory = SubcategoriesModel.objects.get(id=transaction.get('subcategory'))
            budget = BudgetsModel.objects.get(id=transaction.get('budget'))

            self.transactions_repo.add(date=formated_date,
                                       commerce=transaction.get('commerce'),
                                       amount=transaction.get('amount'),
                                       location=transaction.get('location'),
                                       card=transaction.get('card'),
                                       authorization=transaction.get('authorization'),
                                       reference=transaction.get('reference'),
                                       transactionType=transaction.get('transactionType'),
                                       status=transaction.get('status'),
                                       subcategory=subcategory,
                                       budget=budget)
