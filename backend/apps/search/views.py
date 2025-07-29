"""Search views for advanced document search."""

from rest_framework import views, status, permissions
from rest_framework.response import Response
from apps.documents.serializers.document_serializers import DocumentListSerializer
from apps.search.utils import advanced_search, search_suggestions


class AdvancedSearchView(views.APIView):
    """
    API endpoint for advanced document search.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Perform advanced search on documents."""
        # Get documents matching search criteria
        documents = advanced_search(request.query_params, request.user)
        
        # Paginate results
        page = self.paginate_queryset(documents)
        if page is not None:
            serializer = DocumentListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        # If no pagination, return all results
        serializer = DocumentListSerializer(documents, many=True)
        return Response(serializer.data)
    
    @property
    def paginator(self):
        """Get or create a paginator."""
        if not hasattr(self, '_paginator'):
            from rest_framework.pagination import PageNumberPagination
            self._paginator = PageNumberPagination()
        return self._paginator
    
    def paginate_queryset(self, queryset):
        """Paginate a queryset."""
        return self.paginator.paginate_queryset(queryset, self.request, view=self)
    
    def get_paginated_response(self, data):
        """Return a paginated response."""
        return self.paginator.get_paginated_response(data)


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
