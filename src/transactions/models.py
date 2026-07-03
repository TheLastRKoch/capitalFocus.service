from django.db import models
from budgets.models import BudgetsModel
from categories.models import SubcategoriesModel


class TransactionsModel(models.Model):

    STATUS_CHOICES = [
        ('Categorized', 'Categorized'),
        ('Uncategorized', 'Uncategorized'),
        ('Pending', 'Pending'),
        ('Mock', 'Mock'),
    ]

    date = models.DateTimeField()
    commerce = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    location = models.CharField(max_length=255, null=True, blank=True)
    card = models.CharField(max_length=50, null=True, blank=True)
    authorization = models.CharField(max_length=50, null=True, blank=True)
    reference = models.CharField(max_length=50, null=True, blank=True)
    transactionType = models.CharField(max_length=255, null=True, blank=True)
    budgets = models.ForeignKey(BudgetsModel,
                                on_delete=models.CASCADE,
                                related_name='transactions',
                                null=True,
                                blank=True)
    subcategory = models.ForeignKey(SubcategoriesModel,
                                    on_delete=models.SET_NULL,
                                    related_name='transactions',
                                    null=True,
                                    blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Uncategorized')
    json = models.TextField(blank=True, null=True)
    html = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        verbose_name_plural = 'Transactions'

    def __str__(self):
        return f'{self.commerce} - {self.amount}'
