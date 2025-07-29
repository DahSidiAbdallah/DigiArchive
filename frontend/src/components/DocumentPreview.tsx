import { useState } from 'react';
import { useDocumentPreview } from '@/hooks/useDocumentPreview';

interface DocumentPreviewProps {
  documentId: number;
}

export default function DocumentPreview({ documentId }: DocumentPreviewProps) {
  const { document, previewUrl, isLoading, error, downloadDocument } = useDocumentPreview(documentId);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getFileType = () => {
    if (!previewUrl) return 'unknown';
    
    if (previewUrl.toLowerCase().endsWith('.pdf')) {
      return 'pdf';
    } else if (
      previewUrl.toLowerCase().endsWith('.jpg') || 
      previewUrl.toLowerCase().endsWith('.jpeg') || 
      previewUrl.toLowerCase().endsWith('.png')
    ) {
      return 'image';
    } else {
      return 'unknown';
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center max-w-md px-4">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="mt-2 text-sm font-medium text-red-800">{error}</p>
          <p className="mt-1 text-xs text-gray-500">Please try again or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  if (!document || !previewUrl) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <p className="text-gray-500">No preview available</p>
        </div>
      </div>
    );
  }

  const fileType = getFileType();

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black p-4' : 'rounded-lg border border-gray-200'}`}>
      <div className="absolute top-2 right-2 flex space-x-2 z-10">
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h1V8a1 1 0 0 1 2 0v2zm5-9a1 1 0 0 1 1 1v1h1a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm0 16a1 1 0 0 1-1-1v-1h-1a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1zm9-9a1 1 0 0 1-1 1h-1v1a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H6.414l2.293 2.293a1 1 0 1 1-1.414 1.414L5 6.414V8a1 1 0 0 1-2 0V4zm14 0a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V6.414l-2.293 2.293a1 1 0 1 1-1.414-1.414L14.586 5H13a1 1 0 0 1 0-2h4zm-1 13a1 1 0 0 1-1 1h-4a1 1 0 0 1 0-2h1.586l-2.293-2.293a1 1 0 1 1 1.414-1.414L14 14.586V13a1 1 0 0 1 2 0v4zm-14 0a1 1 0 0 1-1-1v-4a1 1 0 0 1 2 0v1.586l2.293-2.293a1 1 0 1 1 1.414 1.414L5.414 15H7a1 1 0 0 1 0 2H3z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <button
          onClick={downloadDocument}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
          title="Download"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm3.293-7.707a1 1 0 0 1 1.414 0L9 10.586V3a1 1 0 1 1 2 0v7.586l1.293-1.293a1 1 0 1 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className={`${isFullscreen ? 'h-full' : 'h-[500px]'} overflow-hidden`}>
        {fileType === 'pdf' && (
          <iframe
            src={`${previewUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full"
            title={document.title}
          />
        )}
        {fileType === 'image' && (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <img
              src={previewUrl}
              alt={document.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        {fileType === 'unknown' && (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Preview not available</p>
            <button
              onClick={downloadDocument}
              className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
