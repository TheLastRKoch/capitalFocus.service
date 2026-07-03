from django.contrib import admin
from budgets.models import BudgetsModel
from sections.models import SectionsModel
from transactions.models import TransactionsModel
from categories.models import CategoriesModel, SubcategoriesModel

# Register your model
admin.site.register(BudgetsModel)
admin.site.register(SectionsModel)
admin.site.register(CategoriesModel)
admin.site.register(SubcategoriesModel)


@admin.register(TransactionsModel)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'date', 'commerce', 'amount', 'location', 'card', 'authorization', 'reference',
                    'transactionType', 'subcategory', 'status', 'budgets')
    search_fields = ('date', 'commerce', 'location')
    list_filter = ('date', 'budgets', 'status', 'subcategory')
