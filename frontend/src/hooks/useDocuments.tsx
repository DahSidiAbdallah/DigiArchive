import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Document, getDocuments } from '@/services/document.service';

export const useDocuments = (initialPage = 1, initialSearch = '', initialFilters = {}) => {
  const { isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const isMounted = useRef(true);

  console.log('useDocuments: Auth state =', isAuthenticated);

  // Reset state when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setDocuments([]);
      setTotalCount(0);
      setHasNext(false);
      setHasPrevious(false);
      setError('');
    }
  }, [isAuthenticated]);

  // Cleanup function to prevent state updates after unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDocuments = useCallback(async (
    pageNumber = page,
    searchQuery = search,
    filterValues = filters
  ) => {
    console.log('fetchDocuments called, isAuthenticated =', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping document fetch');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Fetching documents...');
      const response = await getDocuments(pageNumber, searchQuery, filterValues);
      console.log('Documents response:', response);
      
      // Check if component is still mounted before updating state
      if (!isMounted.current) {
        console.log('Component unmounted, skipping state update');
        return;
      }
      
      // Ensure we have valid data before setting state
      if (response && response.results) {
        console.log(`Setting ${response.results.length} documents`);
        setDocuments(response.results);
        setTotalCount(response.count || 0);
        setHasNext(!!response.next);
        setHasPrevious(!!response.previous);
      } else {
        console.log('No documents in response, setting empty array');
        setDocuments([]);
        setTotalCount(0);
        setHasNext(false);
        setHasPrevious(false);
      }
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      
      if (isMounted.current) {
        setDocuments([]);
        setError(err.response?.data?.detail || 'Failed to load documents');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]); // Only depend on authentication status, not on page/search/filters

  // This effect handles when page, search, or filters change
  useEffect(() => {
    let didCancel = false;
    
    const doFetch = async () => {
      if (isAuthenticated && !didCancel) {
        console.log('Fetching documents due to page/search/filter change');
        // We pass current values directly to avoid dependency on fetchDocuments
        setIsLoading(true);
        try {
          const response = await getDocuments(page, search, filters);
          
          if (!didCancel) {
            if (response && response.results) {
              setDocuments(response.results);
              setTotalCount(response.count || 0);
              setHasNext(!!response.next);
              setHasPrevious(!!response.previous);
            } else {
              setDocuments([]);
              setTotalCount(0);
              setHasNext(false);
              setHasPrevious(false);
            }
          }
        } catch (err: any) {
          if (!didCancel) {
            console.error('Error in effect fetch:', err);
            setDocuments([]);
            setError(err.response?.data?.detail || 'Failed to load documents');
          }
        } finally {
          if (!didCancel) {
            setIsLoading(false);
          }
        }
      }
    };
    
    doFetch();
    
    // Cleanup function to prevent setting state after unmount
    return () => {
      didCancel = true;
    };
  }, [isAuthenticated, page, search, filters]);

  const nextPage = useCallback(() => {
    if (hasNext) {
      setPage(page + 1);
    }
  }, [hasNext, page]);

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      setPage(page - 1);
    }
  }, [hasPrevious, page]);

  const updateSearch = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1); // Reset to first page on new search
  }, []);

  const updateFilters = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on new filters
  }, []);

  const refreshDocuments = useCallback(() => {
    fetchDocuments(page, search, filters);
  }, [fetchDocuments, page, search, filters]);

  return {
    documents,
    isLoading,
    error,
    page,
    totalCount,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
    updateSearch,
    updateFilters,
    refreshDocuments,
  };
};
