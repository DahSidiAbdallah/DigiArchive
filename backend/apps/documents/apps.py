"""Documents app configuration."""

from django.apps import AppConfig


class DocumentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.documents'
    verbose_name = 'Documents'
    
    def ready(self):
        """Register signal handlers when the app is ready."""
        # Import signals to register them
        import apps.documents.signals
