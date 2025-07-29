"""Document URLs."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.documents.views.document_views import DocumentViewSet, TagViewSet

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'documents', DocumentViewSet)
router.register(r'tags', TagViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
