"""Core document models."""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator

from .department import Department, Folder

User = get_user_model()


class DocumentType(models.TextChoices):
    """Document type choices."""
    
    INVOICE = 'invoice', 'Invoice (Facture)'
    BILL_OF_LADING = 'bill_of_lading', 'Bill of Lading (BL)'
    TRANSFER_REQUEST = 'transfer_request', 'Transfer Request (Demande de transfert)'
    CONTRACT = 'contract', 'Contract (Contrat)'
    CERTIFICATE = 'certificate', 'Certificate (Certificat)'
    REPORT = 'report', 'Report (Rapport)'
    OTHER = 'other', 'Other (Autre)'


class Tag(models.Model):
    """Tags for documents."""
    
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['name']


class Document(models.Model):
    """Document model for MAFCI DigiArchive."""
    
    title = models.CharField(max_length=255)
    document_type = models.CharField(
        max_length=50,
        choices=DocumentType.choices,
        default=DocumentType.OTHER
    )
    department = models.ForeignKey(
        Department, 
        on_delete=models.CASCADE, 
        related_name='documents',
        null=True,
        blank=True
    )
    folder = models.ForeignKey(
        Folder, 
        on_delete=models.SET_NULL, 
        related_name='documents',
        null=True,
        blank=True
    )
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
                # Try to find a department by code or name
                try:
                    department = Department.objects.get(code=user_dept)
                    self.department = department
                except Department.DoesNotExist:
                    try:
                        department = Department.objects.get(name__icontains=user_dept)
                        self.department = department
                    except (Department.DoesNotExist, Department.MultipleObjectsReturned):
                        # Could not find a unique department match, proceed without setting it
                        pass
        
        # Now call the original save method
        super().save(*args, **kwargs)


class DocumentOCR(models.Model):
    """OCR data for documents."""
    
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='ocr_data')
    full_text = models.TextField(blank=True, help_text='Full OCR extracted text')
    processed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"OCR for {self.document.title}"
