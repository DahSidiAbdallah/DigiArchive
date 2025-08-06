"""
Fix script for document tag issues.
This script checks for documents with tag issues and repairs them.
"""

import os
import sys
import django
from django.db import transaction

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.documents.models import Document

def fix_document_tags():
    """
    Check for and fix any documents with tag relationship issues.
    """
    print("Starting document tag repair...")
    
    # Get all documents
    documents = Document.objects.all()
    print(f"Found {documents.count()} documents")
    
    fixed_count = 0
    error_count = 0
    
    # Check each document's tags
    for doc in documents:
        try:
            # Check if we can access tags without error
            tag_count = doc.tags.all().count()
            print(f"Document {doc.id} - '{doc.title}' has {tag_count} tags - OK")
        except Exception as e:
            # If there's an error, try to fix the tags
            print(f"Error with document {doc.id} - '{doc.title}': {str(e)}")
            try:
                with transaction.atomic():
                    # Clear the tags relationship
                    doc.tags.clear()
                    print(f"Fixed document {doc.id} - '{doc.title}' by clearing tags")
                    fixed_count += 1
            except Exception as fix_error:
                print(f"Failed to fix document {doc.id}: {str(fix_error)}")
                error_count += 1
    
    print(f"\nRepair summary:")
    print(f"- Total documents checked: {documents.count()}")
    print(f"- Documents fixed: {fixed_count}")
    print(f"- Failed repairs: {error_count}")
    
    if error_count == 0:
        print("\nAll document tag issues have been resolved successfully.")
    else:
        print("\nSome documents could not be repaired. Please check the logs.")

if __name__ == "__main__":
    fix_document_tags()
