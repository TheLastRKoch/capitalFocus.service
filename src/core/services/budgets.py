from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.contrib.auth import get_user_model

from core.repositories.budgets import BudgetsRepository
from core.repositories.sections import SectionsRepository
from core.repositories.transactions import TransactionsRepository
from core.repositories.categories import CategoriesRepository, SubcategoriesRepository


class BudgetValidationError(ValueError):
    """Raised when budget input fails validation."""


class BudgetOwnerConfigurationError(RuntimeError):
    """Raised when the configured default budget owner cannot be found."""


MAX_LABEL_LENGTH = 255
MAX_PROJECTION = Decimal('9999999999999.99')  # max_digits=15, decimal_places=2
BUDGET_STATUSES = ('Active', 'Inactive')


class BudgetService:
    """Service for orchestrating budget-related data operations."""

    def __init__(self, budgets_repo: BudgetsRepository, sections_repo: SectionsRepository,
                 transactions_repo: TransactionsRepository, categories_repo: CategoriesRepository,
                 subcategories_repo: SubcategoriesRepository) -> None:
        self.budgets_repo = budgets_repo
        self.sections_repo = sections_repo
        self.transactions_repo = transactions_repo
        self.categories_repo = categories_repo
        self.subcategories_repo = subcategories_repo

    def get_section_transactions(self, budget_id: str) -> list:
        """Retrieve sections with their associated transactions for a given budget."""

        section_transactions = []
        budget_spent = 0
        budget_encumbered = 0
        transactions = self.transactions_repo.get_by_budget_id(budget_id)
        sections = self.sections_repo.get_by_budget_id(budget_id)

        for section in sections:
            section_txns = [
                transaction for transaction in transactions
                if transaction.get('subcategory__parent_id') == section.get('category_id')
            ]

            # Calculate remaining: projection - sum of all transactions in this section
            spent = sum(t.get('amount', 0) for t in section_txns)
            projection = section.get('projection') or 0
            remaining = projection - spent
            budget_encumbered += projection
            budget_spent += spent

            section['transactions'] = section_txns
            section['total_spent'] = spent
            section['remaining'] = remaining

            section_transactions.append(section)

        return section_transactions, budget_encumbered, budget_spent

    def get_by_id(self, budget_id: str) -> dict:
        """Retrieve a budget by its ID."""
        return self.budgets_repo.get_by_id(budget_id)

    def create_budget(self, budget_data: dict) -> dict:
        """Create a budget owned by the configured default user."""
        if not isinstance(budget_data, dict):
            raise BudgetValidationError('Request body must be a JSON object.')

        label = self._validate_label(budget_data.get('label'))
        projection = self._validate_projection(budget_data.get('projection'))
        status = self._validate_status(budget_data.get('status'))

        owner = get_user_model().objects.filter(
            username=settings.DEFAULT_BUDGET_OWNER_USERNAME).first()
        if owner is None:
            raise BudgetOwnerConfigurationError(
                'The configured default budget owner account does not exist.')

        return self.budgets_repo.create({
            'label': label,
            'projection': projection,
            'status': status,
            'user_id': owner.id,
        })

    def create_section(self, budget_id: str, section_data: dict) -> dict:
        """Create a new section record linked to a budget."""
        section_data['budgets_id'] = budget_id
        return self.sections_repo.create(section_data)

    @staticmethod
    def _validate_label(value) -> str:
        if not isinstance(value, str) or not value.strip():
            raise BudgetValidationError('Budget name is required.')
        label = value.strip()
        if len(label) > MAX_LABEL_LENGTH:
            raise BudgetValidationError(
                f'Budget name must be at most {MAX_LABEL_LENGTH} characters.')
        return label

    @staticmethod
    def _validate_projection(value) -> Decimal:
        if value is None or isinstance(value, bool):
            raise BudgetValidationError(
                'Projection is required and must be a non-negative number.')

        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise BudgetValidationError(
                    'Projection is required and must be a non-negative number.')

        try:
            projection = Decimal(str(value))
        except (InvalidOperation, ValueError, TypeError):
            raise BudgetValidationError(
                'Projection is required and must be a non-negative number.')

        if not projection.is_finite() or projection < 0:
            raise BudgetValidationError(
                'Projection is required and must be a non-negative number.')
        if projection > MAX_PROJECTION:
            raise BudgetValidationError('Projection is too large.')
        if -projection.as_tuple().exponent > 2:
            raise BudgetValidationError(
                'Projection must have at most 2 decimal places.')
        return projection

    @staticmethod
    def _validate_status(value) -> str:
        if value is None:
            return 'Active'
        if not isinstance(value, str) or value not in BUDGET_STATUSES:
            raise BudgetValidationError(
                'Status must be either "Active" or "Inactive".')
        return value
