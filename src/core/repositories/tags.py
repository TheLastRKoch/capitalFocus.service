from django.db import IntegrityError
from core.repositories.base import BaseRepository
from tags.models import TagModel


class TagsRepository(BaseRepository):
    """Repository for managing Tag records via Django ORM."""

    def __init__(self) -> None:
        super().__init__(TagModel)

    def list_all(self) -> list:
        """Return all tags as a list of dicts with id and label."""
        return list(self.model.objects.values('id', 'label').order_by('label'))

    def create(self, label: str) -> dict:
        """Create a new tag with the given label.

        Raises:
            ValueError: if the label is blank or already exists.
        """
        if not label or not label.strip():
            raise ValueError('Tag label must not be blank.')
        try:
            tag = self.model.objects.create(label=label.strip())
            return {'id': tag.id, 'label': tag.label}
        except IntegrityError:
            raise ValueError(f"A tag with label '{label}' already exists.")

    def delete(self, tag_id: int) -> bool:
        """Delete the tag with the given id.

        Returns:
            True if the tag was found and deleted, False if not found.
        """
        count, _ = self.model.objects.filter(pk=tag_id).delete()
        return count > 0
