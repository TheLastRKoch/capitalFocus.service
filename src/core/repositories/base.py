from abc import ABC
from django.db import models
from django.forms.models import model_to_dict


class BaseRepository(ABC):
    """Abstract base repository for Django models."""

    def __init__(self, model: models.Model) -> None:
        self.model = model

    def _to_dict(self, instance: models.Model) -> dict:
        """Convert a Django model instance to a dictionary."""
        if not instance:
            return None
        return model_to_dict(instance)

    def all(self) -> list:
        """Retrieve all records from the table."""
        return list(self.model.objects.all().values())

    def get_by_id(self, entity_id: str) -> dict:
        """Retrieve a specific record by its ID."""
        try:
            # Handle string IDs from URL/Frontend
            pk = int(entity_id) if str(entity_id).isdigit() else entity_id
            obj = self.model.objects.filter(pk=pk).values().first()
            return obj
        except (self.model.DoesNotExist, ValueError):
            return None

    def filter_by_field(self, field_name: str, value: any) -> list:
        """Filter records by a specific field value."""
        kwargs = {field_name: value}
        return list(self.model.objects.filter(**kwargs).values())

    def create(self, fields: dict) -> dict:
        """Create a new record in the table."""
        obj = self.model.objects.create(**fields)
        return self._to_dict(obj)

    def update(self, entity_id: str, fields: dict) -> dict:
        """Update an existing record in the table."""
        pk = int(entity_id) if str(entity_id).isdigit() else entity_id
        self.model.objects.filter(pk=pk).update(**fields)
        obj = self.model.objects.get(pk=pk)
        return self._to_dict(obj)

    def delete(self, entity_id: str) -> bool:
        """Delete a record by its ID."""
        pk = int(entity_id) if str(entity_id).isdigit() else entity_id
        count, _ = self.model.objects.filter(pk=pk).delete()
        return count > 0
