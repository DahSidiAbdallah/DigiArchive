"""Elasticsearch documents for the search app."""

from django_elasticsearch_dsl import Document, fields
from django_elasticsearch_dsl.registries import registry

from apps.documents.models import Document as DocumentModel, Tag


@registry.register_document
class DocumentDocument(Document):
    """Elasticsearch document for the Document model."""
    
    # Nested fields
    department = fields.ObjectField(properties={
        'id': fields.IntegerField(),
        'name': fields.TextField(),
        'code': fields.TextField(),
    })
    
    folder = fields.ObjectField(properties={
        'id': fields.IntegerField(),
        'name': fields.TextField(),
    })
    
    tags = fields.NestedField(properties={
        'id': fields.IntegerField(),
        'name': fields.TextField(),
    })
    
    uploaded_by = fields.ObjectField(properties={
        'id': fields.IntegerField(),
        'username': fields.TextField(),
        'email': fields.TextField(),
    })
    
    # Date fields with specific formats for better search
    created_at = fields.DateField()
    updated_at = fields.DateField()
    date = fields.DateField()
    
    # Text fields with specific analyzers
    content_text = fields.TextField(
        analyzer='standard',
        fields={
            'raw': fields.KeywordField(),
            'suggest': fields.CompletionField(),
        }
    )
    
    class Index:
        """Meta class for Elasticsearch index."""
        
        name = 'documents'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0,
            'analysis': {
                'analyzer': {
                    'html_strip': {
                        'tokenizer': 'standard',
                        'filter': ['lowercase', 'stop', 'snowball'],
                        'char_filter': ['html_strip']
                    }
                }
            }
        }
    
    class Django:
        """Meta class for Django model."""
        
        model = DocumentModel
        # Select related objects to prevent N+1 queries
        queryset_pagination = 1000
        related_models = [Tag]
        
        # Define fields to include in the Elasticsearch document
        fields = [
            'id',
            'title',
            'document_type',
            'description',
            'reference_number',
            'is_ocr_processed',
        ]
    
    def get_instances_from_related(self, related_instance):
        """Get instances from related models."""
        if isinstance(related_instance, Tag):
            return related_instance.documents.all()
        return None
