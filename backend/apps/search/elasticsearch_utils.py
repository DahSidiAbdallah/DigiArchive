"""Elasticsearch search utilities."""

from elasticsearch_dsl import Q
from apps.search.documents import DocumentDocument


def elasticsearch_search(query_params, user=None, use_elasticsearch=True):
    """
    Perform advanced search on documents using Elasticsearch.
    
    Args:
        query_params: Dictionary of query parameters
        user: User object to filter documents by user if not admin
        use_elasticsearch: Whether to use Elasticsearch (default: True)
        
    Returns:
        QuerySet of Document objects matching the search criteria
    """
    # Check if Elasticsearch is available
    if not use_elasticsearch:
        from apps.search.utils import advanced_search
        return advanced_search(query_params, user)
    
    # Start with an empty search
    search = DocumentDocument.search()
    
    # Filter by user if not admin
    if user and not user.is_staff:
        search = search.filter('term', uploaded_by__id=user.id)
    
    # Text search (across multiple fields)
    text_query = query_params.get('q', '')
    if text_query:
        # Multi-field search with boosting
        search = search.query(
            Q('multi_match', 
                query=text_query,
                fields=['title^3', 'content_text^2', 'reference_number^2', 
                        'description', 'document_type', 'tags.name'],
                fuzziness="AUTO"
            )
        )
    
    # Department filter
    department_id = query_params.get('department_id', '')
    if department_id:
        try:
            dept_id = int(department_id)
            search = search.filter('term', department__id=dept_id)
        except (ValueError, TypeError):
            pass
    
    # Folder filter
    folder_id = query_params.get('folder_id', '')
    if folder_id:
        try:
            fld_id = int(folder_id)
            search = search.filter('term', folder__id=fld_id)
        except (ValueError, TypeError):
            pass
    
    # Content-specific search
    content_query = query_params.get('content_query', '')
    if content_query:
        search = search.query('match', content_text=content_query)
    
    # Document type filter
    doc_type = query_params.get('document_type', '')
    if doc_type:
        search = search.filter('term', document_type=doc_type)
    
    # Date range filter
    date_from = query_params.get('date_from', '')
    date_to = query_params.get('date_to', '')
    
    if date_from or date_to:
        date_params = {}
        if date_from:
            date_params['gte'] = date_from
        if date_to:
            date_params['lte'] = date_to
        
        search = search.filter('range', date=date_params)
    
    # OCR status filter
    ocr_status = query_params.get('is_ocr_processed', '')
    if ocr_status in ['true', 'false']:
        is_processed = ocr_status == 'true'
        search = search.filter('term', is_ocr_processed=is_processed)
    
    # Tag filtering
    tags = query_params.getlist('tags', [])
    if tags:
        for tag_id in tags:
            search = search.filter('nested', path='tags', query=Q('term', tags__id=tag_id))
    
    # Uploaded by filter (admin only)
    uploader_id = query_params.get('uploaded_by', '')
    if uploader_id and user and user.is_staff:
        search = search.filter('term', uploaded_by__id=uploader_id)
    
    # Ordering
    ordering = query_params.get('ordering', '-created_at')
    if ordering.startswith('-'):
        search = search.sort({ordering[1:]: {"order": "desc"}})
    else:
        search = search.sort({ordering: {"order": "asc"}})
    
    # Execute search
    search_results = search.execute()
    
    # Get Django models from Elasticsearch results
    from django.db.models import prefetch_related_objects
    doc_ids = [hit.meta.id for hit in search_results]
    
    # Convert back to Django QuerySet for consistency with the API
    from apps.documents.models import Document
    queryset = Document.objects.filter(id__in=doc_ids)
    
    # Ensure same ordering as search results
    from django.db.models import Case, When
    preserved_order = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(doc_ids)])
    queryset = queryset.order_by(preserved_order)
    
    # Prefetch related objects
    queryset = queryset.select_related('department', 'folder', 'uploaded_by')
    queryset = queryset.prefetch_related('tags')
    
    return queryset
