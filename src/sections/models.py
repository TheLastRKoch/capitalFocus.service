from django.db import models
from budgets.models import BudgetsModel
from categories.models import CategoriesModel


class SectionsModel(models.Model):
    """Sections model"""
    label = models.CharField(max_length=255)
    budgets = models.ForeignKey(BudgetsModel,
                                on_delete=models.CASCADE,
                                related_name='budgets',
                                blank=True,
                                null=True)
    category = models.ForeignKey(CategoriesModel,
                                 on_delete=models.SET_NULL,
                                 related_name='categories',
                                 null=True,
                                 blank=True)
    projection = models.DecimalField(max_digits=15,
                                     decimal_places=2,
                                     blank=True,
                                     null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sections'
        verbose_name_plural = 'Sections'

    def __str__(self):
        return self.label
