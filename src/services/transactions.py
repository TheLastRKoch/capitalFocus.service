from repositories.transactions import TransactionsRepository

class TransactionService:
    def __init__(self):
        pass

    def get_uncategorized_transactions(self):
        transactions_repository = TransactionsRepository()
        transactions = transactions_repository.all()
        uncategorized_transactions = []
        for transaction in transactions:
            status = transaction.get('fields',{}).get('status')
            if status == 'Uncategorized':
                uncategorized_transactions.append(transaction)
        return uncategorized_transactions