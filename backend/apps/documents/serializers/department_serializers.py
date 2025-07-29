"""Department serializers."""

from rest_framework import serializers
from apps.documents.models.department import Department, Folder


class FolderSerializer(serializers.ModelSerializer):
    """Serializer for Folder model."""
    
    path = serializers.SerializerMethodField()
    
    class Meta:
        model = Folder
        fields = ['id', 'name', 'department', 'parent', 'description', 'path', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_path(self, obj):
        """Get the full path of the folder."""
        return obj.get_full_path()


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model."""
    
    folders = FolderSerializer(many=True, read_only=True)
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description', 'parent', 'folders', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
