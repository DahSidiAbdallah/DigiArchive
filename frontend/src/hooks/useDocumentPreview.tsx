import { useState, useEffect, useRef } from 'react';
import { Document as DocumentType } from '@/services/document.service';
import { getDocument } from '@/services/document.service';

export const useDocumentPreview = (documentId?: number) => {
  const [document, setDocument] = useState<DocumentType | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);


// Always set isMounted.current = true at the start of each effect
useEffect(() => {
  isMounted.current = true;
  return () => {
    isMounted.current = false;
  };
}, []);

useEffect(() => {
  isMounted.current = true;
  // Validate document ID
  if (!documentId || isNaN(documentId) || documentId <= 0) {
    setError('Invalid document ID');
    return;
  }

  const fetchDocument = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Fetching document for preview with ID: ${documentId}`);
      // Using the service function instead of calling API directly
      const documentData = await getDocument(documentId);
      
      // Check if component is still mounted
      if (!isMounted.current) return;
      
      setDocument(documentData);

      // Generate preview URL based on the file type
      if (documentData.file) {
        // Convert File object to URL if needed
        const fileUrl = typeof documentData.file === 'string' 
          ? documentData.file 
          : URL.createObjectURL(documentData.file);
        setPreviewUrl(fileUrl);
      }
    } catch (err: any) {
      console.error('Error fetching document for preview:', err);
      
      if (isMounted.current) {
        setError(err.message || 'Failed to load document preview');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  fetchDocument();
  return () => {
    isMounted.current = false;
  };
}, [documentId]);

  const downloadDocument = () => {
    if (!document?.file || !previewUrl) {
      console.error('Cannot download document: Missing file or URL');
      setError('Download failed: The document file is not available');
      return;
    }
    
    try {
      // Create an anchor element and set the href to the file URL
      const link = window.document.createElement('a');
      link.href = previewUrl;
      
      // Set the download attribute with a fallback filename if title is missing
      const fileName = document.title || `document-${documentId}`;
      link.setAttribute('download', fileName);
      
      // Temporarily add to DOM, click, and then remove
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      console.log(`Document download initiated: ${fileName}`);
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download the document');
    }
  };
  
  return {
    document,
    previewUrl,
    isLoading,
    error,
    downloadDocument
  };
};
