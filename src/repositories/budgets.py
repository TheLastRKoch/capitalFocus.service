from repositories.base import BaseRepository


class BudgetsRepository(BaseRepository):
    """Repository for managing budget records via Teable."""

    def get_by_status(self, target_status: str) -> list:
        """
        Retrieve budgets filtered by status.

        Args:
            target_status (str): The status to filter by (e.g., 'Active', 'Inactive').

        Returns:
            list: A list of budgets matching the given status.
        """
        return self.filter_by_field('status', target_status)
