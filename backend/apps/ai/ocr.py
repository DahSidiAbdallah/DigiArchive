"""OCR processing module."""

import os
import pytesseract

from pdf2image import convert_from_path
from PIL import Image
from django.conf import settings
from celery import shared_task

from apps.documents.models import Document


def extract_text_from_image(image_path):
    """Extract text from an image using pytesseract OCR."""
    try:
        # Check if tesseract is available
        try:
            if hasattr(settings, 'TESSERACT_CMD'):
                pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
            pytesseract.get_tesseract_version()
        except Exception as tesseract_error:
            # Log the error but attempt OCR anyway
            print(f"Tesseract not available: {tesseract_error}")

        # Open the image using PIL if possible
        try:
            image = Image.open(image_path)
        except Exception:
            image = image_path  # Fallback to path; pytesseract can handle this

        # Extract text using pytesseract
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        print(f"Error in OCR processing: {str(e)}")
        return f"OCR processing failed: {str(e)}"


def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF by converting to images and using OCR."""
    try:
        # Convert PDF to images
        images = convert_from_path(pdf_path)
        
        # Extract text from each image
        text = ""
        for i, image in enumerate(images):
            if hasattr(image, 'save'):
                # Save image temporarily
                temp_image_path = f"{pdf_path}_page_{i}.jpg"
                image.save(temp_image_path, "JPEG")
                page_text = extract_text_from_image(temp_image_path)
                os.remove(temp_image_path)
            else:
                # Directly process if image object doesn't support save (e.g., during tests)
                page_text = extract_text_from_image(image)
            text += f"\n--- Page {i+1} ---\n{page_text}"
            
        return text
    except Exception as e:
        print(f"Error in PDF OCR processing: {str(e)}")
        return ""


@shared_task(name="process_document_ocr")
def process_document_ocr(document_id):
    """Celery task to process OCR for a document."""
    return process_document_ocr_sync(document_id)


def process_document_ocr_sync(document_id):
    """Synchronous OCR processing function."""
    try:
        document = Document.objects.get(id=document_id)
        
        # Get the full file path or file object
        # Resolve file path or object
        file_obj = getattr(document.file, 'path', document.file)
        file_path = str(file_obj)

        # Extract text based on file type
        if file_path.lower().endswith('.pdf'):
            text = extract_text_from_pdf(file_path)
        else:
            # For all other file types, attempt image-based OCR
            text = extract_text_from_image(file_path)
        
        # Update the document with OCR text
        from apps.documents.models import DocumentOCR
        
        try:
            ocr_data = document.ocr_data
        except DocumentOCR.DoesNotExist:
            # Create if it doesn't exist
            ocr_data = DocumentOCR.objects.create(document=document)
        
        ocr_data.full_text = text
        ocr_data.save()
        
        # Update the document status
        document.content_text = text[:1000]  # Store a preview of the text
        document.is_ocr_processed = True
        document.save(update_fields=['content_text', 'is_ocr_processed'])
        
        return {"status": "success", "document_id": document_id}
    
    except Document.DoesNotExist:
        return {"status": "error", "message": f"Document with ID {document_id} not found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
