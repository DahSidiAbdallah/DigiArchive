import { useState, useEffect } from 'react';
import api from './services/api';
import { useAuth } from './hooks/useAuth';

// This is a test component we'll mount at a specific route
export function ApiTestComponent() {
  const [documentId, setDocumentId] = useState<number>(1);
  const [tagIds, setTagIds] = useState<number[]>([1, 2]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const { isAuthenticated } = useAuth();
  
  // Load documents and tags when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsResponse, tagsResponse] = await Promise.all([
          api.get('/documents/'),
          api.get('/tags/')
        ]);
        
        setDocuments(docsResponse.data.results || []);
        setTags(tagsResponse.data || []);
        
        // Set a default document ID if we have documents
        if (docsResponse.data.results?.length > 0) {
          setDocumentId(docsResponse.data.results[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);
  // Function to test document update with JSON
  const testJsonUpdate = async () => {
    if (documentId === 0) {
      alert('No valid document ID selected');
      return;
    }
    
    try {
      console.log('Testing JSON update...');
      const jsonUpdate = {
        title: 'Updated Title via JSON ' + new Date().toISOString(),
        tag_ids: tagIds
      };
      
      const response = await api.patch(`/documents/${documentId}/`, jsonUpdate);
      console.log('JSON update successful:', response.data);
      alert('JSON update successful!');
    } catch (error: any) {
      console.error('JSON update failed:', error);
      console.error('Error response:', error.response?.data);
      alert('JSON update failed: ' + (error.response?.data?.detail || error.message));
    }
  };
  
  // Function to test document update with FormData
  const testFormDataUpdate = async () => {
    if (documentId === 0) {
      alert('No valid document ID selected');
      return;
    }
    
    try {
      console.log('Testing FormData update...');
      const formData = new FormData();
      formData.append('title', 'Updated Title via FormData ' + new Date().toISOString());
      
      // Add tag_ids to FormData
      tagIds.forEach(tagId => {
        formData.append('tag_ids', tagId.toString());
      });
      
      // Log what's in the FormData
      console.log('FormData contents:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      const response = await api.patch(
        `/documents/${documentId}/`, 
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      console.log('FormData update successful:', response.data);
      alert('FormData update successful!');
    } catch (error: any) {
      console.error('FormData update failed:', error);
      console.error('Error response:', error.response?.data);
      alert('FormData update failed: ' + (error.response?.data?.detail || error.message));
    }
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Document Update API Test</h1>
      <p>This page allows you to test different methods of updating documents</p>
      
      {!isAuthenticated && (
        <div style={{ color: 'red', padding: '10px', border: '1px solid red', marginBottom: '20px' }}>
          <p><strong>Please log in first to use this tool!</strong></p>
        </div>
      )}
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Document Selection</h2>
        <p>Select a document to update:</p>
        <select 
          value={documentId}
          onChange={(e) => setDocumentId(parseInt(e.target.value))}
          style={{ padding: '5px', marginBottom: '10px', minWidth: '300px' }}
        >
          <option value="0">-- Select a document --</option>
          {documents.map(doc => (
            <option key={doc.id} value={doc.id}>
              {doc.id}: {doc.title} ({doc.document_type})
            </option>
          ))}
        </select>
        
        <h3>Tag Selection</h3>
        <p>Select tags to add to the document:</p>
        <div style={{ marginBottom: '10px' }}>
          {tags.map(tag => (
            <label key={tag.id} style={{ display: 'block', marginBottom: '5px' }}>
              <input 
                type="checkbox"
                checked={tagIds.includes(tag.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setTagIds(prev => [...prev, tag.id]);
                  } else {
                    setTagIds(prev => prev.filter(id => id !== tag.id));
                  }
                }}
              /> {tag.name}
            </label>
          ))}
        </div>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Test JSON Update</h2>
        <p>This will update a document using a JSON request</p>
        <button 
          style={{ padding: '10px 20px', fontSize: '16px', marginRight: '10px' }} 
          onClick={testJsonUpdate}
          disabled={!isAuthenticated || documentId === 0}
        >
          Test JSON Update
        </button>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Test FormData Update</h2>
        <p>This will update a document using a FormData request</p>
        <button 
          style={{ padding: '10px 20px', fontSize: '16px' }} 
          onClick={testFormDataUpdate}
          disabled={!isAuthenticated || documentId === 0}
        >
          Test FormData Update
        </button>
      </div>
      
      <div>
        <p><strong>Check the browser console for detailed logs!</strong></p>
      </div>
    </div>
  );
}
