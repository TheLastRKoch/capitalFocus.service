from django.db import models
from budgets.models import Budget, Section

class Transaction(models.Model):
    STATUS_CHOICES = [
        ('Uncategorized', 'Uncategorized'),
        ('Categorized', 'Categorized'),
    ]
    commerce = models.CharField(max_length=255)
    date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    location = models.CharField(max_length=255, blank=True, null=True)
    card_detail = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Uncategorized')
    budget = models.ForeignKey(Budget, related_name='transactions', on_delete=models.SET_NULL, blank=True, null=True)
    section = models.ForeignKey(Section, related_name='transactions', on_delete=models.SET_NULL, blank=True, null=True)

    def __str__(self):
        return f"{self.commerce} - {self.amount}"
