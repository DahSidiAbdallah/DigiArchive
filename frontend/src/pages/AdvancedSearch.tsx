import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { SearchParams, SearchSuggestion } from '@/services/search.service';
import { getTags, Tag } from '@/services/document.service';
import DocumentListItem from '@/components/DocumentListItem';

export default function AdvancedSearch() {
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isProcessed, setIsProcessed] = useState<boolean | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [ordering, setOrdering] = useState('-created_at');
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useAdvancedSearch();

  // Load available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await getTags();
        setAvailableTags(tags);
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };
    
    fetchTags();
  }, []);

  // Handle search suggestions
  useEffect(() => {
    if (searchInput.length >= 2) {
      loadSuggestions(searchInput);
    } else {
      setShowSuggestions(false);
    }
  }, [searchInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Apply filters
  const handleSearch = () => {
    const searchParams: SearchParams = {};
    
    if (searchInput) searchParams.q = searchInput;
    if (selectedType) searchParams.document_type = selectedType;
    if (dateFrom) searchParams.date_from = dateFrom;
    if (dateTo) searchParams.date_to = dateTo;
    if (isProcessed !== undefined) searchParams.is_ocr_processed = isProcessed;
    if (selectedTags.length > 0) searchParams.tags = selectedTags;
    if (ordering) searchParams.ordering = ordering;
    
    updateSearchParams(searchParams);
  };

  // Reset all filters
  const handleReset = () => {
    setSearchInput('');
    setSelectedType('');
    setDateFrom('');
    setDateTo('');
    setIsProcessed(undefined);
    setSelectedTags([]);
    setOrdering('-created_at');
    
    updateSearchParams({});
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchInput(suggestion.text);
    setShowSuggestions(false);
    
    // If it's a tag suggestion, also add it to selected tags
    if (suggestion.type === 'tag') {
      const tag = availableTags.find(t => t.name === suggestion.text);
      if (tag && tag.id && !selectedTags.includes(tag.id)) {
        setSelectedTags([...selectedTags, tag.id]);
      }
    }
  };

  // Handle tag selection
  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => Number(option.value));
    setSelectedTags(selectedOptions);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Advanced Search
          </h2>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <div className="px-4 py-6 sm:p-8">
          {/* Search Form */}
          <div className="space-y-6">
            {/* Text Search with Suggestions */}
            <div className="relative">
              <label htmlFor="search" className="block text-sm font-medium leading-6 text-gray-900">
                Search
              </label>
              <div className="mt-2 relative">
                <input
                  type="text"
                  name="search"
                  id="search"
                  placeholder="Search in titles, content, reference numbers..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowSuggestions(e.target.value.length >= 2);
                  }}
                  onFocus={() => setShowSuggestions(searchInput.length >= 2)}
                  className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                />
                
                {/* Suggestions dropdown */}
                {showSuggestions && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  >
                    {suggestionsLoading ? (
                      <div className="py-2 px-3 text-gray-500">Loading suggestions...</div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((suggestion, index) => (
                        <div
                          key={`${suggestion.type}-${index}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="relative cursor-pointer select-none py-2 px-3 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <span className="font-normal text-gray-900">{suggestion.text}</span>
                            <span className="ml-2 text-xs text-gray-500">
                              {suggestion.type === 'document_title' ? 'Title' : 
                               suggestion.type === 'tag' ? 'Tag' : 
                               'Reference'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-2 px-3 text-gray-500">No suggestions found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
              {/* Document Type */}
              <div className="sm:col-span-2">
                <label htmlFor="document_type" className="block text-sm font-medium leading-6 text-gray-900">
                  Document Type
                </label>
                <div className="mt-2">
                  <select
                    id="document_type"
                    name="document_type"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">All document types</option>
                    <option value="invoice">Invoices</option>
                    <option value="bill_of_lading">Bills of Lading</option>
                    <option value="transfer_request">Transfer Requests</option>
                    <option value="contract">Contracts</option>
                    <option value="report">Reports</option>
                    <option value="memo">Memos</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Date From */}
              <div className="sm:col-span-2">
                <label htmlFor="date_from" className="block text-sm font-medium leading-6 text-gray-900">
                  Date From
                </label>
                <div className="mt-2">
                  <input
                    type="date"
                    name="date_from"
                    id="date_from"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              {/* Date To */}
              <div className="sm:col-span-2">
                <label htmlFor="date_to" className="block text-sm font-medium leading-6 text-gray-900">
                  Date To
                </label>
                <div className="mt-2">
                  <input
                    type="date"
                    name="date_to"
                    id="date_to"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              {/* OCR Status */}
              <div className="sm:col-span-2">
                <label htmlFor="ocr_status" className="block text-sm font-medium leading-6 text-gray-900">
                  OCR Status
                </label>
                <div className="mt-2">
                  <select
                    id="ocr_status"
                    name="ocr_status"
                    value={isProcessed === undefined ? '' : isProcessed ? 'processed' : 'unprocessed'}
                    onChange={(e) => {
                      if (e.target.value === '') setIsProcessed(undefined);
                      else setIsProcessed(e.target.value === 'processed');
                    }}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  >
                    <option value="">Any</option>
                    <option value="processed">Processed</option>
                    <option value="unprocessed">Unprocessed</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="sm:col-span-2">
                <label htmlFor="tags" className="block text-sm font-medium leading-6 text-gray-900">
                  Tags
                </label>
                <div className="mt-2">
                  <select
                    id="tags"
                    name="tags"
                    multiple
                    value={selectedTags.map(String)}
                    onChange={handleTagChange}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  >
                    {availableTags.map(tag => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple tags</p>
              </div>

              {/* Sort Order */}
              <div className="sm:col-span-2">
                <label htmlFor="ordering" className="block text-sm font-medium leading-6 text-gray-900">
                  Sort By
                </label>
                <div className="mt-2">
                  <select
                    id="ordering"
                    name="ordering"
                    value={ordering}
                    onChange={(e) => setOrdering(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  >
                    <option value="-created_at">Newest First</option>
                    <option value="created_at">Oldest First</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="-title">Title (Z-A)</option>
                    <option value="date">Date (Ascending)</option>
                    <option value="-date">Date (Descending)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-x-3">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-md bg-white py-2 px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSearch}
                className="rounded-md bg-primary-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Search
              </button>
            </div>
          </div>

          {/* Search Results */}
          <div className="mt-8">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Results {totalCount > 0 ? `(${totalCount})` : ''}
            </h3>

            {isLoading ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm">Searching documents...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <p className="text-red-500 text-sm">{error}</p>
                <button 
                  onClick={() => performSearch()}
                  className="mt-2 text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  Try again
                </button>
              </div>
            ) : documents.length === 0 ? (
              <div className="overflow-hidden bg-white shadow sm:rounded-md mt-4">
                <ul role="list" className="divide-y divide-gray-200">
                  <li className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-500">
                        No documents found matching your search criteria.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <div className="overflow-hidden bg-white shadow sm:rounded-md mt-4">
                  <ul role="list" className="divide-y divide-gray-200">
                    {documents.map((document) => (
                      <DocumentListItem key={document.id} document={document} />
                    ))}
                  </ul>
                </div>
                
                {/* Pagination */}
                {totalCount > 0 && (
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={previousPage}
                        disabled={!hasPrevious}
                        className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                          hasPrevious 
                            ? 'text-gray-700 bg-white hover:bg-gray-50' 
                            : 'text-gray-300 bg-gray-100'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={nextPage}
                        disabled={!hasNext}
                        className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                          hasNext 
                            ? 'text-gray-700 bg-white hover:bg-gray-50' 
                            : 'text-gray-300 bg-gray-100'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{documents.length}</span> of{' '}
                          <span className="font-medium">{totalCount}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={previousPage}
                            disabled={!hasPrevious}
                            className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                              hasPrevious 
                                ? 'text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0' 
                                : 'text-gray-300 bg-gray-100'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <div className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                            {page}
                          </div>
                          <button
                            onClick={nextPage}
                            disabled={!hasNext}
                            className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                              hasNext 
                                ? 'text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0' 
                                : 'text-gray-300 bg-gray-100'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
