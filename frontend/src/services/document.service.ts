/**
 * Document service for handling document operations.
 */
import api from './api';
import { Department, Folder } from '@/types/department.types';

export interface Tag {
  id?: number;
  name: string;
}

export interface Document {
  id?: number;
  title: string;
  document_type: string;
  department?: number | Department | null;
  folder?: number | Folder | null;
  file?: File | string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  description?: string;
  reference_number?: string;
  date?: string;
  upload_date?: string;
  tags?: Tag[];
  tag_ids?: number[];
  uploaded_by?: number;
  uploaded_by_username?: string;
  created_at?: string;
  updated_at?: string;
  content_text?: string;
  is_ocr_processed?: boolean;
  ocr_data?: {
    id: number;
    full_text: string;
    processed_at: string;
  };
  status?: string;
}

export interface DocumentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Document[];
}

/**
 * Get all documents with pagination
 */
export const getDocuments = async (
  page = 1,
  search?: string,
  filters?: Record<string, string | number | null | undefined>
): Promise<DocumentListResponse> => {
  // Validate page number
  const validPage = isNaN(Number(page)) ? 1 : Math.max(1, Number(page));
  
  // Build the URL with proper query parameters
  const params = new URLSearchParams();
  params.append('page', validPage.toString());
  
  if (search) {
    params.append('search', search);
  }
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
  }
  
  const url = `/documents/?${params.toString()}`;
  
  try {
    // Get the token to check if we're properly authenticated
    const token = localStorage.getItem('token');
    console.log('Document API call to:', url);
    console.log('Has authentication token:', !!token);
    
    if (!token) {
      console.warn('Making document API call without authentication token');
      throw new Error('No authentication token available');
    }
    
    const response = await api.get<DocumentListResponse>(url);
    
    console.log('Document API response:', {
      status: response.status,
      data: response.data,
      dataType: typeof response.data
    });
    
    // Validate response structure
    if (!response.data) {
      console.error('Empty response from API');
      throw new Error('Empty response from API');
    }

    // Handle the case where the response is an array instead of the expected object
    if (Array.isArray(response.data)) {
      console.log('API returned array instead of paginated response object, adapting...');
      // Convert the array to the expected format
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data
      };
    }
    
    // Standard response validation
    if (!Array.isArray(response.data.results)) {
      console.error('Invalid response structure from API:', response.data);
      throw new Error('Invalid response from API - missing results array');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching documents:', error.response || error);
    
    // Check if error is due to authentication
    if (error.response?.status === 401) {
      throw new Error('Authentication error. Please log in again.');
    }
    
    // For development debugging, still throw error
    // Use typeof window to check if we're in a browser environment instead of process.env
    const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    if (isDevelopment) {
      throw error;
    }
    
    // In production, return empty response to avoid breaking the UI
    return {
      count: 0,
      next: null,
      previous: null,
      results: []
    };
  }
};

/**
 * Get a document by ID
 */
export const getDocument = async (id: number): Promise<Document> => {
  // Validate ID before making the API call
  if (isNaN(id) || id <= 0) {
    console.error('Invalid document ID:', id);
    throw new Error('Invalid document ID');
  }
  
  try {
    // Verify authentication
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    console.log(`Fetching document with ID ${id}`);
    const response = await api.get<Document>(`/documents/${id}/`);
    
    // Validate that the response contains document data
    if (!response.data || !response.data.id) {
      console.error('Document API returned invalid data:', response.data);
      throw new Error('Invalid document data received');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching document:', error.response || error);
    
    // Specific error for 404
    if (error.response?.status === 404) {
      throw new Error('Document not found');
    }
    
    // Authentication error
    if (error.response?.status === 401) {
      throw new Error('Authentication error. Please log in again.');
    }
    
    // General error
    throw new Error(error.response?.data?.detail || 'Failed to load document');
  }
};

/**
 * Create a new document
 */
export const createDocument = async (document: Document): Promise<Document> => {
  try {
    // Check for authentication
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Validate required fields
    if (!document.title || !document.document_type) {
      throw new Error('Title and document type are required');
    }

    // Check file exists
    if (!document.file) {
      throw new Error('A file is required for document upload');
    }

    // Handle file upload with FormData
    if (document.file instanceof File) {
      const formData = new FormData();
      
      // Log the form data being built
      console.log('Building FormData for document upload:', {
        title: document.title,
        document_type: document.document_type,
        file: document.file.name,
        fileSize: document.file.size,
      });
      
      // Add all document fields to form data
      Object.entries(document).forEach(([key, value]) => {
        if (key === 'file') {
          formData.append(key, value as File);
        } else if (key === 'tag_ids' && Array.isArray(value)) {
          value.forEach(tagId => {
            if (tagId !== undefined && tagId !== null) {
              formData.append('tag_ids', tagId.toString());
            }
          });
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      try {
        console.log('Sending document API request to /documents/');
        
        // Make API call with FormData
        const response = await api.post<Document>('/documents/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Log the raw response for debugging
        console.log('Document upload raw response:', {
          status: response.status,
          data: response.data,
          dataType: typeof response.data
        });

        // Validate response data
        if (!response.data) {
          throw new Error('No data received from server');
        }

        // Handle case where response is an array (some APIs return arrays)
        let documentData = response.data;
        if (Array.isArray(response.data)) {
          if (response.data.length > 0) {
            documentData = response.data[0];
            console.log('Server returned array, using first item:', documentData);
          } else {
            throw new Error('Server returned empty array');
          }
        }

        // Ensure we have a valid ID in the response
        if (documentData.id === undefined || documentData.id === null) {
          console.error('Document created but missing ID in response:', documentData);
          throw new Error('Document created but server did not return a valid ID');
        }
        
        console.log('Document upload successful, processed response:', {
          status: response.status,
          data: { 
            id: documentData.id,
            title: documentData.title
          }
        });
        
        return documentData;
        
        return response.data;
      } catch (error: any) {
        console.error('Document upload error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          stack: error.stack
        });
        
        // Network error (no response)
        if (!error.response) {
          console.error('Network error (no response received)');
          throw new Error('Network error. Check your internet connection and try again.');
        }
        
        // Check for specific backend error messages
        const backendError = error.response?.data;
        if (backendError) {
          // If backend returned structured errors
          if (typeof backendError === 'object') {
            const errorMessages: string[] = [];
            
            // Extract error messages from the response
            Object.entries(backendError).forEach(([field, errors]) => {
              if (Array.isArray(errors)) {
                errors.forEach(err => errorMessages.push(`${field}: ${err}`));
              } else if (typeof errors === 'string') {
                errorMessages.push(`${field}: ${errors}`);
              }
            });
            
            if (errorMessages.length > 0) {
              throw new Error(errorMessages.join(', '));
            }
          }
        }
        
        // Handle common HTTP error codes with user-friendly messages
        switch (error.response?.status) {
          case 400:
            throw new Error('Le formulaire contient des erreurs. Veuillez vérifier les données saisies.');
          case 401:
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          case 403:
            throw new Error('Vous n\'avez pas les permissions nécessaires pour télécharger des documents.');
          case 404:
            throw new Error('Le service de téléchargement n\'est pas disponible.');
          case 413:
            throw new Error('Fichier trop volumineux. Taille maximale dépassée.');
          case 415:
            throw new Error('Format de fichier non supporté. Veuillez télécharger un type de fichier différent.');
          case 429:
            throw new Error('Trop de téléchargements. Veuillez réessayer dans quelques minutes.');
          case 500:
          case 502:
          case 503:
          case 504:
            throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
          default:
            throw new Error(error.response?.data?.detail || 'Échec du téléchargement du document. Veuillez réessayer.');
        }
      }
    } else {
      // Not a file object
      throw new Error('Invalid file format for upload');
    }
  } catch (error: any) {
    console.error('Document creation failed:', error.message);
    throw error; // Re-throw to let the component handle it
  }
};

/**
 * Update an existing document
 */
export const updateDocument = async (id: number, document: Partial<Document>): Promise<Document> => {
  // Always use FormData for consistent handling on the server side
  const formData = new FormData();
  
  // Log the document object being sent
  console.log('Updating document with data:', document);
  
  // Process all fields properly
  Object.entries(document).forEach(([key, value]) => {
    // Skip undefined or null values
    if (value === undefined || value === null) {
      return;
    }
    
    // Handle file uploads
    if (key === 'file' && value instanceof File) {
      formData.append(key, value);
    } 
    // Handle tag_ids specially - ensure they are always sent as numbers
    else if (key === 'tag_ids' && Array.isArray(value)) {
      // Clear existing tags if empty array
      if (value.length === 0) {
        // For Django REST Framework, sending an empty list requires this format
        formData.append('tag_ids', ''); 
        console.log('Sending empty tag_ids array');
      } else {
        // Convert and validate all tag IDs before appending
        const numericTagIds = value
          .map(tagId => {
            // Convert to number if it's a string
            if (typeof tagId === 'string') {
              return parseInt(tagId, 10);
            }
            return tagId;
          })
          // Filter out any NaN values or non-numbers
          .filter(tagId => typeof tagId === 'number' && !isNaN(tagId));
        
        console.log('Numeric tag IDs after conversion:', numericTagIds);
          
        // Add each numeric tag ID to the form data
        numericTagIds.forEach(tagId => {
          formData.append('tag_ids', tagId.toString());
          console.log(`Adding tag_id: ${tagId} (${typeof tagId})`);
        });
      }
    } 
    // Handle date fields properly
    else if (key === 'date' && value) {
      formData.append(key, value.toString());
    }
    // Handle department and folder - allow null values
    else if (key === 'department' || key === 'folder') {
      if (value === null) {
        formData.append(key, '');
      } else {
        formData.append(key, value.toString());
      }
    }
    // Handle document_type - send value directly
    else if (key === 'document_type') {
      formData.append(key, value.toString());
      console.log(`Adding document_type: "${value}"`);
    }
    // Handle all other fields
    else {
      formData.append(key, value.toString());
    }
  });

  // Log the FormData for debugging (FormData can't be directly logged)
  console.log('FormData entries:');
  for (const pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }
  
  try {
    // Send the request with proper headers
    const response = await api.patch<Document>(`/documents/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Document update successful:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating document:', error);
    
    // Log detailed error information if available
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      console.error('Error response headers:', error.response.headers);
    }
    
    throw error; // Re-throw for component handling
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (id: number): Promise<void> => {
  await api.delete(`/documents/${id}/`);
};

/**
 * Trigger OCR processing for a document
 */
export const processDocumentOCR = async (id: number): Promise<void> => {
  await api.post(`/documents/${id}/process_ocr/`);
};

/**
 * Get all tags
 */
export const getTags = async (): Promise<Tag[]> => {
  const response = await api.get<Tag[]>('/tags/');
  return response.data;
};

/**
 * Create a new tag
 */
export const createTag = async (tag: Tag): Promise<Tag> => {
  const response = await api.post<Tag>('/tags/', tag);
  return response.data;
};
