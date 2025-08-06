#!/usr/bin/env python
"""
Script to create test documents in the Commercial/Client Documents folder.
"""
import os
import django
from django.utils import timezone
from django.core.files.base import ContentFile

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.documents.models import Document, Department, Folder
from django.contrib.auth.models import User

def create_client_document():
    """Create a test document in the Commercial/Client Documents folder."""
    print("\nCreating test document in Commercial/Client Documents folder\n")
    
    # Get or create test user
    username = "test_user"
    try:
        user = User.objects.get(username=username)
        print(f"Using existing user: {username}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            username=username,
            email="test@example.com",
            password="testpassword"
        )
        print(f"Created new user: {username}")
    
    # Get Commercial department
    try:
        commercial_dept = Department.objects.get(name="Commercial")
        print(f"Found Commercial department (ID: {commercial_dept.id})")
    except Department.DoesNotExist:
        print("Commercial department not found, cannot proceed.")
        return
    
    # Get Client Documents folder
    try:
        client_docs_folder = Folder.objects.filter(name="Client Documents", department=commercial_dept).first()
        if client_docs_folder:
            print(f"Found Client Documents folder (ID: {client_docs_folder.id})")
        else:
            # Create folder if it doesn't exist
            client_docs_folder = Folder.objects.create(
                name="Client Documents",
                department=commercial_dept,
                description="Documents related to clients"
            )
            print(f"Created Client Documents folder (ID: {client_docs_folder.id})")
    except Exception as e:
        print(f"Error finding/creating Client Documents folder: {e}")
        return
    
    # Create a sample document
    try:
        # Create content for the file
        content = ContentFile(b"This is a test client document for testing purposes.")
        
        # Create document with explicit department and folder
        document = Document(
            title="Test Client Document",
            description="A test document for the Client Documents folder in Commercial department",
            document_type="contract",
            date=timezone.now(),
            reference_number="TEST-CLIENT-001",
            department=commercial_dept,
            folder=client_docs_folder,
            uploaded_by=user
        )
        
        # Save document first to generate ID
        document.save()
        
        # Save file with document ID in filename
        document.file.save(f"test_client_document_{document.id}.txt", content)
        
        # Final save
        document.save()
        
        print(f"Created document: {document.title} (ID: {document.id})")
        print(f"Department: {document.department.name}")
        print(f"Folder: {document.folder.name}")
    except Exception as e:
        print(f"Error creating document: {e}")

if __name__ == "__main__":
    create_client_document()
    print("\nDone!")
