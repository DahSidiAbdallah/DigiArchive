#!/usr/bin/env python
"""
Utility script to fix documents in the Commercial/Client Documents folder.
This will ensure all documents assigned to Client Documents folder are properly linked to Commercial department.
"""
import os
import sys
import django
from django.db.models import Q

# Set up Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from apps.documents.models import Document, Department, Folder
from django.db import transaction

def fix_client_documents():
    """
    Fix document assignments for Client Documents folder in Commercial department.
    """
    print("\nCommercial/Client Documents Folder Fix Utility\n")
    print("=" * 70)
    
    # Get Commercial department
    try:
        commercial_dept = Department.objects.get(name="Commercial")
        print(f"✓ Found Commercial department (ID: {commercial_dept.id})")
    except Department.DoesNotExist:
        print("✗ Commercial department not found, cannot proceed.")
        return

    # Get Client Documents folder
    try:
        client_docs_folder = Folder.objects.get(name="Client Documents", department=commercial_dept)
        print(f"✓ Found Client Documents folder (ID: {client_docs_folder.id}) in Commercial department")
    except Folder.DoesNotExist:
        print("✗ Client Documents folder not found in Commercial department, cannot proceed.")
        return
    
    with transaction.atomic():
        # Find and fix documents that should be in this folder
        # Case 1: Documents with folder=Client Documents but department!=Commercial
        mismatched_dept = Document.objects.filter(
            folder=client_docs_folder
        ).exclude(
            department=commercial_dept
        )
        
        if mismatched_dept.exists():
            print(f"\nFound {mismatched_dept.count()} documents in Client Documents folder with wrong department:")
            for doc in mismatched_dept:
                old_dept = doc.department.name if doc.department else 'None'
                print(f"Fixing document '{doc.title}' (ID: {doc.id}): {old_dept} -> Commercial")
                doc.department = commercial_dept
                doc.save()
            print("✓ Fixed department assignments")
        else:
            print("\n✓ No documents found with wrong department assignment")
            
        # Case 2: Documents with Client Documents in title but not assigned to folder
        potential_matches = Document.objects.filter(
            Q(title__icontains="client") | 
            Q(description__icontains="client document")
        ).filter(
            department=commercial_dept,
            folder=None
        )
        
        if potential_matches.exists():
            print(f"\nFound {potential_matches.count()} potential client documents not assigned to folder:")
            for doc in potential_matches:
                print(f"Fixing document '{doc.title}' (ID: {doc.id}): No folder -> Client Documents")
                doc.folder = client_docs_folder
                doc.save()
            print("✓ Fixed folder assignments")
        else:
            print("\n✓ No potential client documents found without folder assignment")
            
        # Case 3: Documents in wrong folder
        wrong_folder = Document.objects.filter(
            department=commercial_dept
        ).filter(
            Q(title__icontains="client") | 
            Q(description__icontains="client")
        ).exclude(
            folder=client_docs_folder
        )
        
        if wrong_folder.exists():
            print(f"\nFound {wrong_folder.count()} potential client documents in wrong folder:")
            for doc in wrong_folder:
                old_folder = doc.folder.name if doc.folder else 'None'
                print(f"Fixing document '{doc.title}' (ID: {doc.id}): {old_folder} -> Client Documents")
                doc.folder = client_docs_folder
                doc.save()
            print("✓ Fixed wrong folder assignments")
        else:
            print("\n✓ No client documents found in wrong folders")
    
    # Verify the fix
    fixed_docs = Document.objects.filter(department=commercial_dept, folder=client_docs_folder)
    print(f"\nAfter fixes: {fixed_docs.count()} documents properly assigned to Commercial/Client Documents folder")
    
    print("\nFix Complete")
    print("=" * 70)

if __name__ == "__main__":
    confirm = input("This will update document assignments. Continue? (y/n): ").strip().lower()
    if confirm == 'y':
        fix_client_documents()
    else:
        print("Operation cancelled.")
