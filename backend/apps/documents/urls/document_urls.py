"""Document URLs."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.documents.views.document_views import DocumentViewSet, TagViewSet
from apps.documents.views.audit_views import DocumentAuditLogView

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'documents', DocumentViewSet)
router.register(r'tags', TagViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('documents/<int:pk>/audit-logs/', DocumentAuditLogView.as_view(), name='document-audit-logs'),
]
