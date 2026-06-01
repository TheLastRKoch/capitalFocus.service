from django.db import models


class UsersModel(models.Model):
    """Custom Users model (extends Django's built-in User)"""
    email = models.EmailField(unique=True)
    label = models.CharField(max_length=255)
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.label} ({self.email})"
