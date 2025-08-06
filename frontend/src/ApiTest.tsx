import React from 'react';
import { createRoot } from 'react-dom/client';
import api from './services/api';

// This is a test script to directly test the document update API
async function testDocumentUpdate() {
  // Replace with a valid document ID
  const documentId = 1;
  
  // Replace with valid tag IDs
  const tagIds = [1, 2]; // Example tag IDs
  
  try {
    console.log('Getting document details...');
    // First, get the document to see its current state
    const documentResponse = await api.get(`/documents/${documentId}/`);
    console.log('Current document:', documentResponse.data);
    
    console.log('Getting all tags...');
    // Get all available tags
    const tagsResponse = await api.get('/tags/');
    console.log('Available tags:', tagsResponse.data);
    
    // Test 1: Update with JSON
    try {
      console.log('Testing document update with JSON...');
      const jsonUpdate = {
        title: 'Updated Title via JSON',
        tag_ids: tagIds
      };
      
      const jsonResponse = await api.patch(`/documents/${documentId}/`, jsonUpdate);
      console.log('JSON update successful:', jsonResponse.data);
    } catch (error) {
      console.error('JSON update failed:', error);
      const jsonError = error as any;
      if (jsonError.response) {
        console.error('Error response:', jsonError.response.data);
      }
    }
    
    // Test 2: Update with FormData
    try {
      console.log('Testing document update with FormData...');
      const formData = new FormData();
      formData.append('title', 'Updated Title via FormData');
      
      // Add tag_ids to FormData (this is what we're troubleshooting)
      tagIds.forEach(tagId => {
        formData.append('tag_ids', tagId.toString());
      });
      
      // Log what's in the FormData
      console.log('FormData contents:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      const formDataResponse = await api.patch(
        `/documents/${documentId}/`, 
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      console.log('FormData update successful:', formDataResponse.data);
    } catch (error) {
      console.error('FormData update failed:', error);
      const formDataError = error as any;
      if (formDataError.response) {
        console.error('Error response:', formDataError.response.data);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Create a simple UI to run the test
function TestComponent() {
  const runTest = () => {
    testDocumentUpdate().then(() => {
      console.log('Test complete!');
    });
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Document Update API Test</h1>
      <p>Open the browser console to see the results</p>
      <button 
        style={{ padding: '10px 20px', fontSize: '16px' }}
        onClick={runTest}
      >
        Run API Test
      </button>
    </div>
  );
}

// Mount the test component
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<TestComponent />);
}
