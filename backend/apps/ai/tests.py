"""Tests for OCR functionality."""

import os
import tempfile
from unittest.mock import patch
from django.test import TestCase
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model

from apps.documents.models import Document
from apps.ai.ocr import extract_text_from_image, extract_text_from_pdf, process_document_ocr

User = get_user_model()


class OCRTestCase(TestCase):
    """Test cases for OCR functionality."""
    
    def setUp(self):
        """Set up test environment."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        # Create a sample test file
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as temp_file:
            temp_file.write(b'Sample text for testing')
            self.temp_file_path = temp_file.name
        
        # Create a test document
        self.document = Document.objects.create(
            title='Test Document',
            document_type='other',
            file=SimpleUploadedFile(
                'test_doc.txt',
                b'This is a test document for OCR testing',
                content_type='text/plain'
            ),
            uploaded_by=self.user
        )
    
    def tearDown(self):
        """Clean up after tests."""
        if os.path.exists(self.temp_file_path):
            os.remove(self.temp_file_path)
    
    @patch('apps.ai.ocr.pytesseract.image_to_string')
    def test_extract_text_from_image(self, mock_image_to_string):
        """Test extracting text from an image."""
        mock_image_to_string.return_value = 'Mocked OCR text'
        
        # Test with a non-image file (should still run but might not extract real text)
        result = extract_text_from_image(self.temp_file_path)
        
        # Verify that pytesseract was called
        mock_image_to_string.assert_called_once()
        self.assertEqual(result, 'Mocked OCR text')
    
    @patch('apps.ai.ocr.convert_from_path')
    @patch('apps.ai.ocr.extract_text_from_image')
    def test_extract_text_from_pdf(self, mock_extract_image, mock_convert_pdf):
        """Test extracting text from a PDF."""
        # Mock the PDF to image conversion
        mock_convert_pdf.return_value = [object(), object()]  # Two mock image objects
        mock_extract_image.return_value = 'Extracted page text'
        
        # Call the function
        result = extract_text_from_pdf(self.temp_file_path)
        
        # Verify mocks were called
        mock_convert_pdf.assert_called_once_with(self.temp_file_path)
        self.assertEqual(mock_extract_image.call_count, 2)
        
        # Check result format
        self.assertIn('Page 1', result)
        self.assertIn('Page 2', result)
        self.assertIn('Extracted page text', result)
    
    @patch('apps.ai.ocr.extract_text_from_image')
    def test_process_document_ocr(self, mock_extract):
        """Test the OCR processing task for a document."""
        mock_extract.return_value = 'Document OCR text result'
        
        # Call the task
        result = process_document_ocr(self.document.id)
        
        # Refresh the document from DB
        self.document.refresh_from_db()
        
        # Check that OCR processing was done
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['document_id'], self.document.id)
        
        # Verify document was updated
        self.assertTrue(self.document.is_ocr_processed)
        self.assertIn('Document OCR text result', self.document.content_text)
        
        # Check OCR data was saved
        self.assertEqual(self.document.ocr_data.full_text, 'Document OCR text result')
