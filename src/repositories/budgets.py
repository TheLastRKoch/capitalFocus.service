from environment import TEABLE_BUDGETS
from services.teable import TeableService

from repositories.sections import SectionsRepository
from repositories.transactions import TransactionsRepository


class BudgetsRepository:
    """Repository for managing budget records via Teable."""

    def __init__(self) -> None:
        """Initialize the budgets repository with a Teable service instance."""
        self.teable = TeableService()
        self.sections_repo = SectionsRepository()
        self.transactions_repo = TransactionsRepository()

    def all(self) -> list:
        """
        Retrieve a list of budgets from the Teable service.

        Returns:
            list: A list of budget records.
        """
        return self.teable.read(TEABLE_BUDGETS)

    def get_by_status(self, target_status: str) -> list:
        """
        Retrieve budgets filtered by status.

        Args:
            target_status (str): The status to filter by (e.g., 'Active', 'Inactive').

        Returns:
            list: A list of budgets matching the given status.
        """
        budgets = self.all()
        return [
            budget for budget in budgets
            if budget.get('fields', {}).get('status') == target_status
        ]

    def get_by_id(self, id):

        budgets = [budget for budget in self.all()
                   if budget.get('id') == id][0]

        sections_complete = []
        sections = budgets.get('fields', {}).get('sections', {})
        for section in sections:
            section_complete = self.sections_repo.get_by_id(section.get('id'))
            if section_complete:
                transactions_complete = []
                transactions = section_complete.get('fields', {}).get(
                    'transactions', {})
                for transaction in transactions:
                    complete_transaction = self.transactions_repo.get_by_id(
                        transaction.get('id'))
                    if complete_transaction:
                        transactions_complete.append(complete_transaction)

                sections_complete.append(section_complete)

            section_complete['fields']['transactions'] = transactions_complete

        budgets['fields']['sections'] = sections_complete

        return budgets
