"""
Script to create test departments and folders.
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.documents.models import Department, Folder

# Create test departments
def create_test_data():
    # Create departments
    departments = [
        Department.objects.create(name="Commercial", code="COM", description="Commercial Department"),
        Department.objects.create(name="Finance", code="FIN", description="Finance Department"),
        Department.objects.create(name="Human Resources", code="HR", description="Human Resources Department"),
        Department.objects.create(name="Operations", code="OPS", description="Operations Department"),
        Department.objects.create(name="Information Technology", code="IT", description="IT Department"),
    ]
    
    # Create folders for each department
    for dept in departments:
        folders = []
        
        if dept.code == "COM":
            folders = [
                "Contracts", 
                "Client Documents", 
                "Marketing Materials",
                "Sales Reports"
            ]
        elif dept.code == "FIN":
            folders = [
                "Invoices", 
                "Financial Reports", 
                "Tax Documents",
                "Budgets"
            ]
        elif dept.code == "HR":
            folders = [
                "Employee Records", 
                "Policies", 
                "Recruitment",
                "Training Materials"
            ]
        elif dept.code == "OPS":
            folders = [
                "Project Documents", 
                "Standard Operating Procedures", 
                "Logistics",
                "Quality Control"
            ]
        elif dept.code == "IT":
            folders = [
                "System Documentation", 
                "Project Specifications", 
                "Security Policies",
                "User Guides"
            ]
        
        # Create folders
        for folder_name in folders:
            Folder.objects.create(
                name=folder_name,
                department=dept,
                description=f"{folder_name} for {dept.name}"
            )
    
    print("Test data created successfully!")
    print(f"Created {Department.objects.count()} departments")
    print(f"Created {Folder.objects.count()} folders")

if __name__ == "__main__":
    create_test_data()
