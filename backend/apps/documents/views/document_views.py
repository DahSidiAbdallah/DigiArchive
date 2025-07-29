"""Document views."""

from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.documents.models import Document, Tag
from apps.documents.serializers.document_serializers import (
    DocumentSerializer, DocumentListSerializer, TagSerializer
)


class TagViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tags.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class DocumentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for documents.
    """
    queryset = Document.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['document_type', 'is_ocr_processed', 'date', 'uploaded_by']
    search_fields = ['title', 'reference_number', 'content_text', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action == 'list':
            return DocumentListSerializer
        return DocumentSerializer
    
    def get_queryset(self):
        """Filter queryset based on user."""
        # Non-admin users can only see their own documents
        if not self.request.user.is_staff:
            return Document.objects.filter(uploaded_by=self.request.user)
        return Document.objects.all()
    
    def perform_create(self, serializer):
        """Save the uploaded_by field when creating a document."""
        serializer.save(uploaded_by=self.request.user)
        # OCR processing is handled by the post_save signal automatically
    
    @action(detail=True, methods=['post'])
    def process_ocr(self, request, pk=None):
        """
        Manually trigger OCR processing for a document.
        """
        document = self.get_object()
        
        # Don't process if already processed
        if document.is_ocr_processed:
            return Response(
                {"message": "Document has already been processed with OCR."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Trigger OCR processing
        from config.celery import app
        app.send_task('process_document_ocr', args=[document.id])
        
        return Response(
            {"message": "OCR processing has been initiated."},
            status=status.HTTP_202_ACCEPTED
        )
