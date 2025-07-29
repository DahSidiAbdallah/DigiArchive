"""Department models."""

from django.db import models


class Department(models.Model):
    """Department model for MAFCI DigiArchive."""
    
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
    
    def __str__(self):
        return self.name
    
    def get_full_path(self):
        """Get the full hierarchical path of the department."""
        if self.parent:
            return f"{self.parent.get_full_path()}/{self.name}"
        return self.name


class Folder(models.Model):
    """Folder model for organizing documents within departments."""
    
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='folders')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subfolders')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ('name', 'department', 'parent')
        verbose_name = 'Folder'
        verbose_name_plural = 'Folders'
    
    def __str__(self):
        if self.parent:
            return f"{self.parent}/{self.name}"
        return f"{self.department.name}/{self.name}"
    
    def get_full_path(self):
        """Get the full path of the folder including parent folders."""
        if self.parent:
            return f"{self.parent.get_full_path()}/{self.name}"
        return f"{self.department.name}/{self.name}"
