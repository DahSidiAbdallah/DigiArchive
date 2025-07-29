"""Search utilities for advanced document search."""

from django.db.models import Q
from apps.documents.models import Document, Tag


def advanced_search(query_params, user=None):
    """
    Perform advanced search on documents based on multiple parameters.
    
    Args:
        query_params: Dictionary of query parameters
        user: User object to filter documents by user if not admin
        
    Returns:
        QuerySet of Document objects matching the search criteria
    """
    # Start with all documents or user's documents
    if user and not user.is_staff:
        documents = Document.objects.filter(uploaded_by=user)
    else:
        documents = Document.objects.all()
    
    # Text search (across multiple fields)
    text_query = query_params.get('q', '')
    if text_query:
        documents = documents.filter(
            Q(title__icontains=text_query) |
            Q(reference_number__icontains=text_query) |
            Q(description__icontains=text_query) |
            Q(content_text__icontains=text_query)
        )
    
    # Document type filter
    doc_type = query_params.get('document_type', '')
    if doc_type:
        documents = documents.filter(document_type=doc_type)
    
    # Date range filter
    date_from = query_params.get('date_from', '')
    date_to = query_params.get('date_to', '')
    
    if date_from:
        documents = documents.filter(date__gte=date_from)
    if date_to:
        documents = documents.filter(date__lte=date_to)
    
    # OCR status filter
    ocr_status = query_params.get('is_ocr_processed', '')
    if ocr_status in ['true', 'false']:
        is_processed = ocr_status == 'true'
        documents = documents.filter(is_ocr_processed=is_processed)
    
    # Tag filtering
    tags = query_params.getlist('tags', [])
    if tags:
        documents = documents.filter(tags__id__in=tags).distinct()
    
    # Uploaded by filter (admin only)
    uploader_id = query_params.get('uploaded_by', '')
    if uploader_id and user and user.is_staff:
        documents = documents.filter(uploaded_by_id=uploader_id)
    
    # Ordering
    ordering = query_params.get('ordering', '-created_at')
    documents = documents.order_by(ordering)
    
    return documents


def search_suggestions(query, limit=10):
    """
    Get search suggestions based on partial query.
    
    Args:
        query: The partial search query
        limit: Maximum number of suggestions to return
    
    Returns:
        List of dictionaries with suggestion text and type
    """
    suggestions = []
    
    # Get document title suggestions
    title_suggestions = Document.objects.filter(
        title__icontains=query
    ).values_list('title', flat=True).distinct()[:limit]
    
    for title in title_suggestions:
        suggestions.append({
            'text': title,
            'type': 'document_title'
        })
    
    # Get tag suggestions
    tag_suggestions = Tag.objects.filter(
        name__icontains=query
    ).values_list('name', flat=True).distinct()[:limit]
    
    for tag in tag_suggestions:
        suggestions.append({
            'text': tag,
            'type': 'tag'
        })
    
    # Get reference number suggestions
    ref_suggestions = Document.objects.filter(
        reference_number__icontains=query
    ).values_list('reference_number', flat=True).distinct()[:limit]
    
    for ref in ref_suggestions:
        if ref:  # Only add non-empty references
            suggestions.append({
                'text': ref,
                'type': 'reference_number'
            })
    
    # Sort and limit overall suggestions
    return suggestions[:limit]
