# from django.db import models
# from budgets.models import Budgets

# class Transactions(models.Model):
#     """Transactions model"""
#     TRANSACTION_TYPE_CHOICES = [
#         ('COMPRA', 'Compra'),
#         ('PAGO', 'Pago'),
#         ('RETIRO', 'Retiro'),
#         ('DEPOSITO', 'Deposito'),
#     ]

#     STATUS_CHOICES = [
#         ('Categorized', 'Categorized'),
#         ('Uncategorized', 'Uncategorized'),
#         ('Pending', 'Pending'),
#     ]

#     date = models.DateTimeField()
#     commerce = models.CharField(max_length=255)
#     amount = models.DecimalField(max_digits=15, decimal_places=2)
#     location = models.CharField(max_length=255)
#     card = models.CharField(max_length=50)
#     authorization = models.CharField(max_length=50)
#     reference = models.CharField(max_length=50)
#     transactionType = models.CharField(max_length=20,
#                                        choices=TRANSACTION_TYPE_CHOICES,
#                                        default='COMPRA')
#     subcategory = models.ForeignKey(Subcategories,
#                                     on_delete=models.SET_NULL,
#                                     related_name='transactions',
#                                     null=True,
#                                     blank=True)
#     status = models.CharField(max_length=20,
#                               choices=STATUS_CHOICES,
#                               default='Uncategorized')
#     json = models.TextField(blank=True, null=True)
#     html = models.TextField(blank=True, null=True)
#     budgets = models.ForeignKey(Budgets,
#                                 on_delete=models.CASCADE,
#                                 related_name='transactions',
#                                 null=True,
#                                 blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = 'budgets_transactions'

#     def __str__(self):
#         return f"{self.commerce} - {self.amount}"
