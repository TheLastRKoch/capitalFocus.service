from abc import ABC, abstractmethod
from services.teable import TeableService

class BaseRepository(ABC):
    """Abstract base repository for Teable entities."""

    def __init__(self, teable_service: TeableService, table_id: str) -> None:
        self.teable = teable_service
        self.table_id = table_id

    def all(self) -> list:
        """Retrieve all records from the table."""
        return self.teable.read(self.table_id)

    def get_by_id(self, entity_id: str) -> dict:
        """Retrieve a specific record by its ID."""
        records = self.all()
        for record in records:
            if record.get('id') == entity_id:
                return record
        raise ValueError(f'Record with id {entity_id} not found in {self.table_id}')

    def filter_by_field(self, field_name: str, value: any) -> list:
        """Filter records by a specific field value."""
        return [
            record for record in self.all()
            if record.get('fields', {}).get(field_name) == value
        ]

    def create(self, fields: dict) -> dict:
        """
        Create a new record in the table.

        Args:
            fields (dict): The field values for the new record.

        Returns:
            dict: The created record.
        """
        return self.teable.create(self.table_id, fields)
