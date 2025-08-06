# OCR Setup Instructions

The DigiArchive system uses OCR (Optical Character Recognition) to extract text from document images and PDFs. This allows for full-text searching of all documents in the archive. The OCR functionality is built using Tesseract, an open-source OCR engine.

## System Requirements

### Windows

1. Download and install Tesseract OCR from [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
2. During installation, check the option to add Tesseract to your PATH
3. After installation, verify the path to the Tesseract executable (e.g., `C:\Program Files\Tesseract-OCR\tesseract.exe`)
4. Add the path to your environment settings in the .env file:
   ```
   TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
   ```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y tesseract-ocr
sudo apt install -y poppler-utils
```

### macOS

```bash
brew install tesseract
brew install poppler
```

## Backend Configuration

The OCR functionality is already set up in the project, using:

1. `pytesseract` - Python wrapper for Tesseract OCR
2. `pdf2image` - For converting PDFs to images before OCR processing

## OCR Features in DigiArchive

The system implements the following OCR features:

1. **Automatic OCR Processing**: 
   - OCR is automatically triggered when a new document is uploaded
   - Processing happens asynchronously via Celery tasks

2. **Manual OCR Processing**: 
   - Documents can be manually processed using the API endpoint:
   - `POST /api/documents/{document_id}/process_ocr/`

3. **OCR Text Retrieval**: 
   - Full OCR text can be retrieved via API:
   - `GET /api/documents/{document_id}/ocr_text/`

4. **Search Integration**: 
   - Full text search includes OCR content
   - Both the document content preview and full OCR text are searchable

## Additional Language Support

By default, Tesseract uses English for OCR. To add support for additional languages:

### Windows

1. Download language data files from [Tesseract GitHub repo](https://github.com/tesseract-ocr/tessdata)
2. Place the language data files in the `tessdata` directory within your Tesseract installation

### Linux

```bash
sudo apt install -y tesseract-ocr-all
# Or for specific languages:
# sudo apt install -y tesseract-ocr-fra  # French
# sudo apt install -y tesseract-ocr-ara  # Arabic
```

### macOS

```bash
brew install tesseract-lang
```

## Troubleshooting

If you encounter issues with OCR processing:

1. Verify Tesseract is installed correctly and available in PATH
2. Check the Tesseract version: `tesseract --version`
3. Make sure the `TESSERACT_CMD` setting in `.env` or `settings.py` points to the correct executable
4. For PDF processing, ensure poppler-utils (Linux/macOS) or poppler (Windows) is installed

## Performance Considerations

OCR processing can be resource-intensive, especially for large documents or batches of documents. Consider:

1. Adjusting Celery worker settings for better concurrency
2. Setting up a separate worker queue for OCR tasks
3. Using a more powerful server for OCR processing in production environments
