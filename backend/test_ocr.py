"""
Test OCR functionality with a local document.

Usage:
    python test_ocr.py <path_to_image_or_pdf_file>
"""

import sys
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.ai.ocr import extract_text_from_image, extract_text_from_pdf


def test_ocr(file_path):
    """Test OCR on a file."""
    print(f"Testing OCR on file: {file_path}")
    
    # Check if file exists
    if not os.path.isfile(file_path):
        print(f"Error: File not found: {file_path}")
        return
    
    # Extract text based on file type
    if file_path.lower().endswith('.pdf'):
        print("Detected PDF file, processing with PDF OCR...")
        text = extract_text_from_pdf(file_path)
    else:
        print("Processing as image...")
        text = extract_text_from_image(file_path)
    
    # Print the extracted text
    print("\n" + "="*50)
    print("EXTRACTED TEXT:")
    print("="*50)
    print(text)
    print("="*50)
    print(f"Total characters extracted: {len(text)}")


if __name__ == "__main__":
    # Check for command line arguments
    if len(sys.argv) < 2:
        print("Usage: python test_ocr.py <path_to_image_or_pdf_file>")
        sys.exit(1)
    
    # Get the file path from command line
    file_path = sys.argv[1]
    test_ocr(file_path)
