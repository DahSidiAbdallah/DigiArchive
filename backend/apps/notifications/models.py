"""Notification models for the system."""

from django.db import models
from django.conf import settings


class Notification(models.Model):
    """Model for storing user notifications."""

    TYPES = (
        ('document_upload', 'Document Upload'),
        ('document_process', 'Document Processing'),
        ('ocr_complete', 'OCR Complete'),
        ('share', 'Document Shared'),
        ('comment', 'New Comment'),
        ('tag', 'New Tag'),
        ('system', 'System Notification'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='User who should receive the notification'
    )
    
    notification_type = models.CharField(
        max_length=50,
        choices=TYPES,
        help_text='Type of notification'
    )
    
    title = models.CharField(
        max_length=255,
        help_text='Title of the notification'
    )
    
    message = models.TextField(
        help_text='Message content of the notification'
    )
    
    document = models.ForeignKey(
        'documents.Document',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        help_text='Related document if applicable'
    )
    
    is_read = models.BooleanField(
        default=False,
        help_text='Whether the notification has been read'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='When the notification was created'
    )
    
    def __str__(self):
        """Return string representation of the notification."""
        return f"{self.title} - {self.user.username}"
    
    class Meta:
        """Meta options for Notification model."""
        
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
