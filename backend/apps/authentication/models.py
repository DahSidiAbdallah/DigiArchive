"""Authentication models."""

from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom user model for MAFCI DigiArchive.
    
    Extends the default Django user model to allow for additional
    fields and customization.
    """
    
    # Add custom fields here if needed
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        
    def __str__(self):
        return self.username
