import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Document, getDocuments } from '@/services/document.service';

// Add an optional refreshTrigger parameter to force refresh when it changes
export const useDocuments = (initialPage = 1, initialSearch = '', initialFilters = {}, refreshTrigger = 0) => {
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
  
  // DEBUG flag to control excessive logging
  const DEBUG_ENABLED = false;

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
    // Add timestamp to prevent browser caching
    const timestamp = Date.now();
    console.log(`fetchDocuments called at ${timestamp}, isAuthenticated =`, isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping document fetch');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Add timestamp to filter values to prevent caching
      const filtersWithTimestamp = { 
        ...filterValues, 
        _timestamp: timestamp.toString() 
      };
      
      console.log('Fetching documents...');
      const response = await getDocuments(pageNumber, searchQuery, filtersWithTimestamp);
      
      // Check if component is still mounted before updating state
      if (!isMounted.current) {
        console.log('Component unmounted, skipping state update');
        return;
      }
      
      // Ensure we have valid data before setting state
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
  }, [isAuthenticated, page, search, filters]); // Include all dependencies

  // This effect calls fetchDocuments when page, search, filters, or refreshTrigger change
  useEffect(() => {
    if (DEBUG_ENABLED) console.log('useDocuments effect triggered with refreshTrigger:', refreshTrigger);
    
    // Use a debounce timer to prevent rapid-fire API calls
    const debounceTimer = setTimeout(() => {
      if (isAuthenticated) {
        fetchDocuments(page, search, filters);
      }
    }, 300); // 300ms debounce delay
    
    // Cleanup function to cancel any pending debounced calls
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [isAuthenticated, page, search, filters, fetchDocuments, refreshTrigger]);

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
