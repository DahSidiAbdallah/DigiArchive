"""Search views for advanced document search."""

from rest_framework import views, status, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.conf import settings
from apps.documents.serializers.document_serializers import DocumentListSerializer, DocumentSerializer
from apps.search.utils import advanced_search, search_suggestions
from apps.search.elasticsearch_utils import elasticsearch_search


class DocumentSearchPagination(PageNumberPagination):
    """Custom pagination for document search results."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdvancedSearchView(views.APIView):
    """
    API endpoint for advanced document search.
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = DocumentSearchPagination
    
    def get(self, request):
        """Perform advanced search on documents."""
        # Check if we should use Elasticsearch
        use_elasticsearch = request.query_params.get('use_elasticsearch', '').lower() == 'true'
        use_es = hasattr(settings, 'ELASTICSEARCH_DSL') and use_elasticsearch
        
        # Try Elasticsearch first if requested
        if use_es:
            try:
                documents = elasticsearch_search(request.query_params, request.user)
            except Exception as e:
                # If Elasticsearch fails, fall back to regular search
                print(f"Elasticsearch error: {str(e)}")
                documents = advanced_search(request.query_params, request.user)
        else:
            # Use regular search
            documents = advanced_search(request.query_params, request.user)
        
        # Check if we need to include related details
        include_related = request.query_params.get('include_related_details', '').lower() == 'true'
        serializer_class = DocumentSerializer if include_related else DocumentListSerializer
        
        # Paginate results
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(documents, request, view=self)
        
        if page is not None:
            serializer = serializer_class(page, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        # If no pagination, return all results
        serializer = serializer_class(documents, many=True, context={'request': request})
        return Response(serializer.data)


class SearchSuggestionsView(views.APIView):
    """
    API endpoint for search suggestions.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get search suggestions based on a partial query."""
        query = request.query_params.get('q', '')
        
        if not query or len(query) < 2:
            return Response([])
        
        limit = int(request.query_params.get('limit', 10))
        suggestions = search_suggestions(query, limit=limit)
        
        return Response(suggestions)
