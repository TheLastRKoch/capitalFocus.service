from core.repositories.transactions import TransactionsRepository


class TransactionService:

    def __init__(self, transactions_repo: TransactionsRepository) -> None:
        self.transactions_repo = transactions_repo

    def add(self, date, commerce, amount, location, card, authorization,
            reference, transactionType, subcategory, status, json, html,
            budgets, created_at, updated_at):
        return self.transactions_repo.add(
            date=date,
            commerce=commerce,
            amount=amount,
            location=location,
            card=card,
            authorization=authorization,
            reference=reference,
            transactionType=transactionType,
            subcategory=subcategory,
            status=status,
            json=json,
            html=html,
            budgets=budgets,
        )

    def add_list(transactions):
        for transaction in transactions:
            self.add(
                date=date,
                commerce=commerce,
                amount=amount,
                location=location,
                card=card,
                authorization=authorization,
                reference=reference,
                transactionType=transactionType,
                subcategory=subcategory,
                status=status,
                json=json,
                html=html,
                budgets=budgets,
            )
