/**
 * Search service for advanced document search.
 */
import api from './api';
import { Document, DocumentListResponse } from './document.service';

export interface SearchParams {
  q?: string;
  document_type?: string;
  date_from?: string;
  date_to?: string;
  is_ocr_processed?: boolean;
  tags?: number[];
  uploaded_by?: number;
  ordering?: string;
  page?: number;
  department_id?: number;
  folder_id?: number;
  content_query?: string;
  include_related_details?: boolean;  // Added to retrieve full department and folder info
}

export interface SearchSuggestion {
  text: string;
  type: 'document_title' | 'tag' | 'reference_number';
}

/**
 * Perform advanced search for documents
 */
export const advancedSearch = async (params: SearchParams): Promise<DocumentListResponse> => {
  // Build query string
  let queryParams = new URLSearchParams();
  
  if (params.q) {
    queryParams.append('q', params.q);
  }
  
  if (params.document_type) {
    queryParams.append('document_type', params.document_type);
  }
  
  if (params.date_from) {
    queryParams.append('date_from', params.date_from);
  }
  
  if (params.date_to) {
    queryParams.append('date_to', params.date_to);
  }
  
  if (params.is_ocr_processed !== undefined) {
    queryParams.append('is_ocr_processed', params.is_ocr_processed.toString());
  }
  
  if (params.tags && params.tags.length > 0) {
    params.tags.forEach(tagId => {
      queryParams.append('tags', tagId.toString());
    });
  }
  
  if (params.uploaded_by) {
    queryParams.append('uploaded_by', params.uploaded_by.toString());
  }
  
  if (params.ordering) {
    queryParams.append('ordering', params.ordering);
  }
  
  if (params.department_id) {
    queryParams.append('department_id', params.department_id.toString());
  }
  
  if (params.folder_id) {
    queryParams.append('folder_id', params.folder_id.toString());
  }
  
  if (params.content_query) {
    queryParams.append('content_query', params.content_query);
  }
  
  if (params.page) {
    queryParams.append('page', params.page.toString());
  }
  
  if (params.include_related_details) {
    queryParams.append('include_related_details', 'true');
  }
  
  const response = await api.get<DocumentListResponse>(`/search/advanced/?${queryParams.toString()}`);
  return response.data;
};

/**
 * Get search suggestions based on partial query
 */
export const getSearchSuggestions = async (query: string, limit = 10): Promise<SearchSuggestion[]> => {
  if (!query || query.length < 2) {
    return [];
  }
  
  const queryParams = new URLSearchParams({
    q: query,
    limit: limit.toString()
  });
  
  const response = await api.get<SearchSuggestion[]>(`/search/suggestions/?${queryParams.toString()}`);
  return response.data;
};
