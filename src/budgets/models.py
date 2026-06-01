from django.db import models

class Budget(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]
    name = models.CharField(max_length=255)
    projection = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')

    def __str__(self):
        return self.name

class Section(models.Model):
    label = models.CharField(max_length=255)
    projection = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    category = models.CharField(max_length=255, blank=True, null=True)
    budget = models.ForeignKey(Budget, related_name='sections', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.label} ({self.budget.name})"
