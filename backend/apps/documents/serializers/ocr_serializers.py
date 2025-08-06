"""Serializers for OCR data."""

from rest_framework import serializers
from apps.documents.models import DocumentOCR


class DocumentOCRSerializer(serializers.ModelSerializer):
    """Serializer for OCR data."""
    
    class Meta:
        model = DocumentOCR
        fields = ['full_text', 'processed_at']
        read_only_fields = ['full_text', 'processed_at']
