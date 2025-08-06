"""
Script to list documents in the database and their details
"""
import os
import sys
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from apps.documents.models.core import Document, Tag
from apps.documents.models.department import Department, Folder

# List all documents
print("\n=== DOCUMENTS ===")
documents = Document.objects.all()
for doc in documents:
    print(f"ID: {doc.id}, Title: {doc.title}, Type: {doc.document_type}")
    print(f"  Department: {doc.department.name if doc.department else 'None'}")
    print(f"  Folder: {doc.folder.name if doc.folder else 'None'}")
    print(f"  Tags: {', '.join([tag.name for tag in doc.tags.all()])}")
    print()

# List all departments
print("\n=== DEPARTMENTS ===")
departments = Department.objects.all()
for dept in departments:
    print(f"ID: {dept.id}, Name: {dept.name}, Code: {dept.code}")

# List all folders
print("\n=== FOLDERS ===")
folders = Folder.objects.all()
for folder in folders:
    print(f"ID: {folder.id}, Name: {folder.name}, Department: {folder.department.name if folder.department else 'None'}")

# List all tags
print("\n=== TAGS ===")
tags = Tag.objects.all()
for tag in tags:
    print(f"ID: {tag.id}, Name: {tag.name}")
