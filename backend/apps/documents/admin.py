"""Admin configuration for documents app."""

from django.contrib import admin
from apps.documents.models import Document, Tag, DocumentOCR
from apps.documents.admin import *  # Import department admin classes


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """Admin configuration for Tag model."""
    
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(DocumentOCR)
class DocumentOCRAdmin(admin.ModelAdmin):
    """Admin configuration for DocumentOCR model."""
    
    list_display = ('document', 'processed_at')
    search_fields = ('document__title', 'full_text')
    readonly_fields = ('processed_at',)


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """Admin configuration for Document model."""
    
    list_display = ('title', 'document_type', 'department', 'folder', 'reference_number', 'uploaded_by', 'created_at', 'is_ocr_processed')
    list_filter = ('document_type', 'department', 'is_ocr_processed', 'created_at', 'updated_at')
    search_fields = ('title', 'reference_number', 'description', 'content_text')
    search_fields = ('title', 'reference_number', 'description', 'content_text')
    readonly_fields = ('created_at', 'updated_at', 'content_text', 'is_ocr_processed')
    date_hierarchy = 'created_at'
    filter_horizontal = ('tags',)
    fieldsets = (
        (None, {
            'fields': ('title', 'document_type', 'file', 'description', 'reference_number', 'date')
        }),
        ('Classification', {
            'fields': ('tags',)
        }),
        ('Metadata', {
            'fields': ('uploaded_by', 'created_at', 'updated_at')
        }),
        ('OCR', {
            'fields': ('is_ocr_processed', 'content_text')
        }),
    )
