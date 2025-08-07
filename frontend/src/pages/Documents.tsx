import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import DocumentListItem from '@/components/DocumentListItem';
import DepartmentSelector from '@/components/DepartmentSelector';
import FolderManager from '@/components/FolderManager';
import DocumentUpload from '@/components/DocumentUpload';
import { useLocation } from 'react-router-dom';
import { exportDocuments } from '@/services/document.service';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function Documents() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  // Local UI state for filters/search
  const [searchInput, setSearchInput] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [folderRefreshKey, setFolderRefreshKey] = useState(0);
  
  // Check if we're on the upload route
  useEffect(() => {
    if (location.pathname === '/documents/upload') {
      setIsUploadModalOpen(true);
    }
  }, [location.pathname]);

  // Compose filters for useDocuments
  const filters = {
    document_type: documentType,
    department: selectedDepartment ? String(selectedDepartment) : '',
    folder: selectedFolder ? String(selectedFolder) : '',
  };

  // Create a local version of the filters object to pass to the hook
  const currentFilters = {
    document_type: documentType,
    department: selectedDepartment ? String(selectedDepartment) : '',
    folder: selectedFolder ? String(selectedFolder) : '',
  };
  
  // For tracking if filters have been changed since last API call
  const [filtersChanged, setFiltersChanged] = useState(false);
  
  // Handler for exporting documents
  const handleExport = async (format: string) => {
    try {
      setIsExporting(true);
      
      // Create export parameters with current filters
      const exportFilters = {
        document_type: documentType || '',
        department: selectedDepartment ? String(selectedDepartment) : '',
        folder: selectedFolder ? String(selectedFolder) : '',
        // Add timestamp to prevent caching issues
        _timestamp: Date.now().toString()
      };
      
      // Generate a descriptive message for the success alert
      let exportDescription = '';
      
      // Get department name from select element if possible
      if (selectedDepartment) {
        // Try to find the department name in the DOM
        const deptElement = document.querySelector(`#department option[value="${selectedDepartment}"]`);
        const deptName = deptElement ? deptElement.textContent : 'department';
        exportDescription += `${deptName} `;
      }
      
      // Get document type name from select element if possible
      if (documentType) {
        const typeElement = document.querySelector(`#document_type option[value="${documentType}"]`);
        const typeName = typeElement ? typeElement.textContent : documentType;
        exportDescription += `${typeName} `;
      }
      
      // Add basic description
      exportDescription += 'documents';
      
      // Add search terms if applicable
      if (searchInput) {
        exportDescription += ` containing "${searchInput}"`;
      }
      
      console.log('Exporting documents with filters:', exportFilters);
      
      // Call the export function with all parameters
      await exportDocuments(format, page || 1, searchInput, exportFilters);
      
      // Show success message
      alert(`Exported ${exportDescription} in ${format.toUpperCase()} format`);
      
      // Close the modal
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export documents. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Use the useDocuments hook with current values and track the search/filter changes
  const {
    documents,
    isLoading,
    error,
    page,
    totalCount,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
    refreshDocuments,
    updateSearch,
    updateFilters,
  } = useDocuments(1, searchInput, currentFilters);
  
  // Consolidated search and filter handling with proper debounce
  useEffect(() => {
    // Debug logging
    console.log('Search input changed:', searchInput);
    
    // Use a debounce timer to prevent rapid-fire API calls
    const handler = setTimeout(() => {
      // Update search in the hook directly
      updateSearch(searchInput);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(handler);
  }, [searchInput, updateSearch]);
  
  // Separate effect for filter changes
  useEffect(() => {
    // Debug logging
    console.log('Filters changed:', { documentType, selectedDepartment, selectedFolder });
    
    // Create the filter object
    const newFilters = {
      document_type: documentType,
      department: selectedDepartment ? String(selectedDepartment) : '',
      folder: selectedFolder ? String(selectedFolder) : '',
    };
    
    // Update filters in the hook directly
    updateFilters(newFilters);
    
  }, [documentType, selectedDepartment, selectedFolder, updateFilters]);
  
  // Add mount/unmount logging
  useEffect(() => {
    console.log('Documents component mounted');
    
    return () => {
      console.log('Documents component unmounted');
    };
  }, []);

  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">You need to be logged in to view documents.</p>
        <a href="/login" className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500">
          Log In
        </a>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h2 className="text-3xl font-bold text-primary-700 tracking-tight">Documents</h2>
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2 text-base font-semibold text-white shadow hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Télécharger un Document
          </button>
          <button
            type="button"
            onClick={() => setIsFolderManagerOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-base font-semibold text-primary-700 shadow border border-primary-200 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Gérer les dossiers
          </button>
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-base font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
            disabled={isExporting}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            {isExporting ? 'Exportation...' : 'Exporter Tout'}
          </button>
          <button
            type="button"
            onClick={() => {
              // Force refresh without changing any filters
              refreshDocuments();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-base font-semibold text-white shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Rafraîchir
          </button>
        </div>
      </div>
      <div className="bg-white/90 shadow-xl rounded-2xl border border-gray-100">
        <div className="p-6 space-y-6">
          {/* Department and folder selector */}
          <DepartmentSelector
            selectedDepartment={selectedDepartment}
            selectedFolder={selectedFolder}
            onDepartmentChange={setSelectedDepartment}
            onFolderChange={setSelectedFolder}
            className="mb-4"
            refreshKey={folderRefreshKey}
          />
          {/* Search and filter */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:max-w-md">
              <input
                type="text"
                name="search"
                id="search"
                placeholder="Chercher des documents..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                }}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {/* Quick filter buttons */}
              <button
                onClick={() => {
                  // Set Commercial department filter
                  const commercialDeptId = 2; // Commercial department ID
                  setSelectedDepartment(commercialDeptId);
                  setDocumentType(''); // Reset document type
                }}
                className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800 hover:bg-blue-200"
              >
                <span>Commercial Documents</span>
              </button>
              
              <button
                onClick={() => {
                  // Clear all filters
                  setSelectedDepartment(null);
                  setSelectedFolder(null);
                  setDocumentType('');
                  setSearchInput('');
                }}
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-sm font-medium text-gray-800 hover:bg-gray-200"
              >
                <span>View All</span>
              </button>
            
              <select
                id="document_type"
                name="document_type"
                value={documentType}
                onChange={(e) => {
                  setDocumentType(e.target.value);
                }}
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
              >
                <option value="">Tous les types de documents</option>
                <option value="invoice">Factures</option>
                <option value="bill_of_lading">Bons de livraison</option>
                <option value="transfer_request">Demandes de transfert</option>
                <option value="contract">Contrats</option>
                <option value="report">Rapports</option>
                <option value="memo">Memos</option>
                <option value="other">Autres</option>
              </select>
            </div>
          </div>
          {/* Document list and states */}
          {isLoading ? (
            <div className="text-center py-10">
              <div className="animate-pulse flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-3 text-gray-500 text-sm">Chargement des documents...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4 my-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading documents</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={refreshDocuments}
                      className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="text-center py-10">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchInput || documentType || selectedDepartment || selectedFolder ? 
                  "No documents match your search criteria. Try adjusting your filters." : 
                  "Get started by uploading your first document."
                }
              </p>
              <div className="mt-2">
                <button 
                  onClick={refreshDocuments}
                  className="text-primary-600 underline hover:text-primary-800"
                >
                  Refresh documents
                </button>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                  Upload Document
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden bg-white/90 shadow rounded-xl border border-gray-100">
                <ul role="list" className="divide-y divide-gray-100">
                  {documents.map((document) => (
                    <DocumentListItem key={document.id} document={document} />
                  ))}
                </ul>
              </div>
              {/* Pagination */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between border-t border-gray-100 bg-white/80 px-4 py-4 sm:px-6 mt-4 rounded-b-xl">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={previousPage}
                      disabled={!hasPrevious}
                      className={`relative inline-flex items-center rounded-md px-4 py-2 text-base font-medium ${
                        hasPrevious 
                          ? 'text-primary-700 bg-white hover:bg-primary-50' 
                          : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      Précédent
                    </button>
                    <button
                      onClick={nextPage}
                      disabled={!hasNext}
                      className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-base font-medium ${
                        hasNext 
                          ? 'text-primary-700 bg-white hover:bg-primary-50' 
                          : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                      }`}
                    >
                      Suivant
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Affichage de <span className="font-semibold">{documents.length}</span> sur <span className="font-semibold">{totalCount}</span> résultats
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={previousPage}
                          disabled={!hasPrevious}
                          className={`relative inline-flex items-center rounded-l-md px-3 py-2 ${
                            hasPrevious 
                              ? 'text-primary-700 bg-white hover:bg-primary-50 border border-gray-200' 
                              : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          <span className="sr-only">Précédent</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <div className="relative inline-flex items-center px-4 py-2 text-base font-semibold text-gray-900 border border-gray-200 bg-white">
                          {page}
                        </div>
                        <button
                          onClick={nextPage}
                          disabled={!hasNext}
                          className={`relative inline-flex items-center rounded-r-md px-3 py-2 ${
                            hasNext 
                              ? 'text-primary-700 bg-white hover:bg-primary-50 border border-gray-200' 
                              : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          <span className="sr-only">Suivant</span>
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
      <FolderManager
        isOpen={isFolderManagerOpen}
        onClose={() => setIsFolderManagerOpen(false)}
        departmentId={selectedDepartment}
        onFolderCreated={(folder) => {
          setFolderRefreshKey((k) => k + 1);
          setSelectedFolder(folder.id);
        }}
      />
      
      {/* Document Upload Modal */}
      <DocumentUpload
        isOpen={isUploadModalOpen}
        onCancel={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false);
          refreshDocuments();
        }}
      />
      
      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setIsExportModalOpen(false)}></div>
            <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Export Documents</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Choose a format to export the current document list. 
                  {selectedDepartment && <strong> Filtered by department.</strong>}
                  {documentType && <strong> Filtered by document type.</strong>}
                  {searchInput && <strong> Filtered by search term.</strong>}
                </p>
                
                <div className="space-y-4 mt-6">
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <div>
                      <span className="block font-medium text-gray-900">CSV</span>
                      <span className="text-sm text-gray-500">Compatible with Excel, Google Sheets</span>
                    </div>
                    <ArrowDownTrayIcon className="h-5 w-5 text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => handleExport('excel')}
                    disabled={isExporting}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <div>
                      <span className="block font-medium text-gray-900">Excel</span>
                      <span className="text-sm text-gray-500">Native Excel format with formatting</span>
                    </div>
                    <ArrowDownTrayIcon className="h-5 w-5 text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => handleExport('json')}
                    disabled={isExporting}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <div>
                      <span className="block font-medium text-gray-900">JSON</span>
                      <span className="text-sm text-gray-500">For developers and data integration</span>
                    </div>
                    <ArrowDownTrayIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
