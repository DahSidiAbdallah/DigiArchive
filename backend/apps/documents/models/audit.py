"""Audit trail models for document activities."""

from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


class AuditLog(models.Model):
    """Log of user activities for auditing purposes."""
    
    ACTION_TYPES = (
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('view', 'Viewed'),
        ('download', 'Downloaded'),
        ('share', 'Shared'),
        ('ocr', 'OCR Processed'),
        ('tag', 'Tagged'),
        ('untag', 'Untagged'),
        ('move', 'Moved'),
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        help_text='User who performed the action'
    )
    
    action_type = models.CharField(
        max_length=20,
        choices=ACTION_TYPES,
        help_text='Type of action performed'
    )
    
    # Generic relation to any model
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text='Type of object acted upon'
    )
    object_id = models.PositiveIntegerField(
        help_text='ID of the object acted upon'
    )
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Metadata
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text='When the action was performed'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address of the user'
    )
    user_agent = models.TextField(
        blank=True,
        help_text='User agent string'
    )
    
    # Additional context
    description = models.TextField(
        blank=True,
        help_text='Description of the action performed'
    )
    
    # Changes data
    changes = models.JSONField(
        null=True,
        blank=True,
        help_text='JSON field containing changes made'
    )

    def __str__(self):
        """Return a string representation of the audit log entry."""
        return f"{self.action_type} by {self.user} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        """Meta options for AuditLog model."""
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
