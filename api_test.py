import requests
import json

# Configuration
API_URL = 'http://localhost:8000/api'
# Replace with your actual token (you can get this from your browser's localStorage or cookies)
# You can leave this empty and the script will prompt you for a token
AUTH_TOKEN = ''

def get_headers():
    global AUTH_TOKEN
    if not AUTH_TOKEN:
        AUTH_TOKEN = input("Please enter your authentication token: ")
    return {
        'Authorization': f'Token {AUTH_TOKEN}',
        'Content-Type': 'application/json'
    }

def list_documents():
    """List all documents"""
    response = requests.get(f'{API_URL}/documents/', headers=get_headers())
    if response.status_code == 200:
        data = response.json()
        print(f"Found {data['count']} documents")
        for doc in data['results']:
            print(f"ID: {doc['id']}, Title: {doc['title']}, Type: {doc['document_type']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

def list_departments():
    """List all departments"""
    response = requests.get(f'{API_URL}/departments/', headers=get_headers())
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data)} departments")
        for dept in data:
            print(f"ID: {dept['id']}, Name: {dept['name']}, Code: {dept['code']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

def list_folders():
    """List all folders"""
    response = requests.get(f'{API_URL}/folders/', headers=get_headers())
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data)} folders")
        for folder in data:
            print(f"ID: {folder['id']}, Name: {folder['name']}, Department: {folder.get('department')}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

def list_tags():
    """List all tags"""
    response = requests.get(f'{API_URL}/tags/', headers=get_headers())
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data)} tags")
        for tag in data:
            print(f"ID: {tag['id']}, Name: {tag['name']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")

def get_document(doc_id):
    """Get a single document"""
    response = requests.get(f'{API_URL}/documents/{doc_id}/', headers=get_headers())
    if response.status_code == 200:
        doc = response.json()
        print(f"Document ID: {doc['id']}")
        print(f"Title: {doc['title']}")
        print(f"Type: {doc['document_type']}")
        print(f"Department: {doc.get('department_details', {}).get('name') if doc.get('department') else 'None'}")
        print(f"Folder: {doc.get('folder_details', {}).get('name') if doc.get('folder') else 'None'}")
        print(f"Tags: {', '.join([tag['name'] for tag in doc.get('tags', [])])}")
        return doc
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def update_document(doc_id, update_data):
    """Update a document using JSON"""
    print(f"\nUpdating document {doc_id} with data:")
    print(json.dumps(update_data, indent=2))
    
    response = requests.patch(
        f'{API_URL}/documents/{doc_id}/', 
        headers=get_headers(),
        json=update_data
    )
    
    if response.status_code == 200:
        print("Document updated successfully!")
        updated_doc = response.json()
        print(f"Updated document: {json.dumps(updated_doc, indent=2)}")
        return updated_doc
    else:
        print(f"Error updating document: {response.status_code} - {response.text}")
        return None

if __name__ == "__main__":
    print("\n=== DOCUMENTS ===")
    list_documents()
    
    print("\n=== DEPARTMENTS ===")
    list_departments()
    
    print("\n=== FOLDERS ===")
    list_folders()
    
    print("\n=== TAGS ===")
    list_tags()
    
    # Get document ID from user
    doc_id = input("\nEnter document ID to update (or press Enter to skip): ")
    if doc_id:
        # Get document details before update
        print("\nBEFORE UPDATE:")
        original_doc = get_document(doc_id)
        
        if original_doc:
            # Get department ID from user
            dept_id = input("\nEnter department ID to assign (or press Enter to skip): ")
            folder_id = input("Enter folder ID to assign (or press Enter to skip): ")
            tag_ids_input = input("Enter tag IDs to assign (comma-separated, or press Enter to skip): ")
            
            # Prepare update data
            update_data = {}
            
            # Always include a title update
            update_data["title"] = "TD Béton - Updated Document"
            
            if dept_id:
                # We need to send integers for foreign keys
                update_data["department"] = int(dept_id)
            
            if folder_id:
                update_data["folder"] = int(folder_id)
            
            if tag_ids_input:
                # Process tag IDs as a list of integers
                tag_ids = [int(tag_id.strip()) for tag_id in tag_ids_input.split(",") if tag_id.strip()]
                update_data["tag_ids"] = tag_ids
            
            # Update document
            updated_doc = update_document(doc_id, update_data)
            
            if updated_doc:
                print("\nAFTER UPDATE:")
                get_document(doc_id)
