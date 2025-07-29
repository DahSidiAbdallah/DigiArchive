import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Document, createDocument } from '@/services/document.service';

export interface DocumentFormData {
  title: string;
  document_type: string;
  file: File | null;
  description?: string;
  reference_number?: string;
  date?: string;
  tag_ids?: number[];
  department?: number | null;
  folder?: number | null;
}

export const useDocumentUpload = () => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(null);
  
  // Track mount state to prevent state updates after unmount
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const uploadDocument = async (documentData: DocumentFormData) => {
    if (!isAuthenticated) {
      setError('You must be logged in to upload documents');
      return null;
    }

    // Validate required fields
    if (!documentData.title || !documentData.title.trim()) {
      setError('Title is required');
      return null;
    }
    
    if (!documentData.document_type) {
      setError('Document type is required');
      return null;
    }
    
    if (!documentData.file) {
      setError('File is required');
      return null;
    }
    
    // File validation
    if (documentData.file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size exceeds 10MB limit');
      return null;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);
    setUploadedDocument(null);

    try {
      // Convert to Document type
      const document: Document = {
        title: documentData.title.trim(),
        document_type: documentData.document_type,
        file: documentData.file,
        description: documentData.description?.trim() || '',
        reference_number: documentData.reference_number?.trim() || '',
        date: documentData.date,
        tag_ids: documentData.tag_ids || [],
      };

      console.log('Preparing document upload with data:', {
        title: document.title,
        document_type: document.document_type,
        fileName: document.file instanceof File ? document.file.name : 'Unknown file',
        fileSize: document.file instanceof File ? `${(document.file.size / 1024).toFixed(2)} KB` : 'Unknown size',
        tag_ids: document.tag_ids
      });
      
      const response = await createDocument(document);
      
      if (!isMounted.current) return null;
      
      // Validate response has an ID
      if (!response || response.id === undefined || response.id === null) {
        console.error('Document uploaded but response is missing ID:', response);
        setError('Document uploaded but server returned incomplete data');
        setIsLoading(false);
        return null;
      }
      
      console.log('Document upload successful, document ID:', response.id);
      setUploadedDocument(response);
      setSuccess(true);
      setIsLoading(false);
      return response;
    } catch (err: any) {
      console.error('Error uploading document:', err);
      
      if (!isMounted.current) return null;
      
      // Extract error message
      const errorMessage = err.message || 'Failed to upload document';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const resetState = () => {
    if (isMounted.current) {
      setError('');
      setSuccess(false);
      setUploadedDocument(null);
    }
  };

  return {
    uploadDocument,
    isLoading,
    error,
    success,
    uploadedDocument,
    resetState,

  };
};
