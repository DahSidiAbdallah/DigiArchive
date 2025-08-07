"""Middleware for tracking document views and other audit activities."""

import re
from django.urls import resolve
from django.utils.deprecation import MiddlewareMixin
from apps.documents.models import Document
from apps.documents.utils.audit_utils import log_user_activity


class DocumentViewTrackingMiddleware(MiddlewareMixin):
    """Middleware for tracking document views."""
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """Process the view to check if it's a document detail view."""
        if not request.user.is_authenticated:
            return None
            
        # Check if this is a document detail view
        try:
            resolved_path = resolve(request.path)
            if resolved_path.url_name == 'document-detail':
                document_id = view_kwargs.get('pk')
                if document_id:
                    try:
                        document = Document.objects.get(id=document_id)
                        # Log the document view
                        log_user_activity(
                            user=request.user,
                            action_type='view',
                            content_object=document,
                            description=f"Viewed document: {document.title}",
                            request=request
                        )
                    except Document.DoesNotExist:
                        pass
            
            # Track document downloads
            if resolved_path.url_name == 'document-download':
                document_id = view_kwargs.get('pk')
                if document_id:
                    try:
                        document = Document.objects.get(id=document_id)
                        # Log the document download
                        log_user_activity(
                            user=request.user,
                            action_type='download',
                            content_object=document,
                            description=f"Downloaded document: {document.title}",
                            request=request
                        )
                    except Document.DoesNotExist:
                        pass
        except Exception:
            # If any error occurs, just continue without logging
            pass
            
        return None
