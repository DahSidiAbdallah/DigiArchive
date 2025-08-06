"""Custom permissions for document views."""

from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admin users to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user (already enforced by IsAuthenticated)
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are only allowed to the owner or staff users
        return obj.uploaded_by == request.user or request.user.is_staff
        

class EnsureCorrectFolderDepartment(permissions.BasePermission):
    """
    Custom permission to ensure documents can only be accessed in their correct folder
    and department combination. This prevents documents from appearing in the wrong
    folder or department context.
    """
    
    def has_permission(self, request, view):
        # This only applies to document list requests with folder/department filtering
        if view.action != 'list':
            return True
            
        # Get folder_id and department_id from query params
        folder_id = request.query_params.get('folder_id')
        department_id = request.query_params.get('department_id')
        
        # If both folder and department are specified, verify they match
        if folder_id and department_id:
            try:
                from apps.documents.models import Folder, Department
                folder = Folder.objects.get(id=int(folder_id))
                
                # Check if folder belongs to the specified department
                if folder.department and str(folder.department.id) != department_id:
                    print(f"Permission denied: Folder {folder_id} does not belong to department {department_id}")
                    return False
                    
                # Log important debugging information
                print(f"PERMISSION CHECK: Allowing access to folder '{folder.name}' in department ID {department_id}")
            except Exception as e:
                # Log but allow (we'll handle filtering properly in get_queryset)
                print(f"Error checking folder/department relationship: {e}")
        
        # For debugging - if we're looking at Commercial department
        if department_id and not folder_id:
            try:
                dept_id = int(department_id)
                from apps.documents.models import Department
                if Department.objects.filter(id=dept_id, name="Commercial").exists():
                    print(f"PERMISSION CHECK: Viewing Commercial department (ID: {dept_id})")
            except Exception as e:
                print(f"Error in department check: {e}")
                
        return True
