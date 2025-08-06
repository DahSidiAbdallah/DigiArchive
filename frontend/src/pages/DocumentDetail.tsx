import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Document, getDocument, deleteDocument, processDocumentOCR } from '@/services/document.service'
import DocumentPreview from '@/components/DocumentPreview';
import { useToast } from '@/contexts/ToastContext'
import EditDocumentModal from '@/components/EditDocumentModal'

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingOCR, setProcessingOCR] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Document ID validation and fetch
  useEffect(() => {
    // Create a controller to abort fetch if component unmounts
    const controller = new AbortController();
    
    const fetchDocument = async () => {
      // Validate ID parameter
      if (!id) {
        console.error('Document ID is missing in URL params');
        setError('Document ID is missing');
        setIsLoading(false);
        return;
      }
      
      // Special case: Handle "upload" as a path parameter
      if (id === 'upload') {
        console.error('Invalid path: /documents/upload');
        navigate('/documents', { replace: true });
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      try {
        // Validate and parse ID - use Number instead of parseInt for stricter validation
        const docId = Number(id);
        
        if (isNaN(docId) || docId <= 0 || Math.floor(docId) !== docId) {
          console.error('Invalid document ID format:', id);
          setError(`Invalid document ID format: "${id}"`);
          setIsLoading(false);
          return;
        }
        
        console.log('Fetching document with ID:', docId);
        const documentData = await getDocument(docId);
        
        // Additional validation of returned data
        if (!documentData || !documentData.id) {
          console.error('Invalid document data returned:', documentData);
          setError('Document data is invalid');
          setIsLoading(false);
          return;
        }
        
        // Set document data if component still mounted
        if (!controller.signal.aborted) {
          console.log('Document fetched successfully:', documentData.title);
          setDocument(documentData);
        }
      } catch (err: any) {
        console.error('Error fetching document:', err);
        
        if (!controller.signal.aborted) {
          const errorMessage = err.message || 'Failed to load document details';
          setError(errorMessage);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchDocument();
    
    // Cleanup function
    return () => {
      controller.abort();
    };
  }, [id]);
  
  const handleProcessOCR = async () => {
    if (!document?.id) return;
    
    setProcessingOCR(true);
    
    try {
      await processDocumentOCR(document.id);
      // Refetch the document to get updated OCR status
      const updatedDocument = await getDocument(document.id);
      setDocument(updatedDocument);
    } catch (err) {
      console.error('Error processing OCR:', err);
      setError('Failed to process document with OCR');
    } finally {
      setProcessingOCR(false);
    }
  };
  
  const handleDelete = async () => {
    if (!document?.id) return;
    
    try {
      await deleteDocument(document.id);
      navigate('/documents');
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };
  
  // Format document type for display
  const formatDocumentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  if (isLoading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-3 text-gray-500">Loading document details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    // Different error message for invalid document ID format
    const isInvalidIdError = error.includes("Invalid document ID format");
    
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="rounded-md bg-red-50 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Document</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{isInvalidIdError ? 'The document ID in the URL is invalid' : error}</p>
                {isInvalidIdError && (
                  <p className="mt-1 text-xs text-gray-500">
                    You may have followed an incorrect link or typed a wrong URL.
                  </p>
                )}
              </div>
              <div className="mt-4">
                <button 
                  onClick={() => navigate('/documents')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Back to Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!document) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="text-center py-10">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Document not found</h3>
          <p className="mt-1 text-sm text-gray-500">The document you're looking for doesn't exist or has been removed.</p>
          <div className="mt-6">
            <button 
              onClick={() => navigate('/documents')}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Documents
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Metadata */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-bold text-primary-700 tracking-tight mb-2 break-words">{document.title}</h2>
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span className="inline-flex items-center rounded bg-primary-50 px-2 py-0.5 text-primary-700 font-medium border border-primary-200">
              {formatDocumentType(document.document_type)}
            </span>
            {document.reference_number && (
              <span className="inline-flex items-center rounded bg-gray-50 px-2 py-0.5 text-gray-700 border border-gray-200">
                Ref: {document.reference_number}
              </span>
            )}
            {document.date && (
              <span className="inline-flex items-center rounded bg-gray-50 px-2 py-0.5 text-gray-700 border border-gray-200">
                Date: {formatDate(document.date)}
              </span>
            )}
            <span className="inline-flex items-center rounded bg-gray-50 px-2 py-0.5 text-gray-700 border border-gray-200">
              Uploaded: {formatDate(document.created_at)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          {document.is_ocr_processed ? (
            <span className="inline-flex items-center rounded-md bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              OCR Processed
            </span>
          ) : (
            <button
              type="button"
              onClick={handleProcessOCR}
              disabled={processingOCR}
              className="inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition disabled:opacity-60"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              {processingOCR ? 'Processing...' : 'Process with OCR'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <svg className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Delete
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="overflow-hidden bg-white/90 shadow-xl rounded-2xl border border-gray-100">
        <div className="p-8 space-y-8">
          {document.description && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Description</h3>
              <p className="text-sm text-gray-600">{document.description}</p>
            </div>
          )}
          {document.tags && document.tags.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {document.tags.map(tag => (
                  <span key={tag.id} className="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Document Preview</h3>
            <div className="mt-2">
              {document.id && <DocumentPreview documentId={document.id} />}
            </div>
          </div>
          {document.is_ocr_processed && document.ocr_data && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">OCR Content</h3>
              <div className="mt-2 p-4 bg-gray-50 rounded-md overflow-auto max-h-72">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">{document.ocr_data.full_text}</pre>
              </div>
              <p className="mt-1 text-xs text-gray-500">Processed on: {new Date(document.ocr_data.processed_at).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">Delete Document</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this document? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
