"""Export serializers for documents."""

from rest_framework import serializers
from apps.documents.models import Document, Tag


class DocumentExportSerializer(serializers.ModelSerializer):
    """Serializer for document exports (CSV/Excel)."""
    
    department_name = serializers.SerializerMethodField()
    folder_name = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    document_type_display = serializers.SerializerMethodField()
    created_by = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M")
    updated_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M")
    is_ocr_processed = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'document_type', 'document_type_display', 
            'department_name', 'folder_name', 'reference_number', 
            'date', 'description', 'tags', 'created_by', 'created_at',
            'updated_at', 'is_ocr_processed'
        ]
    
    def get_department_name(self, obj):
        """Get department name."""
        return obj.department.name if obj.department else ''
    
    def get_folder_name(self, obj):
        """Get folder name."""
        return obj.folder.name if obj.folder else ''
    
    def get_tags(self, obj):
        """Get tags as comma-separated list."""
        return ', '.join([tag.name for tag in obj.tags.all()])
    
    def get_document_type_display(self, obj):
        """Get human-readable document type."""
        return obj.get_document_type_display()
    
    def get_created_by(self, obj):
        """Get the username of the document creator."""
        if obj.uploaded_by:
            return obj.uploaded_by.username
        return ''
    
    def get_is_ocr_processed(self, obj):
        """Get human-readable OCR status."""
        return 'Yes' if obj.is_ocr_processed else 'No'
