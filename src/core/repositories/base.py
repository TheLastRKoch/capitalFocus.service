from abc import ABC
from django.db import models

class BaseRepository(ABC):
    """Abstract base repository for Django entities."""

    def __init__(self, model: type[models.Model]) -> None:
        self.model = model

    def all(self) -> list:
        """Retrieve all records from the database."""
        # Note: In Django we usually work with QuerySets, but for parity we return list of dicts or objects.
        # However, it might be better to return the model instances.
        # The existing code expects dicts with 'fields' key because of Teable.
        # I should probably update the services to expect model instances instead.
        return list(self.model.objects.all())

    def get_by_id(self, entity_id: any) -> models.Model:
        """Retrieve a specific record by its ID."""
        try:
            return self.model.objects.get(id=entity_id)
        except self.model.DoesNotExist:
            raise ValueError(f'Record with id {entity_id} not found in {self.model.__name__}')

    def filter_by_field(self, field_name: str, value: any) -> list:
        """Filter records by a specific field value."""
        filter_kwargs = {field_name: value}
        return list(self.model.objects.filter(**filter_kwargs))

    def create(self, fields: dict) -> models.Model:
        """
        Create a new record in the database.

        Args:
            fields (dict): The field values for the new record.

        Returns:
            models.Model: The created record.
        """
        return self.model.objects.create(**fields)

    def update(self, entity_id: any, fields: dict) -> models.Model:
        """
        Update an existing record in the database.

        Args:
            entity_id (any): The ID of the record to update.
            fields (dict): The field values to update.

        Returns:
            models.Model: The updated record.
        """
        instance = self.get_by_id(entity_id)
        for key, value in fields.items():
            setattr(instance, key, value)
        instance.save()
        return instance
