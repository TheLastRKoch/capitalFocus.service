from django.db import models


class TagModel(models.Model):
    label = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tags'
        verbose_name_plural = 'Tags'

    def __str__(self):
        return self.label
