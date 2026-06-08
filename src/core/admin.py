from django.contrib import admin
from budgets.models import BudgetsModel
from sections.models import SectionsModel
from transactions.models import TransactionsModel
from categories.models import CategoriesModel, SubcategoriesModel

# Register your model
admin.site.register(BudgetsModel)
admin.site.register(SectionsModel)
admin.site.register(TransactionsModel)
admin.site.register(CategoriesModel)
admin.site.register(SubcategoriesModel)
