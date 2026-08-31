from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.template.response import TemplateResponse
from budgets.models import BudgetsModel
from sections.models import SectionsModel
from transactions.models import TransactionsModel
from transactions.forms import SubcategorySelectForm
from categories.models import CategoriesModel, SubcategoriesModel

# Register your model
admin.site.register(BudgetsModel)


@admin.register(CategoriesModel)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'label')


@admin.register(SubcategoriesModel)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'parent', 'label')
    list_filter = ['parent']


@admin.register(SectionsModel)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'label', 'budgets', 'projection')
    search_fields = ('date', 'label', 'budgets')
    list_filter = ('budgets', 'category')


@admin.register(TransactionsModel)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'date', 'commerce', 'amount', 'location', 'card', 'authorization', 'reference',
                    'transactionType', 'subcategory', 'status', 'budgets')
    search_fields = ('id', 'date', 'commerce', 'location')
    list_filter = ('date', 'budgets', 'status', 'subcategory')
    actions = ['select_subcategory']

    @admin.action(description='Select subcategory')
    def select_subcategory(self, request, queryset):
        if 'apply' in request.POST:
            form = SubcategorySelectForm(request.POST)
            if form.is_valid():
                selected_subcategory = form.cleaned_data['subcategory']
                updated_count = queryset.update(
                    subcategory=selected_subcategory,
                    status='Categorized'
                )
                self.message_user(
                    request,
                    f"Successfully assigned subcategory '{selected_subcategory}' to {updated_count} transaction(s).",
                    messages.SUCCESS
                )
                return HttpResponseRedirect(request.get_full_path())
        else:
            form = SubcategorySelectForm()

        context = {
            **self.admin_site.each_context(request),
            'title': 'Assign Subcategory to Selected Transactions',
            'form': form,
            'transactions': queryset,
            'opts': self.model._meta,
            'action_checkbox_name': admin.helpers.ACTION_CHECKBOX_NAME,
            'media': self.media,
        }
        return TemplateResponse(
            request,
            'admin/transactions/select_subcategory.html',
            context
        )
