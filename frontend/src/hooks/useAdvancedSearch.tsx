import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Document } from '@/services/document.service';
import { SearchParams, advancedSearch, getSearchSuggestions, SearchSuggestion } from '@/services/search.service';

export const useAdvancedSearch = (initialParams: SearchParams = {}) => {
  const { isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [params, setParams] = useState<SearchParams>(initialParams);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [page, setPage] = useState(initialParams.page || 1);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const performSearch = async (searchParams: SearchParams = params) => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await advancedSearch({
        ...searchParams,
        page
      });
      
      setDocuments(response.results);
      setTotalCount(response.count);
      setHasNext(!!response.next);
      setHasPrevious(!!response.previous);
    } catch (err) {
      console.error('Error performing search:', err);
      setError('Failed to search documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial search and when search params change
  useEffect(() => {
    if (isAuthenticated) {
      performSearch();
    }
  }, [isAuthenticated, page, params]);

  // Update search parameters
  const updateSearchParams = (newParams: SearchParams) => {
    // Reset to first page when search parameters change
    setPage(1);
    setParams({ ...params, ...newParams });
  };

  // Navigation
  const nextPage = () => {
    if (hasNext) {
      setPage(page + 1);
    }
  };

  const previousPage = () => {
    if (hasPrevious) {
      setPage(page - 1);
    }
  };

  // Load suggestions for a query
  const loadSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);

    try {
      const results = await getSearchSuggestions(query);
      setSuggestions(results);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  return {
    documents,
    isLoading,
    error,
    totalCount,
    page,
    hasNext,
    hasPrevious,
    suggestions,
    suggestionsLoading,
    updateSearchParams,
    performSearch,
    nextPage,
    previousPage,
    loadSuggestions
  };
};
