import React, { useState, useEffect } from 'react';

interface OCRTextProps {
  documentId: number;
  apiBaseUrl?: string;
}

const DocumentOCRView: React.FC<OCRTextProps> = ({ documentId, apiBaseUrl = '/api' }) => {
  const [ocrText, setOcrText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Fetch OCR text
  const fetchOCRText = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/documents/${documentId}/ocr_text/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      setOcrText(data.full_text);
      setError(null);
    } catch (err: any) {
      console.error('OCR fetch error:', err);
      setError('Failed to load OCR data. It may not be available for this document.');
      setOcrText('');
    } finally {
      setLoading(false);
    }
  };

  // Process OCR
  const processOCR = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`${apiBaseUrl}/documents/${documentId}/process_ocr/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      setError('OCR processing initiated. Please check back in a few moments.');
      // Set a timer to refresh the OCR data after a delay
      setTimeout(fetchOCRText, 5000);
    } catch (err: any) {
      console.error('OCR process error:', err);
      setError('Failed to initiate OCR processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchOCRText();
    }
  }, [documentId]);

  return (
    <div className="mt-2">
      {loading ? (
        <div className="flex justify-center items-center p-8 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-3">
            <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-600">Chargement du texte OCR...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-gray-50 rounded-md">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          {error.includes('Failed to load OCR data') && (
            <button 
              onClick={processOCR} 
              disabled={isProcessing}
              className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
                isProcessing 
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                  : 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Traitement...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Traiter avec OCR
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-md overflow-auto max-h-72">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{ocrText || 'Aucun texte n\'a été extrait lors du traitement OCR.'}</pre>
          {ocrText && <p className="mt-3 text-xs text-gray-500">Le traitement OCR a extrait {ocrText.split(' ').length} mots.</p>}
        </div>
      )}
    </div>
  );
};

export default DocumentOCRView;
