"""Notification URLs configuration."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.notifications.views.notification_views import NotificationViewSet

app_name = 'notifications'

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
