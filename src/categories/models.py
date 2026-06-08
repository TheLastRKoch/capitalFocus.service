from django.db import models


class CategoriesModel(models.Model):
    """Categories model"""
    label = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.label


class SubcategoriesModel(models.Model):
    """Subcategories model"""
    parent = models.ForeignKey(CategoriesModel,
                               on_delete=models.CASCADE,
                               related_name='subcategories')
    label = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subcategories'
        verbose_name_plural = 'Subcategories'

    def __str__(self):
        return f'{self.label} ({self.parent.label})'
