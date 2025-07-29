"""Notification serializers."""

from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notification objects."""
    
    document_title = serializers.SerializerMethodField()
    document_id = serializers.SerializerMethodField()
    time_since = serializers.SerializerMethodField()
    
    class Meta:
        """Serializer meta options."""
        
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 
            'is_read', 'created_at', 'document_title', 
            'document_id', 'time_since'
        ]
        read_only_fields = ['id', 'notification_type', 'title', 'message', 'created_at']
    
    def get_document_title(self, obj):
        """Get the title of the related document if it exists."""
        if obj.document:
            return obj.document.title
        return None
    
    def get_document_id(self, obj):
        """Get the ID of the related document if it exists."""
        if obj.document:
            return obj.document.id
        return None
    
    def get_time_since(self, obj):
        """Get a human-readable time since the notification was created."""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return 'just now'
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f'{minutes} minute{"s" if minutes != 1 else ""} ago'
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f'{hours} hour{"s" if hours != 1 else ""} ago'
        elif diff < timedelta(days=7):
            days = diff.days
            return f'{days} day{"s" if days != 1 else ""} ago'
        else:
            return obj.created_at.strftime('%b %d, %Y')
