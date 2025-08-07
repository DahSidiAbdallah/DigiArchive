"""Audit trail views for document activity logs."""

from rest_framework import serializers, views, permissions
from rest_framework.response import Response

from apps.documents.models import Document, AuditLog
from apps.documents.utils.audit_utils import get_object_audit_logs


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit log entries."""
    
    user = serializers.SerializerMethodField()
    content_type = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'action_type', 'content_type',
            'object_id', 'timestamp', 'description', 'changes'
        ]
    
    def get_user(self, obj):
        """Return user information."""
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'full_name': obj.user.get_full_name()
            }
        return None
    
    def get_content_type(self, obj):
        """Return content type information."""
        return {
            'id': obj.content_type.id,
            'model': obj.content_type.model,
            'app_label': obj.content_type.app_label
        }


class DocumentAuditLogView(views.APIView):
    """View to retrieve audit logs for a document."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        """Get audit logs for the specified document."""
        try:
            document = Document.objects.get(pk=pk)
            
            # Check if user has permission to view this document
            if not request.user.is_staff and document.uploaded_by != request.user:
                return Response(
                    {'detail': 'You do not have permission to view this document\'s history.'},
                    status=403
                )
            
            # Get audit logs for the document with optional limit
            limit_param = request.query_params.get('limit')
            limit = int(limit_param) if limit_param and limit_param.isdigit() else None
            logs = get_object_audit_logs(document, limit)
            serializer = AuditLogSerializer(logs, many=True)

            return Response(serializer.data)
            
        except Document.DoesNotExist:
            return Response(
                {'detail': 'Document not found.'},
                status=404
            )
