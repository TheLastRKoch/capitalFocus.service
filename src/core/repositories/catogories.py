from categories.models import CategoriesModel, SubcategoriesModel


class CategoriesRepository:

    def list(self):
        return list(CategoriesModel.objects.all())


class SubcategoriesRepository:

    def list(self):
        return list(SubcategoriesModel.objects.all())
