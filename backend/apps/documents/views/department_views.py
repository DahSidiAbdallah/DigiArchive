"""Department views."""

from rest_framework import viewsets, permissions
from apps.documents.models.department import Department, Folder
from apps.documents.serializers.department_serializers import DepartmentSerializer, FolderSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    """API endpoints for departments."""
    
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter departments based on user permissions."""
        # Staff users can see all departments
        if self.request.user.is_staff:
            return Department.objects.all()
        
        # Regular authenticated users can see all departments too
        # This allows them to upload documents to any department
        return Department.objects.all()
        
        # Alternative: If you want to restrict to user's department only:
        # user_dept = getattr(self.request.user, 'department', '')
        # if user_dept:
        #     return Department.objects.filter(name=user_dept)
        # else:
        #     return Department.objects.all()  # Show all if no specific department


class FolderViewSet(viewsets.ModelViewSet):
    """API endpoints for folders."""
    
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter folders based on user permissions and query parameters."""
        queryset = Folder.objects.all()
        
        # Filter by department if specified
        department_id = self.request.query_params.get('department', None)
        if department_id is not None:
            queryset = queryset.filter(department_id=department_id)
        
        # Filter by parent folder if specified
        parent_id = self.request.query_params.get('parent', None)
        if parent_id is not None:
            if parent_id == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent_id)
        
        # If not admin, filter by user's department
        if not self.request.user.is_staff:
            user_dept = getattr(self.request.user, 'department', '')
            if user_dept:
                dept_qs = Department.objects.filter(name=user_dept)
                if dept_qs.exists():
                    queryset = queryset.filter(department__in=dept_qs)
                else:
                    return Folder.objects.none()
            else:
                return Folder.objects.none()
        
        return queryset
