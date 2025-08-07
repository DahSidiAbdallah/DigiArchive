"""Signal handlers for document models to track changes and activities."""

from django.db.models.signals import pre_save, post_save, m2m_changed, post_delete
from django.dispatch import receiver
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION
from apps.documents.models import Document, Tag
from apps.documents.utils.audit_utils import log_user_activity, get_model_changes


@receiver(pre_save, sender=Document)
def track_document_changes(sender, instance, **kwargs):
    """Track changes to a document before saving."""
    if not instance.pk:
        # This is a new document, no previous state to compare
        return
        
    try:
        # Get the previous state of the document
        old_instance = Document.objects.get(pk=instance.pk)
        
        # Store old instance on the new instance for use in post_save
        instance._previous_instance = old_instance
    except Document.DoesNotExist:
        # Document doesn't exist yet, no previous state
        pass


@receiver(post_save, sender=Document)
def log_document_activity(sender, instance, created, **kwargs):
    """Log document creation or updates."""
    if not hasattr(instance, '_change_user'):
        # No user information available
        return
        
    user = instance._change_user
    request = getattr(instance, '_change_request', None)
    
    if created:
        # Log document creation
        log_user_activity(
            user=user,
            action_type='create',
            content_object=instance,
            description=f"Created document: {instance.title}",
            request=request
        )
    else:
        # Log document update if there were changes
        if hasattr(instance, '_previous_instance'):
            old_instance = instance._previous_instance
            changes = get_model_changes(
                old_instance, 
                instance,
                tracked_fields=[
                    'title', 'document_type', 'department', 'folder',
                    'description', 'reference_number', 'date',
                    'is_ocr_processed', 'content_text'
                ]
            )
            
            if changes:
                log_user_activity(
                    user=user,
                    action_type='update',
                    content_object=instance,
                    description=f"Updated document: {instance.title}",
                    changes=changes,
                    request=request
                )


@receiver(post_delete, sender=Document)
def log_document_deletion(sender, instance, **kwargs):
    """Log document deletion."""
    if not hasattr(instance, '_change_user'):
        # No user information available
        return
        
    user = instance._change_user
    request = getattr(instance, '_change_request', None)
    
    log_user_activity(
        user=user,
        action_type='delete',
        content_object=instance,
        description=f"Deleted document: {instance.title}",
        request=request
    )


@receiver(m2m_changed, sender=Document.tags.through)
def log_tag_changes(sender, instance, action, pk_set, **kwargs):
    """Log changes to document tags."""
    if not hasattr(instance, '_change_user') or not pk_set:
        # No user information or no tags changed
        return
        
    user = instance._change_user
    request = getattr(instance, '_change_request', None)
    
    if action == 'post_add':
        # Tags were added
        added_tags = Tag.objects.filter(pk__in=pk_set)
        tag_names = ', '.join([tag.name for tag in added_tags])
        
        log_user_activity(
            user=user,
            action_type='tag',
            content_object=instance,
            description=f"Added tags to {instance.title}: {tag_names}",
            changes={'added_tags': list(pk_set)},
            request=request
        )
    elif action == 'post_remove':
        # Tags were removed
        removed_tags = Tag.objects.filter(pk__in=pk_set)
        tag_names = ', '.join([tag.name for tag in removed_tags])
        
        log_user_activity(
            user=user,
            action_type='untag',
            content_object=instance,
            description=f"Removed tags from {instance.title}: {tag_names}",
            changes={'removed_tags': list(pk_set)},
            request=request
        )
