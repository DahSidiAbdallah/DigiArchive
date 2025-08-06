#!/usr/bin/env python
"""
Diagnostic tool to check document assignments for Commercial/Client Documents folder.
"""
import os
import sys
import django

# Set up Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from apps.documents.models import Document, Department, Folder

def main():
    """
    Check if documents exist in Commercial/Client Documents folder
    """
    print("\nDiagnostic Tool: Checking Commercial/Client Documents Folder\n")
    print("=" * 70)
    
    # Get Commercial department
    try:
        commercial_dept = Department.objects.get(name="Commercial")
        print(f"✓ Found Commercial department (ID: {commercial_dept.id})")
    except Department.DoesNotExist:
        print("✗ Commercial department not found")
        departments = Department.objects.all()
        print(f"Available departments: {[d.name for d in departments]}")
        return

    # Get Client Documents folder
    try:
        client_docs_folder = Folder.objects.get(name="Client Documents", department=commercial_dept)
        print(f"✓ Found Client Documents folder (ID: {client_docs_folder.id}) in Commercial department")
    except Folder.DoesNotExist:
        print("✗ Client Documents folder not found in Commercial department")
        folders = Folder.objects.filter(department=commercial_dept)
        print(f"Available folders in Commercial: {[f.name for f in folders]}")
        
        # Check if it exists in any department
        all_client_docs = Folder.objects.filter(name="Client Documents")
        if all_client_docs.exists():
            print(f"Found Client Documents folder(s) in other departments:")
            for folder in all_client_docs:
                print(f"  - ID: {folder.id}, Department: {folder.department.name if folder.department else 'None'}")
        return

    # Check documents in this folder
    documents = Document.objects.filter(folder=client_docs_folder)
    print(f"\nFound {documents.count()} documents in Client Documents folder:")
    
    if documents.exists():
        for i, doc in enumerate(documents, 1):
            print(f"{i}. Document: {doc.title} (ID: {doc.id})")
            print(f"   Department: {doc.department.name if doc.department else 'None'} (ID: {doc.department.id if doc.department else 'None'})")
            print(f"   Folder: {doc.folder.name if doc.folder else 'None'} (ID: {doc.folder.id if doc.folder else 'None'})")
            print(f"   Uploader: {doc.uploaded_by.username}")
            print(f"   Created: {doc.created_at}")
            print()
    else:
        print("No documents found in this folder.")
        
    # Check for documents that might be incorrectly assigned
    print("\nChecking for potential misassigned documents:")
    
    # Documents in Commercial department but not in any folder
    no_folder_docs = Document.objects.filter(department=commercial_dept, folder=None)
    if no_folder_docs.exists():
        print(f"Found {no_folder_docs.count()} documents in Commercial department with no folder:")
        for i, doc in enumerate(no_folder_docs[:5], 1):  # Show first 5 for brevity
            print(f"{i}. {doc.title} (ID: {doc.id})")
        if no_folder_docs.count() > 5:
            print(f"   ... and {no_folder_docs.count() - 5} more")
    else:
        print("No documents found in Commercial department without a folder")
    
    # Check document-folder relationship integrity
    print("\nChecking document-folder relationship integrity:")
    all_docs = Document.objects.all()
    mismatched_docs = [d for d in all_docs if d.folder and d.folder.department and d.department and d.folder.department.id != d.department.id]
    
    if mismatched_docs:
        print(f"Found {len(mismatched_docs)} documents with mismatched department-folder relationships:")
        for i, doc in enumerate(mismatched_docs[:5], 1):  # Show first 5 for brevity
            print(f"{i}. Document: {doc.title} (ID: {doc.id})")
            print(f"   Document Department: {doc.department.name} (ID: {doc.department.id})")
            print(f"   Folder: {doc.folder.name} (ID: {doc.folder.id})")
            print(f"   Folder Department: {doc.folder.department.name if doc.folder.department else 'None'} (ID: {doc.folder.department.id if doc.folder.department else 'None'})")
            print()
        if len(mismatched_docs) > 5:
            print(f"   ... and {len(mismatched_docs) - 5} more")
    else:
        print("All documents have correct department-folder relationships ✓")
    
    print("\nDiagnostic Complete")
    print("=" * 70)

if __name__ == "__main__":
    main()
