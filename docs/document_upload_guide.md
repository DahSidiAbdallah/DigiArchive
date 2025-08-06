# Document Upload Guide

This document provides instructions for using both the standard and simplified document upload options in DigiArchive.

## Standard Upload Process

1. Log in to the DigiArchive system
2. Navigate to Documents > Upload Document
3. Fill out the document form with:
   - Title (required)
   - Document Type
   - Reference Number (optional)
   - Department and Folder
   - Tags (optional)
   - Description (optional)
   - Date (optional)
4. Upload your document file (PDF, JPG, or PNG)
5. Click "Upload Document"

## Simplified Upload Process

If you're experiencing issues with the standard upload form (particularly related to tags), use the simplified upload option:

1. Open the simplified upload form by visiting: `/simple_document_upload.html`
2. Fill in the required fields:
   - Document Title
   - Document Type
   - Department (optional)
   - Folder (optional)
   - Description (optional)
   - Document File
3. Click "Upload Document"

The simplified form bypasses some of the more complex validation and allows you to upload documents without tags. You can always edit the document later to add tags once it's in the system.

## Troubleshooting Common Upload Issues

### "Incorrect type" Error

If you see an error message like "Incorrect type. Expected pk value, received str." when uploading:

1. Try using the simplified upload form instead
2. Leave the tags field empty in the standard form
3. Upload the document without tags, then add them later

### File Size Limitations

- Maximum file size: 10MB
- If your file is larger, try compressing it or splitting it into multiple documents

### Supported File Types

- PDF documents (.pdf)
- JPEG images (.jpg, .jpeg)
- PNG images (.png)

### Document Processing

After upload, documents are automatically processed with OCR to extract text. This may take a few moments to complete.

## Adding Tags After Upload

To add tags to a document that was uploaded without tags:

1. Navigate to the document list
2. Click on the document to view details
3. Click "Edit Document"
4. Add tags in the edit form
5. Save changes

## Document Organization Best Practices

- Always select the appropriate department and folder
- Use consistent naming conventions for documents
- Add relevant tags to improve searchability
- Include reference numbers when available
- Add descriptive text to help with searching
