"""Document serializers."""

from rest_framework import serializers
from apps.documents.models import Document, Tag, DocumentOCR
from apps.documents.serializers.department_serializers import DepartmentSerializer, FolderSerializer


class TagSerializer(serializers.ModelSerializer):
    """Tag serializer."""
    
    class Meta:
        model = Tag
        fields = ['id', 'name']
        read_only_fields = ['id']


class DocumentOCRSerializer(serializers.ModelSerializer):
    """Document OCR serializer."""
    
    class Meta:
        model = DocumentOCR
        fields = ['id', 'full_text', 'processed_at']
        read_only_fields = ['id', 'processed_at']


class DocumentSerializer(serializers.ModelSerializer):
    """Document serializer."""
    
    tags = TagSerializer(many=True, read_only=True)
    ocr_data = DocumentOCRSerializer(read_only=True)
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    department_details = DepartmentSerializer(source='department', read_only=True)
    folder_details = FolderSerializer(source='folder', read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), 
        write_only=True, 
        many=True, 
        required=False
    )
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'document_type', 'file', 'description', 
            'reference_number', 'date', 'department', 'department_details',
            'folder', 'folder_details', 'tags', 'tag_ids', 'uploaded_by', 
            'uploaded_by_username', 'created_at', 'updated_at', 'content_text', 
            'is_ocr_processed', 'ocr_data'
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'updated_at', 'content_text', 'is_ocr_processed']
    
    def create(self, validated_data):
        """Create a document with tags."""
        tag_ids = validated_data.pop('tag_ids', [])
        
        # Set the uploaded_by field to the current user
        validated_data['uploaded_by'] = self.context['request'].user
        
        document = Document.objects.create(**validated_data)
        
        # Add tags
        if tag_ids:
            document.tags.set(tag_ids)
        
        return document
    
    def update(self, instance, validated_data):
        """Update a document with tags."""
        tag_ids = validated_data.pop('tag_ids', None)
        
        # Update document fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update tags if provided
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        
        return instance


class DocumentListSerializer(serializers.ModelSerializer):
    """Simplified document serializer for list views."""
    
    tags = TagSerializer(many=True, read_only=True)
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'document_type', 'reference_number', 
            'date', 'tags', 'uploaded_by_username', 'created_at', 
            'is_ocr_processed'
        ]
        read_only_fields = fields
