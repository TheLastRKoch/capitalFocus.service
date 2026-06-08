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
