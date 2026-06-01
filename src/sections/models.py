from django.db import models
from budgets.models import BudgetsModel
from categories.models import CategoriesModel


class Sections(models.Model):
    """Sections model"""
    label = models.CharField(max_length=255)
    budgets = models.OneToOneField(BudgetsModel,
                                   on_delete=models.CASCADE,
                                   related_name='section',
                                   null=True,
                                   blank=True)
    categories = models.ManyToManyField(CategoriesModel,
                                        related_name='sections',
                                        blank=True)
    projection = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'budgets_sections'

    def __str__(self):
        return self.label
