from django.db.models import F
from core.repositories.base import BaseRepository
from categories.models import CategoriesModel, SubcategoriesModel


class CategoriesRepository(BaseRepository):
    """Repository for managing categories via Django ORM."""

    def __init__(self) -> None:
        super().__init__(CategoriesModel)


class SubcategoriesRepository(BaseRepository):
    """Repository for managing subcategories via Django ORM."""

    def __init__(self) -> None:
        super().__init__(SubcategoriesModel)

    def list_all(self) -> list:
        """List all subcategories with their parent category label."""
        return list(
            self.model.objects.annotate(parent_label=F('parent__label')).order_by(
                'parent__label', 'label').values('id', 'label', 'parent_label'))
