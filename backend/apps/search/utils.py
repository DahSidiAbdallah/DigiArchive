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
    # Always include department and folder for better frontend display
    if user and not user.is_staff:
        documents = Document.objects.select_related('department', 'folder').filter(uploaded_by=user)
    else:
        documents = Document.objects.select_related('department', 'folder').all()
    
    # Text search (across multiple fields)
    text_query = query_params.get('q', '')
    if text_query:
        # Include full OCR text in search via document's related ocr_data
        documents = documents.filter(
            Q(title__icontains=text_query) |
            Q(reference_number__icontains=text_query) |
            Q(description__icontains=text_query) |
            Q(content_text__icontains=text_query) |
            Q(ocr_data__full_text__icontains=text_query)
        )
    
    # Department filter
    department_id = query_params.get('department_id', '')
    if department_id:
        try:
            # Try to convert to integer and filter
            dept_id = int(department_id)
            documents = documents.filter(department_id=dept_id)
            print(f"Filtering by department ID: {dept_id}, remaining documents: {documents.count()}")
            # Print first few documents for debugging
            for doc in documents[:5]:
                print(f"Document in dept {dept_id}: {doc.pk} - {doc.title} - dept: {doc.department.pk if doc.department else None}")
        except (ValueError, TypeError):
            print(f"Invalid department ID: {department_id}")
    
    # Folder filter
    folder_id = query_params.get('folder_id', '')
    if folder_id:
        try:
            # Try to convert to integer and filter
            fld_id = int(folder_id)
            documents = documents.filter(folder_id=fld_id)
            print(f"Filtering by folder ID: {fld_id}, remaining documents: {documents.count()}")
            # Print first few documents for debugging
            for doc in documents[:5]:
                print(f"Document in folder {fld_id}: {doc.pk} - {doc.title} - folder: {doc.folder.pk if doc.folder else None}")
        except (ValueError, TypeError):
            print(f"Invalid folder ID: {folder_id}")
    
    # Content-specific search
    content_query = query_params.get('content_query', '')
    if content_query:
        documents = documents.filter(content_text__icontains=content_query)
    
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
