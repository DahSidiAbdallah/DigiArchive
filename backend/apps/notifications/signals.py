"""Signal handlers for notification creation."""

from django.db.models.signals import post_save
from django.dispatch import receiver

# Import directly from the module file to avoid circular imports
from apps.documents.models import Document
from apps.notifications.models import Notification


@receiver(post_save, sender=Document)
def create_document_notifications(sender, instance, created, **kwargs):
    """Create notifications when documents are created or updated."""
    if created:
        # Notify the uploader
        Notification.objects.create(
            user=instance.uploaded_by,
            notification_type='document_upload',
            title='Document Uploaded',
            message=f'Your document "{instance.title}" has been uploaded successfully.',
            document=instance
        )
        
        # Notify admins (you'd need to implement a way to identify admins)
        # This is a placeholder for that logic
        # admin_users = User.objects.filter(is_staff=True)
        # for admin in admin_users:
        #     Notification.objects.create(
        #         user=admin,
        #         notification_type='document_upload',
        #         title='New Document Uploaded',
        #         message=f'A new document "{instance.title}" was uploaded by {instance.uploaded_by}.',
        #         document=instance
        #     )
    
    else:
        # Document was updated
        if instance.ocr_processed and instance.tracker.has_changed('ocr_processed'):
            # OCR processing completed
            Notification.objects.create(
                user=instance.uploaded_by,
                notification_type='ocr_complete',
                title='OCR Processing Complete',
                message=f'OCR processing for "{instance.title}" has been completed.',
                document=instance
            )


# You can add more signal handlers for other notification types
# For example:
# @receiver(post_save, sender=Comment)
# def create_comment_notification(sender, instance, created, **kwargs):
#     """Create notification when a comment is added to a document."""
#     if created:
#         document = instance.document
#         # Notify document owner
#         if instance.user != document.uploaded_by:
#             Notification.objects.create(
#                 user=document.uploaded_by,
#                 notification_type='comment',
#                 title='New Comment',
#                 message=f'{instance.user.username} commented on your document "{document.title}".',
#                 document=document
#             )
