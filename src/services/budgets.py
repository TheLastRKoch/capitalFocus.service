from repositories.budgets import BudgetsRepository
from repositories.sections import SectionsRepository
from repositories.transactions import TransactionsRepository

class BudgetService:
    """Service for orchestrating budget-related data operations."""

    def __init__(
        self,
        budgets_repo: BudgetsRepository,
        sections_repo: SectionsRepository,
        transactions_repo: TransactionsRepository
    ) -> None:
        self.budgets_repo = budgets_repo
        self.sections_repo = sections_repo
        self.transactions_repo = transactions_repo

    def get_budget_details(self, budget_id: str) -> dict:
        """
        Retrieve full details for a budget, including sections and transactions.
        Optimized to reduce redundant calls.
        """
        budget = self.budgets_repo.get_by_id(budget_id)
        
        # Load all sections and transactions once to avoid N+1 issues in memory
        all_sections = {s['id']: s for s in self.sections_repo.all()}
        all_transactions = {t['id']: t for t in self.transactions_repo.all()}

        sections_complete = []
        section_links = budget.get('fields', {}).get('sections', [])
        
        for link in section_links:
            section_id = link.get('id')
            section = all_sections.get(section_id)
            
            if section:
                # Create a copy to avoid mutating the cached section
                section_copy = dict(section)
                section_copy['fields'] = dict(section.get('fields', {}))
                
                transaction_links = section_copy['fields'].get('transactions', [])
                transactions_complete = []
                
                for t_link in transaction_links:
                    t_id = t_link.get('id')
                    transaction = all_transactions.get(t_id)
                    if transaction:
                        transactions_complete.append(transaction)
                
                section_copy['fields']['transactions'] = transactions_complete
                sections_complete.append(section_copy)

        budget_copy = dict(budget)
        budget_copy['fields'] = dict(budget.get('fields', {}))
        budget_copy['fields']['sections'] = sections_complete
        
        return budget_copy

    def create_budget(self, budget_data: dict) -> dict:
        """
        Create a new budget record.

        Args:
            budget_data (dict): The data for the new budget.

        Returns:
            dict: The created budget record.
        """
        if 'status' not in budget_data:
            budget_data['status'] = 'Active'
        
        return self.budgets_repo.create(budget_data)
