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
    <div className="ocr-view-container" style={{ 
      padding: '1rem', 
      margin: '1rem 0', 
      maxHeight: '500px', 
      overflow: 'auto',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3 style={{ marginTop: 0 }}>OCR Text Content</h3>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <div>Loading OCR data...</div>
        </div>
      ) : error ? (
        <div>
          <p style={{ color: 'red' }}>{error}</p>
          {error.includes('Failed to load OCR data') && (
            <button 
              onClick={processOCR} 
              disabled={isProcessing}
              style={{
                padding: '8px 16px',
                backgroundColor: isProcessing ? '#cccccc' : '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
            >
              {isProcessing ? 'Processing...' : 'Process with OCR'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: 'monospace', 
          fontSize: '0.9rem',
          backgroundColor: 'white',
          padding: '1rem',
          border: '1px solid #eaeaea',
          borderRadius: '4px' 
        }}>
          {ocrText || 'No text was extracted during OCR processing.'}
        </div>
      )}
    </div>
  );
};

export default DocumentOCRView;
