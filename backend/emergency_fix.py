#!/usr/bin/env python
"""
Emergency fix script for documents showing in all Commercial department folders.
This script applies a direct fix to ensure documents only appear in their assigned folders.
"""
import os
import sys
import django
from django.db import transaction

# Set up Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from apps.documents.models import Document, Department, Folder

def emergency_fix_commercial_folders():
    """
    Direct fix to ensure documents only appear in their assigned folder in Commercial department.
    """
    print("\n🔥 EMERGENCY FIX: Documents Appearing in All Commercial Folders 🔥\n")
    print("=" * 70)
    
    # Get Commercial department
    try:
        commercial_dept = Department.objects.get(name="Commercial")
        print(f"✅ Found Commercial department (ID: {commercial_dept.id})")
    except Department.DoesNotExist:
        print("❌ Commercial department not found, cannot proceed.")
        return

    # Get all folders in Commercial department
    commercial_folders = Folder.objects.filter(department=commercial_dept)
    print(f"Found {commercial_folders.count()} folders in Commercial department:")
    for folder in commercial_folders:
        print(f"  - {folder.name} (ID: {folder.id})")
    
    # Get all documents in Commercial department
    commercial_docs = Document.objects.filter(department=commercial_dept)
    print(f"\nFound {commercial_docs.count()} documents in Commercial department")
    
    # Show which documents are in which folders
    print("\nCurrent document distribution:")
    for folder in commercial_folders:
        docs = Document.objects.filter(department=commercial_dept, folder=folder)
        print(f"  - {folder.name}: {docs.count()} documents")
        for doc in docs:
            print(f"      * {doc.title} (ID: {doc.id})")
    
    # Get documents without folders
    no_folder_docs = commercial_docs.filter(folder=None)
    if no_folder_docs:
        print(f"\n⚠️ Found {no_folder_docs.count()} documents in Commercial without a folder")
        for doc in no_folder_docs:
            print(f"  - {doc.title} (ID: {doc.id})")
    
    print("\n🔍 Analyzing document titles to determine correct folder assignments...")
    
    # Dictionary to map keywords to folders
    keyword_folder_map = {
        "client": "Client Documents",
        "contract": "Contracts",
        "marketing": "Marketing Materials",
        "sales": "Sales Reports",
    }
    
    with transaction.atomic():
        # First, make a list of documents to fix
        fix_assignments = []
        
        # Check all documents in Commercial department
        for doc in commercial_docs:
            # If document has a title that clearly matches a specific folder but is in a different folder
            doc_title_lower = doc.title.lower()
            
            # Skip documents that are already correctly assigned
            if doc.folder and any(keyword.lower() in doc_title_lower and doc.folder.name == folder_name 
                              for keyword, folder_name in keyword_folder_map.items()):
                continue
                
            # For documents in wrong folder or without folder, find the right folder
            target_folder = None
            
            for keyword, folder_name in keyword_folder_map.items():
                if keyword.lower() in doc_title_lower:
                    try:
                        target_folder = Folder.objects.get(name=folder_name, department=commercial_dept)
                        break
                    except Folder.DoesNotExist:
                        continue
            
            # If we found a matching folder that's different from current assignment
            if target_folder and (not doc.folder or doc.folder.id != target_folder.id):
                old_folder = doc.folder.name if doc.folder else "No folder"
                fix_assignments.append((doc, target_folder, old_folder))
        
        # Apply the fixes
        if fix_assignments:
            print(f"\n🔧 Applying fixes for {len(fix_assignments)} documents:")
            for doc, target_folder, old_folder in fix_assignments:
                print(f"  Moving '{doc.title}' from {old_folder} to {target_folder.name}")
                doc.folder = target_folder
                doc.save()
            print("✅ Document assignments fixed")
        else:
            print("\n✅ No document assignments need fixing")
        
        # Special case: if we have a document titled "TND beton..." in any folder
        tnd_docs = Document.objects.filter(title__icontains="tnd beton", department=commercial_dept)
        if tnd_docs:
            print("\n🔍 Found TND beton document(s) - checking assignments:")
            for doc in tnd_docs:
                print(f"  - {doc.title} (ID: {doc.id})")
                print(f"    Current folder: {doc.folder.name if doc.folder else 'None'}")
                
                # Should be in contracts folder as it looks like an invoice
                try:
                    contracts_folder = Folder.objects.get(name="Contracts", department=commercial_dept)
                    if not doc.folder or doc.folder.id != contracts_folder.id:
                        old_folder = doc.folder.name if doc.folder else "No folder"
                        print(f"    Moving from {old_folder} to Contracts folder")
                        doc.folder = contracts_folder
                        doc.document_type = "contract"  # Make sure type matches folder
                        doc.save()
                except Folder.DoesNotExist:
                    print("    Contracts folder not found")
    
    print("\n✅ Emergency fix complete")
    print("=" * 70)
    
    # Final verification
    print("\nVerifying document assignments:")
    for folder in commercial_folders:
        docs = Document.objects.filter(department=commercial_dept, folder=folder)
        print(f"  - {folder.name}: {docs.count()} documents")

if __name__ == "__main__":
    print("⚠️ This script will update document folder assignments in the Commercial department.")
    confirm = input("Continue? (y/n): ").strip().lower()
    if confirm == 'y':
        emergency_fix_commercial_folders()
    else:
        print("Operation cancelled.")
