"""Document models."""

# Re-export models from the models package
from apps.documents.models.core import Document, Tag, DocumentType, DocumentOCR
from apps.documents.models.department import Department, Folder

__all__ = ['Document', 'Tag', 'DocumentType', 'DocumentOCR', 'Department', 'Folder']
    file = models.FileField(
        upload_to='documents/%Y/%m/',  # Default path, will be overridden in get_upload_path
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])]
    )
    description = models.TextField(blank=True)
    reference_number = models.CharField(max_length=100, blank=True)
    date = models.DateField(null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True, related_name='documents')
    
    # Metadata
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # OCR and AI fields
    content_text = models.TextField(blank=True, help_text='OCR extracted text')
    is_ocr_processed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def get_upload_path(self, filename):
        """Determine upload path based on department and folder."""
        base_path = 'documents'
        if self.department:
            base_path = f'{base_path}/{self.department.code}'
            if self.folder:
                base_path = f'{base_path}/{self.folder.name}'
        return f'{base_path}/{filename}'
    
    def save(self, *args, **kwargs):
        """Custom save method to set department from user if not provided."""
        if not self.department and self.uploaded_by:
            # Get the user's department string
            user_dept = getattr(self.uploaded_by, 'department', '')
            if user_dept:
                # Try to find a department with the user's department name
                try:
                    dept = Department.objects.get(name=user_dept)
                    self.department = dept
                except Department.DoesNotExist:
                    # Create department if it doesn't exist
                    dept = Department.objects.create(
                        name=user_dept,
                        code=user_dept.replace(' ', '_').lower()[:20]
                    )
                    self.department = dept
        
        super().save(*args, **kwargs)


class DocumentOCR(models.Model):
    """OCR data for a document."""
    
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='ocr_data')
    full_text = models.TextField(blank=True)
    processed_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"OCR for {self.document.title}"


@receiver(post_save, sender=Document)
def create_document_ocr(sender, instance, created, **kwargs):
    """Create OCR object when a document is created."""
    if created:
        DocumentOCR.objects.create(document=instance)


@receiver(post_save, sender=Document)
def process_document_with_ocr(sender, instance, created, **kwargs):
    """Queue automatic OCR processing when a document is created."""
    # Only trigger OCR processing on new document creation and if not already processed
    if created and not instance.is_ocr_processed:
        # Use dynamic import to avoid circular imports
        try:
            from config.celery import app
            # Queue the OCR processing task
            app.send_task('process_document_ocr', args=[instance.id])
        except Exception as e:
            print(f"Error queuing OCR task: {str(e)}")
