"""Audit utilities for logging user actions."""

import json
from django.contrib.contenttypes.models import ContentType
from apps.documents.models import AuditLog


def log_user_activity(user, action_type, content_object, description='', changes=None, request=None):
    """
    Log a user activity for audit purposes.
    
    Args:
        user: The user performing the action
        action_type: Type of action (create, update, etc.)
        content_object: The object being acted upon
        description: Description of the action
        changes: JSON-serializable dict of changes made
        request: The request object, used to get IP and user agent
    
    Returns:
        AuditLog: The created audit log entry
    """
    if not user or not action_type or not content_object:
        return None
    
    # Get content type for the object
    content_type = ContentType.objects.get_for_model(content_object)
    
    # Extract request metadata if available
    ip_address = None
    user_agent = ''
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    # Create the audit log entry
    audit_log = AuditLog.objects.create(
        user=user,
        action_type=action_type,
        content_type=content_type,
        object_id=content_object.id,
        description=description,
        changes=changes,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return audit_log


def get_object_audit_logs(content_object, limit=None):
    """
    Get audit logs for a specific object.
    
    Args:
        content_object: The object to get logs for
        limit: Optional limit on number of logs to return
    
    Returns:
        QuerySet of AuditLog objects
    """
    content_type = ContentType.objects.get_for_model(content_object)
    logs = AuditLog.objects.filter(
        content_type=content_type,
        object_id=content_object.id
    )
    
    if limit:
        logs = logs[:limit]
        
    return logs


def get_model_changes(old_instance, new_instance, tracked_fields=None):
    """
    Get changes made to a model instance.
    
    Args:
        old_instance: Previous state of the model
        new_instance: Current state of the model
        tracked_fields: List of fields to track changes for. If None, track all fields.
    
    Returns:
        dict: Dictionary with 'old' and 'new' values for changed fields
    """
    if not old_instance or not new_instance:
        return {}
    
    changes = {}
    
    # Get all field names from the model
    if not tracked_fields:
        tracked_fields = [field.name for field in old_instance._meta.fields 
                         if not field.name.endswith('_id')]
    
    # Compare field values
    for field in tracked_fields:
        try:
            old_value = getattr(old_instance, field)
            new_value = getattr(new_instance, field)
            
            # Handle datetime, date objects
            if hasattr(old_value, 'isoformat'):
                old_value = old_value.isoformat()
            if hasattr(new_value, 'isoformat'):
                new_value = new_value.isoformat()
                
            # Only track if values are different
            if old_value != new_value:
                changes[field] = {
                    'old': old_value,
                    'new': new_value
                }
        except Exception:
            # Skip any fields that can't be compared
            continue
    
    return changes
