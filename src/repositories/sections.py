from repositories.base import BaseRepository


class SectionsRepository(BaseRepository):
    """Repository for managing section records via Teable."""

    def filter_by_budget(self, budget_id: str) -> list:
        """
        Filter sections by a specific budget ID.

        Args:
            budget_id (str): The unique identifier of the budget.

        Returns:
            list: A list of sections associated with the given budget ID.
        """
        sections = self.all()
        return [
            section for section in sections if section.get('fields', {}).get(
                'budgets', {}).get('id') == budget_id
        ]
