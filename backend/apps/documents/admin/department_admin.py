"""Admin interfaces for department models."""

from django.contrib import admin
from apps.documents.models.department import Department, Folder


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Admin interface for Department model."""
    
    list_display = ('name', 'code', 'parent', 'created_at')
    search_fields = ('name', 'code', 'description')
    list_filter = ('created_at',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    """Admin interface for Folder model."""
    
    list_display = ('name', 'department', 'parent', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('department', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
