from django.db import models
from users.models import UsersModel


class BudgetsModel(models.Model):
    """Budgets model"""
    label = models.CharField(max_length=255)
    user = models.ForeignKey(UsersModel,
                             on_delete=models.CASCADE,
                             related_name='budgets')
    status = models.CharField(max_length=20,
                              choices=[('Active', 'Active'),
                                       ('Inactive', 'Inactive')],
                              default='Inactive')
    projection = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'budgets'

    def __str__(self):
        return f"{self.label} - {self.user.label}"
