from abc import ABC
from django.db import models
from django.forms.models import model_to_dict


class BaseRepository(ABC):
    """Abstract base repository for Django models."""

    def __init__(self, model: models.Model) -> None:
        self.model = model

    def _to_teable_dict(self, instance: models.Model) -> dict:
        """Convert a Django model instance to a Teable-like dictionary."""
        data = model_to_dict(instance)
        # Extract ID and remove it from fields
        obj_id = str(data.pop('id'))

        # Handle ForeignKeys/ManyToMany if necessary to match Teable format
        # Teable links are usually [{id: ...}]
        for field in instance._meta.get_fields():
            if field.name in data:
                if isinstance(field,
                              (models.ForeignKey, models.OneToOneField)):
                    if data[field.name]:
                        data[field.name] = [{'id': str(data[field.name])}]
                elif isinstance(field, models.ManyToManyField):
                    data[field.name] = [{
                        'id': str(item_id)
                    } for item_id in data[field.name]]

        return {'id': obj_id, 'fields': data}

    def all(self) -> list:
        """Retrieve all records from the table."""
        return [self._to_teable_dict(obj) for obj in self.model.objects.all()]

    def get_by_id(self, entity_id: str) -> dict:
        """Retrieve a specific record by its ID."""
        try:
            # Handle string IDs from URL/Frontend
            pk = int(entity_id) if entity_id.isdigit() else entity_id
            obj = self.model.objects.get(pk=pk)
            return self._to_teable_dict(obj)
        except (self.model.DoesNotExist, ValueError):
            raise ValueError(
                f'Record with id {entity_id} not found in {self.model.__name__}'
            )

    def filter_by_field(self, field_name: str, value: any) -> list:
        """Filter records by a specific field value."""
        kwargs = {field_name: value}
        return [
            self._to_teable_dict(obj)
            for obj in self.model.objects.filter(**kwargs)
        ]

    def create(self, fields: dict) -> dict:
        """
        Create a new record in the table.

        Args:
            fields (dict): The field values for the new record.

        Returns:
            dict: The created record.
        """
        # Teable might send linked fields as [{'id': ...}]
        # We need to extract the ID for Django ORM
        clean_fields = {}
        for key, val in fields.items():
            if isinstance(val, list) and len(val) > 0 and isinstance(
                    val[0], dict) and 'id' in val[0]:
                clean_fields[key + '_id'] = val[0]['id']
            elif isinstance(val, dict) and 'id' in val:
                clean_fields[key + '_id'] = val['id']
            else:
                clean_fields[key] = val

        obj = self.model.objects.create(**clean_fields)
        return self._to_teable_dict(obj)

    def update(self, entity_id: str, fields: dict) -> dict:
        """
        Update an existing record in the table.

        Args:
            entity_id (str): The ID of the record to update.
            fields (dict): The field values to update.

        Returns:
            dict: The updated record.
        """
        pk = int(entity_id) if entity_id.isdigit() else entity_id

        clean_fields = {}
        for key, val in fields.items():
            if isinstance(val, list) and len(val) > 0 and isinstance(
                    val[0], dict) and 'id' in val[0]:
                clean_fields[key + '_id'] = val[0]['id']
            elif isinstance(val, dict) and 'id' in val:
                clean_fields[key + '_id'] = val['id']
            else:
                clean_fields[key] = val

        self.model.objects.filter(pk=pk).update(**clean_fields)
        obj = self.model.objects.get(pk=pk)
        return self._to_teable_dict(obj)
