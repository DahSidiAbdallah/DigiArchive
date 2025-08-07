"""Document models module."""

# Import submodules here for easy access
from .core import Document, Tag, DocumentType, DocumentOCR
from .department import Department, Folder
from .audit import AuditLog

__all__ = ['Document', 'Tag', 'DocumentType', 'DocumentOCR', 'Department', 'Folder', 'AuditLog']
