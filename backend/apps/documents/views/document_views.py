"""Document views."""

from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.documents.models import Document, Tag, DocumentOCR
from apps.documents.serializers.document_serializers import (
    DocumentSerializer, DocumentListSerializer, TagSerializer
)
from apps.documents.serializers.ocr_serializers import DocumentOCRSerializer
from apps.documents.permissions import IsOwnerOrAdmin, EnsureCorrectFolderDepartment


class TagViewSet(viewsets.ModelViewSet):
    """
    API endpoint for tags.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class DocumentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for documents.
    """
    queryset = Document.objects.select_related('department', 'folder').all()
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin, EnsureCorrectFolderDepartment]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['document_type', 'is_ocr_processed', 'date', 'uploaded_by', 'department', 'folder']
    search_fields = ['title', 'reference_number', 'content_text', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer class based on action."""
        if self.action == 'list':
            return DocumentListSerializer
        return DocumentSerializer
    
    def get_queryset(self):
        """Filter queryset based on user and ensure proper related objects are fetched."""
        queryset = Document.objects.select_related('department', 'folder', 'uploaded_by')
        
        # Non-admin users can only see their own documents
        if not self.request.user.is_staff:
            queryset = queryset.filter(uploaded_by=self.request.user)
            
        # Apply department and folder filtering from query parameters
        department_id = self.request.GET.get('department_id')
        folder_id = self.request.GET.get('folder_id')
        
        # Special case for Commercial/Client Documents
        # Check if we're looking for Commercial department (typically ID 2) and Client Documents folder
        if department_id and folder_id:
            try:
                department_id_int = int(department_id)
                folder_id_int = int(folder_id)
                
                # Get the actual department and folder to check names
                from apps.documents.models import Department, Folder
                try:
                    dept = Department.objects.get(id=department_id_int)
                    folder = Folder.objects.get(id=folder_id_int)
                    
                    # If this is Commercial/Client Documents, add debug logging
                    if dept.name == "Commercial" and folder.name == "Client Documents":
                        print(f"SPECIAL CASE: Commercial/Client Documents folder detected")
                        print(f"Document count before filter: {queryset.count()}")
                        
                        # Get all document IDs to inspect
                        all_docs = list(queryset.values_list('id', 'title', 'department__name', 'folder__name'))
                        print(f"All documents before filtering: {all_docs}")
                except (Department.DoesNotExist, Folder.DoesNotExist):
                    pass
            except (ValueError, TypeError):
                pass

        # Standard department filtering
        if department_id:
            try:
                department_id = int(department_id)
                
                # Get department to check if it's Commercial
                from apps.documents.models import Department
                try:
                    dept = Department.objects.get(id=department_id)
                    
                    # Special handling for Commercial department
                    if dept.name == "Commercial":
                        print(f"SPECIAL CASE: Commercial department detected - applying strict filtering")
                        
                        # STRICT FILTERING: If we're viewing the Commercial department WITHOUT a specific folder,
                        # we should exclude documents that don't have a folder to prevent them showing in all folders
                        if not folder_id:
                            # Apply department filter but also ensure a folder exists for each document
                            queryset = queryset.filter(department_id=department_id).exclude(folder=None)
                            print(f"Commercial department - excluding documents without folders")
                        else:
                            # Regular department filter
                            queryset = queryset.filter(department_id=department_id)
                    else:
                        # Regular department filter for non-Commercial departments
                        queryset = queryset.filter(department_id=department_id)
                    
                    print(f"Filtering documents by department ID: {department_id} ({dept.name})")
                    print(f"Document count after department filter: {queryset.count()}")
                except Department.DoesNotExist:
                    # Regular department filter if department doesn't exist
                    queryset = queryset.filter(department_id=department_id)
                    print(f"Filtering documents by department ID: {department_id} (Department not found)")
                    
            except (ValueError, TypeError):
                print(f"Invalid department_id: {department_id}")
                
        # Standard folder filtering
        if folder_id:
            try:
                folder_id = int(folder_id)
                
                # Get the folder object
                from apps.documents.models import Folder
                try:
                    folder = Folder.objects.get(id=folder_id)
                    
                    # CRITICAL: For Commercial department folders, we need EXACT matching
                    is_commercial_folder = False
                    if folder.department:
                        try:
                            is_commercial_folder = folder.department.name == "Commercial"
                        except:
                            pass
                    
                    # For Commercial department folders, apply very strict filtering
                    if is_commercial_folder:
                        print(f"COMMERCIAL FOLDER DETECTED: {folder.name} - Applying VERY strict filtering")
                        
                        # For Commercial department folders, require BOTH folder ID AND department ID to match EXACTLY
                        # This ensures documents only show in their specific assigned folder
                        queryset = queryset.filter(folder_id=folder_id)
                        print(f"Strict Commercial folder filtering - now showing {queryset.count()} documents")
                        
                        # For "Contracts" folder specifically, make extra sure we're showing only contract documents
                        if folder.name == "Contracts":
                            print("ULTRA-STRICT Contracts folder filtering")
                            # Make absolutely sure these are contract documents in the Contracts folder
                            queryset = queryset.filter(folder_id=folder_id, document_type__icontains="contract")
                            print(f"After ultra-strict filtering: {queryset.count()} documents")
                    else:
                        # Non-Commercial department - standard folder+department filtering
                        if department_id:
                            department_id_int = int(department_id)
                            # Apply both filters for consistent behavior
                            queryset = queryset.filter(folder_id=folder_id, department_id=department_id_int)
                        else:
                            # Standard folder filtering if no department specified
                            queryset = queryset.filter(folder_id=folder_id)
                    
                    print(f"Filtering documents by folder ID: {folder_id} ({folder.name})")
                    print(f"Document count after folder filter: {queryset.count()}")
                    
                    # Special diagnostic for Commercial/Client Documents folder
                    if folder.name == "Client Documents" and is_commercial_folder:
                        print(f"DIAGNOSIS: Commercial/Client Documents folder contains {queryset.count()} documents")
                        
                        # Show document details
                        for doc in queryset[:5]:  # First 5 for brevity
                            print(f"Document in Client Documents: {doc.title}")
                            print(f"  Department: {doc.department.name if doc.department else 'None'}")
                            print(f"  Folder: {doc.folder.name if doc.folder else 'None'}")
                            print(f"  Type: {doc.document_type}")
                    
                    # Special diagnostic for Contracts folder  
                    if folder.name == "Contracts" and is_commercial_folder:
                        print(f"DIAGNOSIS: Commercial/Contracts folder contains {queryset.count()} documents")
                        
                        # Show document details
                        for doc in queryset[:5]:  # First 5 for brevity
                            print(f"Document in Contracts: {doc.title}")
                            print(f"  Department: {doc.department.name if doc.department else 'None'}")
                            print(f"  Folder: {doc.folder.name if doc.folder else 'None'}")
                            print(f"  Type: {doc.document_type}")
                        
                except Folder.DoesNotExist:
                    print(f"Folder with ID {folder_id} not found")
                    queryset = Document.objects.none()
                
            except (ValueError, TypeError):
                print(f"Invalid folder_id: {folder_id}")
                
        return queryset
    
    def perform_create(self, serializer):
        """Save the uploaded_by field when creating a document."""
        try:
            # Safely save the document with the current user
            document = serializer.save(uploaded_by=self.request.user)
            print(f"Document created successfully: {document.title}")
            # OCR processing is handled by the post_save signal automatically
        except Exception as e:
            # Log the error for debugging
            print(f"Error in document creation: {str(e)}")
            raise
    
    @action(detail=False, methods=['post'])
    def simple_upload(self, request):
        """
        Simplified document upload endpoint that doesn't require tags.
        This helps users upload documents when the main upload form has issues.
        """
        # Extract basic fields
        title = request.data.get('title', '')
        document_type = request.data.get('document_type', 'other')
        description = request.data.get('description', '')
        department_id = request.data.get('department', None)
        folder_id = request.data.get('folder', None)
        file = request.data.get('file', None)
        
        if not title or not file:
            return Response(
                {"error": "Title and file are required fields."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create document without tags
        document = Document.objects.create(
            title=title,
            document_type=document_type,
            description=description,
            department_id=department_id,
            folder_id=folder_id,
            file=file,
            uploaded_by=request.user
        )
        
        serializer = self.get_serializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def process_ocr(self, request, pk=None):
        """
        Manually trigger OCR processing for a document.
        """
        document = self.get_object()
        
        # Don't process if already processed
        if document.is_ocr_processed:
            return Response(
                {"message": "Document has already been processed with OCR."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Trigger OCR processing
        from config.celery import app
        app.send_task('process_document_ocr', args=[document.id])
        
        return Response(
            {"message": "OCR processing has been initiated."},
            status=status.HTTP_202_ACCEPTED
        )
    
    @action(detail=False, methods=['get'])
    def diagnostic(self, request):
        """
        Return diagnostic information about documents.
        Helps troubleshoot document visibility issues.
        """
        user = request.user
        all_docs = Document.objects.all().count()
        user_docs = Document.objects.filter(uploaded_by=user).count()
        
        # Department and folder stats
        dept_counts = {}
        folder_counts = {}
        
        # Get stats per department
        for doc in Document.objects.select_related('department', 'folder'):
            dept_name = doc.department.name if doc.department else 'None'
            if dept_name not in dept_counts:
                dept_counts[dept_name] = 0
            dept_counts[dept_name] += 1
            
            # Get stats per folder
            if doc.department and doc.folder:
                folder_key = f"{doc.department.name}/{doc.folder.name}"
                if folder_key not in folder_counts:
                    folder_counts[folder_key] = 0
                folder_counts[folder_key] += 1
        
        return Response({
            "total_documents": all_docs,
            "user_documents": user_docs,
            "by_department": dept_counts,
            "by_folder": folder_counts,
            "user_info": {
                "id": user.id,
                "username": user.username,
                "is_staff": user.is_staff
            }
        })
    
    @action(detail=True, methods=['get'])
    def ocr_text(self, request, pk=None):
        """
        Retrieve the full OCR text for a document.
        """
        document = self.get_object()
        
        try:
            ocr_data = document.ocr_data
            serializer = DocumentOCRSerializer(ocr_data)
            return Response(serializer.data)
        except DocumentOCR.DoesNotExist:
            return Response(
                {"message": "No OCR data available for this document."},
                status=status.HTTP_404_NOT_FOUND
            )
