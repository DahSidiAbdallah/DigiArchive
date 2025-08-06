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
    department_name = serializers.SerializerMethodField(read_only=True)
    folder_name = serializers.SerializerMethodField(read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), 
        write_only=True, 
        many=True, 
        required=False
    )
    
    def get_department_name(self, obj):
        """Get the department name."""
        return obj.department.name if obj.department else None
        
    def get_folder_name(self, obj):
        """Get the folder name."""
        return obj.folder.name if obj.folder else None
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'document_type', 'file', 'description', 
            'reference_number', 'date', 'department', 'department_details',
            'department_name', 'folder', 'folder_details', 'folder_name',
            'tags', 'tag_ids', 'uploaded_by', 'uploaded_by_username', 
            'created_at', 'updated_at', 'content_text', 'is_ocr_processed', 'ocr_data'
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'updated_at', 'content_text', 'is_ocr_processed']
    
    def to_internal_value(self, data):
        """Normalize tag_ids input to a list of integers."""
        tag_ids = data.get('tag_ids')

        if tag_ids is not None:
            # Ensure tag_ids is always a list for consistent processing
            if not isinstance(tag_ids, list):
                tag_ids = [tag_ids]

            cleaned_ids = []
            for tag_id in tag_ids:
                # Split comma separated strings (e.g. "1,2")
                if isinstance(tag_id, str) and ',' in tag_id:
                    parts = tag_id.split(',')
                else:
                    parts = [tag_id]

                for part in parts:
                    if isinstance(part, str):
                        part = part.strip()
                        if not part:
                            # Skip empty strings which DRF can't convert
                            continue
                        if part.isdigit():
                            cleaned_ids.append(int(part))
                        # Ignore any non-numeric strings silently
                    elif isinstance(part, int):
                        cleaned_ids.append(part)

            # Replace with cleaned list (may be empty to clear tags)
            data['tag_ids'] = cleaned_ids

        return super().to_internal_value(data)
    
    def create(self, validated_data):
        """Create a document with tags."""
        tag_ids = validated_data.pop('tag_ids', [])
        
        # Set the uploaded_by field to the current user
        validated_data['uploaded_by'] = self.context['request'].user
        
        # Check for folder-department consistency
        folder = validated_data.get('folder')
        department = validated_data.get('department')
        
        if folder and department:
            # If both are provided, ensure folder belongs to department
            if folder.department.pk != department.pk:
                # Folder doesn't match department, raise error
                raise serializers.ValidationError({
                    'folder': f"Folder '{folder.name}' does not belong to department '{department.name}'"
                })
        elif folder and not department:
            # If only folder is provided, set department from folder
            validated_data['department'] = folder.department
        
        document = Document.objects.create(**validated_data)
        
        # Add tags
        if tag_ids:
            document.tags.set(tag_ids)
        
        return document
    
    def update(self, instance, validated_data):
        """Update a document with tags."""
        tag_ids = validated_data.pop('tag_ids', None)
        
        # Check for folder-department consistency
        folder = validated_data.get('folder')
        department = validated_data.get('department')
        
        if folder and department:
            # If both are provided, ensure folder belongs to department
            if folder.department.pk != department.pk:
                # Folder doesn't match department, raise error
                raise serializers.ValidationError({
                    'folder': f"Folder '{folder.name}' does not belong to department '{department.name}'"
                })
        elif folder and not department:
            # If only folder is provided, set department from folder
            validated_data['department'] = folder.department
        
        # Update document fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update tags if provided
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        
        # Refresh the instance to make sure we have the latest data
        # This is important to ensure we return the full object with related objects
        instance = Document.objects.select_related('department', 'folder').get(pk=instance.pk)
        
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
