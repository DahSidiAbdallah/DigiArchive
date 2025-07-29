"""Department URLs."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.documents.views.department_views import DepartmentViewSet, FolderViewSet

# Create a router for department views
router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'folders', FolderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
