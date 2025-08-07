"""
Management command to rebuild the Elasticsearch index.
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from django_elasticsearch_dsl.registries import registry


class Command(BaseCommand):
    """Rebuild all Elasticsearch indices."""
    
    help = 'Rebuilds the Elasticsearch indices for all registered models'
    
    def add_arguments(self, parser):
        """Add command arguments."""
        parser.add_argument(
            '--models',
            nargs='+',
            type=str,
            help='The models to update (app.Model)'
        )
        
        parser.add_argument(
            '--recreate',
            action='store_true',
            help='Recreate the indices from scratch'
        )
    
    def handle(self, *args, **options):
        """Handle command execution."""
        # Check if Elasticsearch settings are configured
        if not hasattr(settings, 'ELASTICSEARCH_DSL'):
            self.stderr.write(self.style.ERROR('Elasticsearch settings not found in Django settings'))
            return
            
        self.stdout.write('Rebuilding Elasticsearch indices...')
        
        models = options.get('models')
        recreate = options.get('recreate')
        
        try:
            # If specific models are provided
            if models:
                for model_name in models:
                    app_label, model_name = model_name.split('.')
                    self.stdout.write(f'Rebuilding index for {app_label}.{model_name}')
                    registry.update(app_label, model_name)
                    self.stdout.write(self.style.SUCCESS(f'Successfully rebuilt index for {app_label}.{model_name}'))
            else:
                # Otherwise, rebuild all indices
                if recreate:
                    self.stdout.write('Recreating indices from scratch...')
                    registry.delete_all()
                    self.stdout.write('All indices deleted')
                
                self.stdout.write('Rebuilding indices...')
                registry.rebuild()
                self.stdout.write(self.style.SUCCESS('Successfully rebuilt all indices'))
        
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Error rebuilding indices: {str(e)}'))
