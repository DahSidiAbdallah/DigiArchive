"""
Script to test document update via the Django REST API directly
"""
import os
import sys
import json
import requests
from django.core.management import call_command

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from apps.documents.models.core import Document, Tag
from apps.documents.models.department import Department, Folder

# Print document details by ID
def print_document_details(doc_id=None):
    try:
        if doc_id:
            document = Document.objects.get(id=doc_id)
            print(f"\nDocument ID: {document.id}")
            print(f"Title: {document.title}")
            print(f"Type: {document.document_type}")
            print(f"Department: {document.department.name if document.department else 'None'}")
            print(f"Folder: {document.folder.name if document.folder else 'None'}")
            print(f"Tags: {', '.join([tag.name for tag in document.tags.all()])}")
        else:
            print("\n=== DOCUMENTS ===")
            for doc in Document.objects.all():
                print(f"ID: {doc.id}, Title: {doc.title}")
                print(f"  Department: {doc.department.name if doc.department else 'None'}")
                print(f"  Folder: {doc.folder.name if doc.folder else 'None'}")
                print()
    except Document.DoesNotExist:
        print(f"No document with ID {doc_id} found")
    except Exception as e:
        print(f"Error: {str(e)}")

# Print available departments and folders
def print_departments_and_folders():
    print("\n=== DEPARTMENTS ===")
    for dept in Department.objects.all():
        print(f"ID: {dept.id}, Name: {dept.name}, Code: {dept.code}")
    
    print("\n=== FOLDERS ===")
    for folder in Folder.objects.all():
        print(f"ID: {folder.id}, Name: {folder.name}, Department: {folder.department.name if folder.department else 'None'}")

# Get an auth token for the test user
def get_auth_token():
    User = get_user_model()
    # Get the first superuser or create one if none exists
    try:
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            username = 'admin'
            email = 'admin@example.com'
            password = 'admin123'
            user = User.objects.create_superuser(username=username, email=email, password=password)
            print(f"Created superuser {username} with password {password}")
        
        # Get or create token
        token, created = Token.objects.get_or_create(user=user)
        if created:
            print(f"Created new token for user {user.username}")
        return token.key
    except Exception as e:
        print(f"Error getting auth token: {str(e)}")
        return None

# Update a document using the REST API
def update_document_api(doc_id, update_data):
    token = get_auth_token()
    if not token:
        print("Failed to get auth token")
        return
    
    # Base URL for the API
    base_url = 'http://localhost:8000/api'
    headers = {
        'Authorization': f'Token {token}',
        'Content-Type': 'application/json'
    }
    
    # Make the PATCH request
    url = f"{base_url}/documents/{doc_id}/"
    print(f"\nSending PATCH request to {url}")
    print(f"Headers: {headers}")
    print(f"Data: {json.dumps(update_data, indent=2)}")
    
    try:
        response = requests.patch(url, json=update_data, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("Document updated successfully!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            # Refresh document details from database
            print_document_details(doc_id)
        else:
            print(f"Error updating document: {response.text}")
    except Exception as e:
        print(f"Request failed: {str(e)}")

# Main execution
if __name__ == "__main__":
    # Print initial data
    print_document_details()
    print_departments_and_folders()
    
    # Let's test updating a document (replace with appropriate IDs)
    # Assuming document with ID 1, department ID 1, and folder ID 1 exist
    doc_id_to_update = 1
    department_id = 1
    folder_id = 1
    tag_ids = [1, 2]  # Replace with existing tag IDs
    
    update_data = {
        "title": "Updated TD Béton Document",
        "document_type": "report",
        "description": "Document updated via direct API test",
        "department": department_id,
        "folder": folder_id,
        "tag_ids": tag_ids
    }
    
    # Print current document details
    print("\nBEFORE UPDATE:")
    print_document_details(doc_id_to_update)
    
    # Perform update
    update_document_api(doc_id_to_update, update_data)
