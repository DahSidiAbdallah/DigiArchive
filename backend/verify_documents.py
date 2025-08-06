#!/usr/bin/env python
"""
Test script to verify document assignments after fixes
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

def verify_document_assignments():
    """Verify all documents have proper folder/department assignments"""
    print("\nVerifying Document-Folder-Department Relationships\n")
    print("=" * 70)
    
    # Get all departments
    departments = Department.objects.all()
    print(f"Found {departments.count()} departments")
    
    # Check each department
    for dept in departments:
        print(f"\nDepartment: {dept.name}")
        
        # Get folders in this department
        folders = Folder.objects.filter(department=dept)
        print(f"  Found {folders.count()} folders in this department")
        
        # Get documents in this department
        dept_docs = Document.objects.filter(department=dept)
        print(f"  Found {dept_docs.count()} documents in this department")
        
        # Check documents by folder
        folder_counts = {}
        for folder in folders:
            folder_docs = Document.objects.filter(department=dept, folder=folder)
            folder_counts[folder.name] = folder_docs.count()
        
        # Print folder document counts
        for folder_name, count in folder_counts.items():
            print(f"    - {folder_name}: {count} documents")
        
        # Check for documents without folder
        no_folder = Document.objects.filter(department=dept, folder=None).count()
        if no_folder > 0:
            print(f"    - No folder: {no_folder} documents")
    
    # Check for inconsistent department-folder assignments
    inconsistent_docs = []
    for doc in Document.objects.all():
        if doc.department and doc.folder and doc.folder.department:
            if doc.department.id != doc.folder.department.id:
                inconsistent_docs.append(doc)
    
    if inconsistent_docs:
        print(f"\n⚠️ Found {len(inconsistent_docs)} documents with inconsistent department/folder assignments:")
        for doc in inconsistent_docs:
            print(f"  Document: {doc.title}")
            print(f"    Document Department: {doc.department.name}")
            print(f"    Folder: {doc.folder.name}")
            print(f"    Folder Department: {doc.folder.department.name}")
    else:
        print("\n✅ All documents have consistent department/folder assignments")
    
    # Special check for Commercial/Client Documents
    try:
        commercial_dept = Department.objects.get(name="Commercial")
        client_folder = Folder.objects.get(name="Client Documents", department=commercial_dept)
        
        # Documents in this folder
        client_docs = Document.objects.filter(folder=client_folder)
        print(f"\nCommercial/Client Documents: {client_docs.count()} documents found")
        
        # Documents in Commercial dept but with "client" in title
        potential_client_docs = Document.objects.filter(
            department=commercial_dept
        ).filter(
            title__icontains="client"
        ).exclude(
            folder=client_folder
        )
        
        if potential_client_docs:
            print(f"⚠️ Found {potential_client_docs.count()} potential client documents not in Client Documents folder:")
            for doc in potential_client_docs:
                folder_name = doc.folder.name if doc.folder else "No folder"
                print(f"  Document: {doc.title} (in {folder_name})")
    except (Department.DoesNotExist, Folder.DoesNotExist):
        print("Commercial department or Client Documents folder not found")
    
    print("\nVerification Complete")
    print("=" * 70)

if __name__ == "__main__":
    verify_document_assignments()
