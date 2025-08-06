import { useState, useEffect, useCallback, Fragment, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Document, getDocuments, deleteDocument } from '@/services/document.service'
import { Department, Folder } from '@/types/department.types'
import { getDepartments, getFolders, createDepartment, createFolder } from '@/services/department.service'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { advancedSearch, SearchParams } from '@/services/search.service'
import { useToast } from '@/contexts/ToastContext'
import DocumentListItem from '@/components/DocumentListItem'
import EditDocumentModal from '@/components/EditDocumentModal'
import TagManager from '@/components/TagManager'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const { showSuccess, showError } = useToast()
  
  // State for dashboard navigation
  const [currentView, setCurrentView] = useState<'departments' | 'department' | 'folder'>('departments')
  const [breadcrumbs, setBreadcrumbs] = useState<{name: string, id?: number, type: 'departments' | 'department' | 'folder'}[]>([
    { name: 'Départements', type: 'departments' }
  ])
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null)
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  
  // Advanced search states
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [contentSearch, setContentSearch] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false)
  
  // State for add department/folder modals
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false)
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [isCreateDepartmentModalOpen, setIsCreateDepartmentModalOpen] = useState(false)
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false)
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [newDepartmentDescription, setNewDepartmentDescription] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departmentError, setDepartmentError] = useState('')
  const [folderError, setFolderError] = useState('')
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null)
  
  // Fetch departments on component mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true)
        const data = await getDepartments();
        setDepartments(data);
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      loadDepartments();
    }
  }, [isAuthenticated]);

  // Fetch folders when department changes
  useEffect(() => {
    const loadFolders = async () => {
      if (!selectedDepartment) {
        setFolders([])
        return
      }
      
      try {
        const folderData = await getFolders(selectedDepartment)
        setFolders(folderData)
        
        // Reset folder selection if the selected folder doesn't belong to this department
        if (selectedFolder && !folderData.some(f => f.id === selectedFolder)) {
          setSelectedFolder(null)
        }
      } catch (err) {
        console.error('Failed to load folders:', err)
      }
    }
    
    if (isAuthenticated) {
      loadFolders()
    }
  }, [isAuthenticated, selectedDepartment, selectedFolder])
  
  // Enhanced fetch documents function with advanced search
  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }
    
    setDocumentsLoading(true)
    
    try {
      // Build search parameters
      const searchParams: SearchParams = {
        ordering: sortOrder === 'newest' ? '-created_at' : 
                  sortOrder === 'oldest' ? 'created_at' :
                  sortOrder === 'name' ? 'title' : '-title'
      }
      
      // Add filters based on current view
      if (currentView === 'department' && currentDepartment) {
        searchParams.department_id = currentDepartment.id
      } else if (currentView === 'folder' && currentFolder) {
        searchParams.folder_id = currentFolder.id
      }
      
      // Legacy department/folder filters for compatibility
      if (selectedDepartment !== null) {
        searchParams.department_id = selectedDepartment
      }
      
      if (selectedFolder !== null) {
        searchParams.folder_id = selectedFolder
      }
      
      // Add search query
      if (searchQuery.trim()) {
        searchParams.q = searchQuery.trim()
      }
      
      // Add document type filter
      if (documentType) {
        searchParams.document_type = documentType
      }
      
      // Add date filters
      if (dateFrom) {
        searchParams.date_from = dateFrom
      }
      if (dateTo) {
        searchParams.date_to = dateTo
      }
      
      // Add content search
      if (contentSearch.trim()) {
        searchParams.content_query = contentSearch.trim()
      }
      
      // Add tag filters
      if (selectedTagIds.length > 0) {
        searchParams.tags = selectedTagIds
      }
      
      // Perform search
      const response = await advancedSearch(searchParams)
      setDocuments(response.results)
      setFilteredDocuments(response.results)
    } catch (err) {
      console.error('Error fetching documents:', err)
      // Fallback to basic search
      try {
        const response = await getDocuments(1, searchQuery)
        setDocuments(response.results)
        setFilteredDocuments(response.results)
      } catch (fallbackErr) {
        console.error('Fallback search failed:', fallbackErr)
        setDocuments([])
        setFilteredDocuments([])
      }
    } finally {
      setDocumentsLoading(false)
    }
  }, [isAuthenticated, currentView, currentDepartment, currentFolder, selectedDepartment, selectedFolder, searchQuery, documentType, sortOrder, dateFrom, dateTo, contentSearch, selectedTagIds])
  
  // Real-time filtering for quick search
  const performRealTimeFilter = useMemo(() => {
    // Ensure documents is an array
    if (!documents || !Array.isArray(documents)) {
      return []
    }
    
    if (!searchQuery && !documentType && !dateFrom && !dateTo && selectedTagIds.length === 0) {
      return documents
    }
    
    return documents.filter(doc => {
      // Text search in multiple fields
      const textMatch = !searchQuery || 
        doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags?.some(tag => tag.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // Document type filter
      const typeMatch = !documentType || doc.document_type === documentType
      
      // Date filters
      const dateFromMatch = !dateFrom || !doc.created_at || new Date(doc.created_at) >= new Date(dateFrom)
      const dateToMatch = !dateTo || !doc.created_at || new Date(doc.created_at) <= new Date(dateTo)
      
      // Tag filters
      const tagMatch = selectedTagIds.length === 0 || 
        (doc.tags && doc.tags.some(tag => selectedTagIds.includes(tag.id!)))
      
      return textMatch && typeMatch && dateFromMatch && dateToMatch && tagMatch
    })
  }, [documents, searchQuery, documentType, dateFrom, dateTo, selectedTagIds])
  
  // Update filtered documents when filters change
  useEffect(() => {
    setFilteredDocuments(performRealTimeFilter)
  }, [performRealTimeFilter])
  
  // Fetch documents when filters change with debouncing
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        fetchDocuments()
      }, 300) // Add small debounce for search
      
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, fetchDocuments])
  
  // Handle click on a department
  const handleDepartmentClick = (deptId: number) => {
    setSelectedDepartment(prevDept => prevDept === deptId ? null : deptId)
    setSelectedFolder(null)
  }
  
  // Handle click on a folder
  const handleFolderClick = (folderId: number) => {
    setSelectedFolder(prevFolder => prevFolder === folderId ? null : folderId)
  }
  
  // Handle department creation
  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      setDepartmentError('Le nom du département est requis')
      return
    }
    
    try {
      setIsSubmitting(true)
      setDepartmentError('')
      const newDept = await createDepartment({
        name: newDepartmentName.trim(),
        description: newDepartmentDescription.trim()
      })
      
      // Add new department to the list
      setDepartments(prev => [...prev, newDept])
      
      // Reset form and close modal
      setNewDepartmentName('')
      setNewDepartmentDescription('')
      setIsCreateDepartmentModalOpen(false)
      
      showSuccess('Succès', 'Département créé avec succès')
      
    } catch (error) {
      console.error('Failed to create department:', error)
      setDepartmentError('Erreur lors de la création du département')
      showError('Erreur', 'Impossible de créer le département')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Navigation functions
  const navigateToDepartment = (department: Department) => {
    setCurrentDepartment(department)
    setCurrentFolder(null)
    setSelectedDepartment(department.id)
    setSelectedFolder(null)
    setCurrentView('department')
    setBreadcrumbs([
      { name: 'Départements', type: 'departments' },
      { name: department.name, id: department.id, type: 'department' }
    ])
  }

  const navigateToFolder = (folder: Folder) => {
    setCurrentFolder(folder)
    setSelectedFolder(folder.id)
    setCurrentView('folder')
    setBreadcrumbs([
      { name: 'Départements', type: 'departments' },
      { name: currentDepartment?.name || '', id: currentDepartment?.id, type: 'department' },
      { name: folder.name, id: folder.id, type: 'folder' }
    ])
  }

  const navigateBack = (breadcrumb: typeof breadcrumbs[0]) => {
    if (breadcrumb.type === 'departments') {
      setCurrentView('departments')
      setCurrentDepartment(null)
      setCurrentFolder(null)
      setSelectedDepartment(null)
      setSelectedFolder(null)
      setBreadcrumbs([{ name: 'Départements', type: 'departments' }])
    } else if (breadcrumb.type === 'department' && breadcrumb.id) {
      const dept = departments.find(d => d.id === breadcrumb.id)
      if (dept) {
        navigateToDepartment(dept)
      }
    }
  }

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setFolderError('Le nom du dossier est requis')
      return
    }
    
    if (!selectedDepartment) {
      setFolderError('Veuillez sélectionner un département')
      return
    }
    
    try {
      setIsSubmitting(true)
      setFolderError('')
      const newFolder = await createFolder({
        name: newFolderName.trim(),
        description: newFolderDescription.trim(),
        department: selectedDepartment,
        parent: null
      })
      
      // Update department folders
      setDepartments(prev => 
        prev.map(dept => 
          dept.id === selectedDepartment
            ? {
                ...dept,
                folders: dept.folders ? [...dept.folders, newFolder] : [newFolder]
              }
            : dept
        )
      )
      
      // Reset form and close modal
      setNewFolderName('')
      setNewFolderDescription('')
      setIsCreateFolderModalOpen(false)
      
      showSuccess('Succès', 'Dossier créé avec succès')
      
    } catch (error) {
      console.error('Failed to create folder:', error)
      showError('Erreur', 'Impossible de créer le dossier')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle document edit
  const handleEditDocument = (document: Document) => {
    setDocumentToEdit(document)
    setIsEditModalOpen(true)
  }
  
  // Handle document updated
  const handleDocumentUpdated = (updatedDocument: Document) => {
    // Update the document in the documents list
    if (updatedDocument && updatedDocument.id) {
      setDocuments(prev => prev.map(doc => 
        doc.id === updatedDocument.id ? updatedDocument : doc
      ))
      setFilteredDocuments(prev => prev.map(doc => 
        doc.id === updatedDocument.id ? updatedDocument : doc
      ))
    }
    
    // Note: We're not closing the modal here because it's already handled in the onClose function
    // The EditDocumentModal component calls onClose() after successful update
  }
  
  // Handle document delete
  const handleDeleteDocument = async (documentId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return
    }
    
    try {
      await deleteDocument(documentId)
      
      // Remove the document from state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      setFilteredDocuments(prev => prev.filter(doc => doc.id !== documentId))
      
      showSuccess('Succès', 'Document supprimé avec succès')
      
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error)
      showError('Erreur', 'Impossible de supprimer le document')
    }
  }
  
  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
            <h1 className="mt-10 max-w-lg text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Numérisation de documents MAFCI et archivage basé sur l'IA
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Une plateforme complète de gestion et d'archivage de documents pour MAFCI avec classification basée sur l'IA,
              capacités OCR et fonctionnalités de collaboration interne.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Commencez
              </Link>
              <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900">
                Se connecter <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="mt-16 sm:mt-24 lg:mt-0 lg:flex-shrink-0">
            <img
              className="mx-auto w-[40rem] max-w-full rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem]"
              src="/src/assets/logo.png"
              alt="MAFCI DigiArchive"
            />
          </div>
        </div>
        
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary-600">Gestion de documents </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Tout ce dont vous avez besoin pour gérer vos documents
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Numérisez, organisez et rendez consultables tous les documents MAFCI, y compris les factures, les connaissements, les demandes de transfert, et plus encore.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    Digitilisation des Documents
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Téléchargez, numérisez et digitisez tous vos documents importants. Stockez-les en toute sécurité et accédez-y depuis n'importe où.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    Classification Alimentée par l'IA
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Exploitez l'IA pour classer, taguer et organiser automatiquement vos documents. Gagnez du temps et réduisez le travail manuel.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    Recherche Intelligente
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Trouvez n'importe quel document instantanément grâce à nos puissantes capacités de recherche. Recherchez par contenu, métadonnées ou tags.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Department creation modal
  const DepartmentModal = () => (
    <Transition appear show={departmentModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setDepartmentModalOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Créer un nouveau département
                </Dialog.Title>
                <div className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700">
                        Nom du département *
                      </label>
                      <input
                        type="text"
                        id="departmentName"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Finance, RH, IT, etc."
                        value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="departmentDescription" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="departmentDescription"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Description du département (optionnel)"
                        value={newDepartmentDescription}
                        onChange={(e) => setNewDepartmentDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    onClick={() => setDepartmentModalOpen(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      isSubmitting || !newDepartmentName.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={handleCreateDepartment}
                    disabled={isSubmitting || !newDepartmentName.trim()}
                  >
                    {isSubmitting ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
  
  // Folder creation modal
  const FolderModal = () => (
    <Transition appear show={folderModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setFolderModalOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Créer un nouveau dossier
                </Dialog.Title>
                <div className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="folderName" className="block text-sm font-medium text-gray-700">
                        Nom du dossier *
                      </label>
                      <input
                        type="text"
                        id="folderName"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Factures, Contrats, Rapports, etc."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="folderDescription" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="folderDescription"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        placeholder="Description du dossier (optionnel)"
                        value={newFolderDescription}
                        onChange={(e) => setNewFolderDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    onClick={() => setFolderModalOpen(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className={`inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      isSubmitting || !newFolderName.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={handleCreateFolder}
                    disabled={isSubmitting || !newFolderName.trim()}
                  >
                    {isSubmitting ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
  
  // For authenticated users, show the dashboard
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`transition-transform duration-300 ease-in-out border-r border-gray-200 bg-white z-40 w-64 h-screen fixed md:relative ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-full flex flex-col">
          {/* Mobile close button */}
          <div className="md:hidden p-4 flex justify-end">
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-900"
              aria-label="Fermer le menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Sidebar header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-primary-700">Départements</h2>
            <button
              onClick={() => setIsCreateDepartmentModalOpen(true)}
              className="text-primary-600 hover:text-primary-800 p-1 rounded-full border border-primary-100"
              title="Ajouter un département"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {/* Departments list */}
          <div className="flex-grow overflow-y-auto p-4">
            <nav className="space-y-1">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ) : departments.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun département disponible</p>
              ) : (
                <ul className="space-y-2">
                  {departments.map((dept) => (
                    <li key={dept.id}>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleDepartmentClick(dept.id)}
                          className={`flex items-center w-full px-2 py-2 text-sm rounded-md transition-colors ${
                            selectedDepartment === dept.id ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <svg 
                            className={`mr-2 h-5 w-5 transition-transform ${selectedDepartment === dept.id ? 'rotate-90' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="truncate">{dept.name}</span>
                        </button>
                      </div>
                      {/* Folders for this department */}
                      {selectedDepartment === dept.id && (
                        <div className="ml-6 mt-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-500">Dossiers</span>
                            <button
                              onClick={() => setIsCreateFolderModalOpen(true)}
                              className="text-xs text-primary-600 hover:text-primary-800 p-1 rounded-full border border-primary-100"
                              title="Ajouter un dossier"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                          <ul className="space-y-1">
                            {dept.folders && dept.folders.length > 0 ? (
                              dept.folders.map((folder) => (
                                <li key={folder.id}>
                                  <button
                                    onClick={() => handleFolderClick(folder.id)}
                                    className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                                      selectedFolder === folder.id ? 'bg-primary-100 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    <svg 
                                      className="mr-2 h-4 w-4" 
                                      fill="none" 
                                      viewBox="0 0 24 24" 
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    <span className="truncate">{folder.name}</span>
                                  </button>
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-gray-500 py-1 px-2">Aucun dossier</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </nav>
          </div>
          {/* Create buttons */}
          <div className="p-4 border-t space-y-2">
            <Link
              to="/documents/upload"
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un document
            </Link>
            {selectedFolder && (
              <Link
                to={`/documents/upload?folder=${selectedFolder}&department=${selectedDepartment}`}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-300 rounded-md hover:bg-primary-100"
              >
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Ajouter au dossier sélectionné
              </Link>
            )}
          </div>
        </div>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with search and filters */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-500 hover:text-gray-900"
                aria-label="Ouvrir le menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-primary-700">Tableau de bord</h1>
              {/* Enhanced Search */}
              <div className="flex-1 max-w-2xl mx-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher des documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <button
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    title="Recherche avancée"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </button>
                </div>
                
                {/* Advanced Search Panel */}
                {showAdvancedSearch && (
                  <div className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Recherche dans le contenu
                        </label>
                        <input
                          type="text"
                          placeholder="Rechercher dans le texte..."
                          value={contentSearch}
                          onChange={(e) => setContentSearch(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type de document
                        </label>
                        <select
                          value={documentType}
                          onChange={(e) => setDocumentType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Tous les types</option>
                          <option value="invoice">Facture</option>
                          <option value="bill_of_lading">Connaissement</option>
                          <option value="transfer_request">Demande de transfert</option>
                          <option value="contract">Contrat</option>
                          <option value="report">Rapport</option>
                          <option value="memo">Mémo</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date de début
                        </label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date de fin
                        </label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      
                      {/* Tag Filter */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Filtrer par étiquettes
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsTagManagerOpen(true)}
                            className="flex-1 px-3 py-2 text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          >
                            {selectedTagIds.length > 0 
                              ? `${selectedTagIds.length} étiquette${selectedTagIds.length > 1 ? 's' : ''} sélectionnée${selectedTagIds.length > 1 ? 's' : ''}`
                              : 'Sélectionner des étiquettes...'}
                          </button>
                          {selectedTagIds.length > 0 && (
                            <button
                              onClick={() => setSelectedTagIds([])}
                              className="px-3 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                              title="Effacer les filtres d'étiquettes"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        {/* Selected tags display */}
                        {selectedTagIds.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {selectedTagIds.map(tagId => {
                              const tag = (documents || [])
                                .flatMap(doc => (doc.tags || []))
                                .find(t => t.id === tagId)
                              return tag ? (
                                <span
                                  key={tagId}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                                >
                                  {tag.name}
                                  <button
                                    onClick={() => setSelectedTagIds(prev => prev.filter(id => id !== tagId))}
                                    className="ml-1 hover:text-primary-600"
                                  >
                                    <XMarkIcon className="h-3 w-3" />
                                  </button>
                                </span>
                              ) : null
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        {(filteredDocuments || []).length} résultat{(filteredDocuments || []).length !== 1 ? 's' : ''} trouvé{(filteredDocuments || []).length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSearchQuery('')
                            setContentSearch('')
                            setDocumentType('')
                            setDateFrom('')
                            setDateTo('')
                            setSelectedTagIds([])
                          }}
                          className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Réinitialiser
                        </button>
                        <Link
                          to="/search"
                          className="px-3 py-1 text-sm text-white bg-primary-600 rounded hover:bg-primary-700"
                        >
                          Recherche avancée
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Notification bell (placeholder) */}
              <div>
                <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Filters and status */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="border border-gray-300 rounded-md py-1 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="newest">Plus récent</option>
                  <option value="oldest">Plus ancien</option>
                  <option value="name">Nom (A-Z)</option>
                  <option value="name_desc">Nom (Z-A)</option>
                </select>
                
                {/* Quick filter buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setDocumentType('')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      !documentType 
                        ? 'bg-primary-100 text-primary-700 border-primary-300' 
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setDocumentType('invoice')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      documentType === 'invoice' 
                        ? 'bg-primary-100 text-primary-700 border-primary-300' 
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Factures
                  </button>
                  <button
                    onClick={() => setDocumentType('bill_of_lading')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      documentType === 'bill_of_lading' 
                        ? 'bg-primary-100 text-primary-700 border-primary-300' 
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Connaissements
                  </button>
                  <button
                    onClick={() => setDocumentType('contract')}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      documentType === 'contract' 
                        ? 'bg-primary-100 text-primary-700 border-primary-300' 
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Contrats
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {(filteredDocuments || []).length} document{(filteredDocuments || []).length !== 1 ? 's' : ''}
                {searchQuery && ` • "${searchQuery}"`}
              </div>
            </div>
          </div>
        </header>
        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Breadcrumb Navigation */}
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={index} className="inline-flex items-center">
                  {index > 0 && (
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                  <button
                    onClick={() => navigateBack(breadcrumb)}
                    className={`text-sm font-medium ${
                      index === breadcrumbs.length - 1
                        ? 'text-gray-500 cursor-default'
                        : 'text-primary-600 hover:text-primary-800'
                    }`}
                    disabled={index === breadcrumbs.length - 1}
                  >
                    {breadcrumb.name}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          {/* Dashboard Content Based on Current View */}
          {currentView === 'departments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Départements</h2>
                <button
                  onClick={() => setIsCreateDepartmentModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nouveau Département
                </button>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white shadow rounded-lg p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {departments.map((department) => (
                    <div
                      key={department.id}
                      onClick={() => navigateToDepartment(department)}
                      className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer border hover:border-primary-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="bg-primary-100 rounded-full p-3">
                            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {department.code}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{department.name}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {department.description || 'Aucune description disponible'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{department.folders?.length || 0} dossier{(department.folders?.length || 0) !== 1 ? 's' : ''}</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Department View */}
          {currentView === 'department' && currentDepartment && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentDepartment.name}</h2>
                  <p className="text-gray-600 mt-1">{currentDepartment.description}</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsCreateFolderModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nouveau Dossier
                  </button>
                </div>
              </div>

              {/* Folders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => navigateToFolder(folder)}
                    className="bg-white shadow rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer border hover:border-primary-300"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-yellow-100 rounded-lg p-2">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{folder.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{folder.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Documents in Department */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Documents récents</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {documentsLoading ? (
                    <div className="p-6">
                      <div className="animate-pulse space-y-4">
                        {[...Array(3)].map((_, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <div className="rounded-md bg-gray-200 h-10 w-10"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (filteredDocuments || []).length === 0 ? (
                    <div className="p-6 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                      <h3 className="mt-4 text-sm font-medium text-gray-900">Aucun document</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {searchQuery || documentType || dateFrom || dateTo 
                          ? 'Aucun document ne correspond aux critères de recherche.' 
                          : 'Aucun document trouvé dans ce département.'}
                      </p>
                      <div className="mt-6">
                        <Link
                          to="/documents/upload"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Télécharger un document
                        </Link>
                      </div>
                    </div>
                  ) : (
                    (filteredDocuments || []).slice(0, 5).map((document) => (
                      <Link
                        key={document.id}
                        to={`/documents/${document.id}`}
                        className="block p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="bg-blue-100 rounded-lg p-2">
                              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{document.title}</p>
                            <p className="text-sm text-gray-500">
                              {document.created_at ? new Date(document.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                              {document.folder && ` • ${document.folder.name}`}
                            </p>
                          </div>
                          <div className="text-sm text-gray-400">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Folder View */}
          {currentView === 'folder' && currentFolder && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentFolder.name}</h2>
                  <p className="text-gray-600 mt-1">{currentFolder.description}</p>
                </div>
                <div className="flex space-x-3">
                  <Link
                    to="/documents/upload"
                    state={{ department: currentDepartment?.id, folder: currentFolder.id }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Ajouter Document
                  </Link>
                </div>
              </div>

              {/* Documents in Folder */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Documents</h3>
                    <div className="flex items-center space-x-4">
                      {/* Search */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      {/* Sort */}
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="border border-gray-300 rounded-md py-1 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="newest">Plus récent</option>
                        <option value="oldest">Plus ancien</option>
                        <option value="name">Nom (A-Z)</option>
                        <option value="name_desc">Nom (Z-A)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {documentsLoading ? (
                    <div className="p-6">
                      <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <div className="rounded-md bg-gray-200 h-12 w-12"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (filteredDocuments || []).length === 0 ? (
                    <div className="p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                      <h3 className="mt-4 text-sm font-medium text-gray-900">Aucun document</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {searchQuery || documentType || dateFrom || dateTo
                          ? 'Aucun document ne correspond aux critères de recherche.'
                          : 'Ce dossier ne contient aucun document.'}
                      </p>
                      <div className="mt-6">
                        <Link
                          to="/documents/upload"
                          state={{ department: currentDepartment?.id, folder: currentFolder.id }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Télécharger le premier document
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {(filteredDocuments || []).map((document) => (
                        <DocumentListItem
                          key={document.id}
                          document={document}
                          searchQuery={searchQuery}
                          onEdit={handleEditDocument}
                          onDelete={handleDeleteDocument}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {/* Department Creation Modal */}
      <Transition appear show={isCreateDepartmentModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCreateDepartmentModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-primary-700">Créer un nouveau département</Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="departmentName" className="block text-sm font-semibold text-gray-700">Nom du département <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        id="departmentName"
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:text-sm"
                        placeholder="Finance, RH, IT, etc."
                        value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label htmlFor="departmentDescription" className="block text-sm font-semibold text-gray-700">Description</label>
                      <textarea
                        id="departmentDescription"
                        rows={3}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:text-sm"
                        placeholder="Description du département (optionnel)"
                        value={newDepartmentDescription}
                        onChange={(e) => setNewDepartmentDescription(e.target.value)}
                      />
                    </div>
                    {departmentError && <p className="text-sm text-red-600 font-medium mt-2">{departmentError}</p>}
                  </div>
                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      onClick={() => setIsCreateDepartmentModalOpen(false)}
                    >Annuler</button>
                    <button
                      type="button"
                      className={`inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isSubmitting || !newDepartmentName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={handleCreateDepartment}
                      disabled={isSubmitting || !newDepartmentName.trim()}
                    >{isSubmitting ? 'Création...' : 'Créer'}</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      {/* Folder Creation Modal */}
      <Transition appear show={isCreateFolderModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCreateFolderModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-primary-700">Créer un nouveau dossier</Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="folderName" className="block text-sm font-semibold text-gray-700">Nom du dossier <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        id="folderName"
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:text-sm"
                        placeholder="Factures, Contrats, Rapports, etc."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label htmlFor="folderDescription" className="block text-sm font-semibold text-gray-700">Description</label>
                      <textarea
                        id="folderDescription"
                        rows={3}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:text-sm"
                        placeholder="Description du dossier (optionnel)"
                        value={newFolderDescription}
                        onChange={(e) => setNewFolderDescription(e.target.value)}
                      />
                    </div>
                    {folderError && <p className="text-sm text-red-600 font-medium mt-2">{folderError}</p>}
                  </div>
                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      onClick={() => setIsCreateFolderModalOpen(false)}
                    >Annuler</button>
                    <button
                      type="button"
                      className={`inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${isSubmitting || !newFolderName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={handleCreateFolder}
                      disabled={isSubmitting || !newFolderName.trim() || !selectedDepartment}
                    >{isSubmitting ? 'Création...' : 'Créer'}</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
      {/* Edit Document Modal */}
      {documentToEdit && (
        <EditDocumentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setDocumentToEdit(null)
          }}
          document={documentToEdit}
          onDocumentUpdated={handleDocumentUpdated}
        />
      )}
      
      {/* Tag Manager Modal */}
      <TagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        selectedTags={selectedTagIds}
        onTagsSelected={setSelectedTagIds}
      />
    </div>
  );
}
