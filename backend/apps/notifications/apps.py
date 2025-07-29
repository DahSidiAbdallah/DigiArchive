"""Notification app config."""

from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    """Notification app configuration."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"
    verbose_name = "Notifications"

    def ready(self):
        """Import signals when app is ready."""
        import apps.notifications.signals  # noqa
