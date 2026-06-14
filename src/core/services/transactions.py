from core.repositories.transactions import TransactionsRepository
from budgets.models import BudgetsModel
from categories.models import SubcategoriesModel


class TransactionService:
    """Service for orchestrating transaction-related data operations."""

    def __init__(self, transactions_repo: TransactionsRepository) -> None:
        self.transactions_repo = transactions_repo

    def create_batch(self, data: list) -> int:
        """Create a batch of transactions with resolution of foreign keys by label."""
        if not isinstance(data, list):
            raise ValueError('Expected a list of transactions')

        # Get valid field names for the model
        model = self.transactions_repo.model
        valid_fields = {f.name for f in model._meta.get_fields() if not f.auto_created}
        # Also include the _id versions of foreign keys
        valid_fields.update({
            f.name + '_id' for f in model._meta.get_fields() 
            if f.is_relation and not f.auto_created
        })

        # Cache for label to ID resolution to avoid excessive DB queries
        budget_cache = {}
        subcategory_cache = {}

        created_count = 0
        for item in data:
            # Map 'budget' to 'budgets_id' if provided
            if 'budget' in item:
                val = item.pop('budget')
                if val:
                    if isinstance(val, str) and not str(val).isdigit():
                        if val not in budget_cache:
                            b = BudgetsModel.objects.filter(label__iexact=val).first()
                            budget_cache[val] = b.id if b else None
                        item['budgets_id'] = budget_cache[val]
                    else:
                        item['budgets_id'] = val
            
            # Map 'subcategory' to 'subcategory_id' if provided
            if 'subcategory' in item:
                val = item.pop('subcategory')
                if val:
                    if isinstance(val, str) and not str(val).isdigit():
                        if val not in subcategory_cache:
                            s = SubcategoriesModel.objects.filter(label__iexact=val).first()
                            subcategory_cache[val] = s.id if s else None
                        item['subcategory_id'] = subcategory_cache[val]
                    else:
                        item['subcategory_id'] = val

            # Filter item to only include valid fields
            filtered_item = {k: v for k, v in item.items() if k in valid_fields}
            
            if filtered_item:
                self.transactions_repo.create(filtered_item)
                created_count += 1

        return created_count

    def update_transaction(self, transaction_id: str, data: dict) -> dict:
        """Update a transaction with mapping for budgets and sections."""
        fields = {
            'budgets_id': data.get('budget'),
            'subcategory_id': data.get('category'),
            'status': 'Categorized'
        }
        # Filter out None values
        fields = {k: v for k, v in fields.items() if v is not None}
        
        return self.transactions_repo.update(transaction_id, fields)
