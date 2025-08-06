#!/usr/bin/env python
"""
One-time fix for documents appearing in multiple folders of the Commercial department.
"""
import os
import django
from django.db import transaction

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from apps.documents.models import Document, Department, Folder

def fix_commercial_department_documents():
    """Fix document assignments in Commercial department."""
    print("\nFix for documents showing in all Commercial department folders\n")
    print("=" * 70)
    
    # Get Commercial department
    try:
        commercial_dept = Department.objects.get(name="Commercial")
        print(f"Found Commercial department (ID: {commercial_dept.id})")
    except Department.DoesNotExist:
        print("Commercial department not found, cannot proceed.")
        return

    # Get all folders in Commercial department
    commercial_folders = Folder.objects.filter(department=commercial_dept)
    print(f"Found {commercial_folders.count()} folders in Commercial department")
    
    # Get Client Documents folder
    try:
        client_docs_folder = Folder.objects.get(name="Client Documents", department=commercial_dept)
        print(f"Found Client Documents folder (ID: {client_docs_folder.id})")
    except Folder.DoesNotExist:
        print("Client Documents folder not found in Commercial department")
        return
    
    # Get all documents in Commercial department
    commercial_docs = Document.objects.filter(department=commercial_dept)
    print(f"Found {commercial_docs.count()} documents in Commercial department")
    
    # Check if we have documents without a folder in Commercial
    no_folder_docs = commercial_docs.filter(folder=None)
    if no_folder_docs:
        print(f"Found {no_folder_docs.count()} documents in Commercial without a folder")
        
        # Inspect the first few docs
        for doc in no_folder_docs[:5]:
            print(f"Document without folder: {doc.title} (ID: {doc.id})")
    
    # List documents specifically assigned to Client Documents folder
    client_docs = Document.objects.filter(folder=client_docs_folder)
    print(f"Found {client_docs.count()} documents in Client Documents folder")
    
    # Check for documents with "client" in their name/description but not in Client Documents folder
    potential_client_docs = Document.objects.filter(
        department=commercial_dept
    ).exclude(
        folder=client_docs_folder
    ).filter(
        title__icontains="client"
    )
    
    if potential_client_docs:
        print(f"\nFound {potential_client_docs.count()} potential client documents in wrong folders:")
        for doc in potential_client_docs:
            current_folder = doc.folder.name if doc.folder else "No folder"
            print(f"Document: {doc.title} (ID: {doc.id})")
            print(f"  Current folder: {current_folder}")
    
    # Fix documents appearing in all folders by assigning them to a specific folder
    with transaction.atomic():
        # Get documents that should be in Client Documents
        to_fix_docs = []
        
        # Case 1: Documents with client in title/description should go to Client Documents
        for doc in commercial_docs:
            if "client" in doc.title.lower() or (doc.description and "client" in doc.description.lower()):
                if doc.folder != client_docs_folder:
                    to_fix_docs.append((doc, client_docs_folder))
        
        # Case 2: Documents without folder in Commercial should be assigned to proper folders based on content
        for doc in no_folder_docs:
            if "client" in doc.title.lower() or (doc.description and "client" in doc.description.lower()):
                to_fix_docs.append((doc, client_docs_folder))
            # Additional logic for other folders could be added here
        
        # Apply fixes
        if to_fix_docs:
            print(f"\nFixing {len(to_fix_docs)} document assignments:")
            for doc, folder in to_fix_docs:
                old_folder = doc.folder.name if doc.folder else "No folder"
                print(f"Assigning document '{doc.title}' from {old_folder} to {folder.name}")
                doc.folder = folder
                doc.save()
            print("✓ Fixed document assignments")
        else:
            print("\nNo documents need fixing")
    
    # Final verification
    print("\nVerifying document assignments:")
    for folder in commercial_folders:
        folder_docs = Document.objects.filter(department=commercial_dept, folder=folder)
        print(f"- {folder.name}: {folder_docs.count()} documents")
        
    print("\nFix Complete")
    print("=" * 70)

if __name__ == "__main__":
    confirm = input("This will update document assignments in the Commercial department. Continue? (y/n): ").strip().lower()
    if confirm == 'y':
        fix_commercial_department_documents()
    else:
        print("Operation cancelled.")
