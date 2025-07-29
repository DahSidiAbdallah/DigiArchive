import { useState, useEffect, useCallback, Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Document, getDocuments } from '@/services/document.service'
import { Department, Folder } from '@/types/department.types'
import { getDepartments, getFolders, createDepartment, createFolder } from '@/services/department.service'
import { Dialog, Transition } from '@headlessui/react'
import { DepartmentProvider } from '@/context/DepartmentContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  
  // State for sidebar and filters
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
  
  // Fetch documents based on filters
  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }
    
    setDocumentsLoading(true)
    
    try {
      const filters: Record<string, any> = {}
      
      if (selectedDepartment !== null) {
        filters.department = selectedDepartment
      }
      
      if (selectedFolder !== null) {
        filters.folder = selectedFolder
      }
      
      if (documentType) {
        filters.document_type = documentType
      }
      
      const response = await getDocuments(1, searchQuery)
      setDocuments(response.results)
    } catch (err) {
      console.error('Error fetching documents:', err)
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }, [isAuthenticated, selectedDepartment, selectedFolder, documentType, searchQuery])
  
  // Fetch documents when filters change
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        fetchDocuments()
      }, 300) // Add small debounce for search
      
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, fetchDocuments])
  
  // Format document type for display
  const formatDocumentType = (type: string) => {
    const typeMap: Record<string, string> = {
      'invoice': 'Facture',
      'bill_of_lading': 'Connaissement',
      'transfer_request': 'Demande de transfert',
      'contract': 'Contrat',
      'report': 'Rapport',
      'memo': 'Mémo',
      'other': 'Autre'
    }
    return typeMap[type] || type
  }
  
  // Get tag display for document
  const getTagsDisplay = (document: Document) => {
    if (!document.tags || document.tags.length === 0) return null
    return document.tags.map(tag => tag.name).join(', ')
  }

  // Handle click on a department
  const handleDepartmentClick = (deptId: number) => {
    setSelectedDepartment(prevDept => prevDept === deptId ? null : deptId)
    setSelectedFolder(null)
  }
  
  // Handle click on a folder
  const handleFolderClick = (folderId: number) => {
    setSelectedFolder(prevFolder => prevFolder === folderId ? null : folderId)
  }
  
  // Handle document click to view details
  const handleDocumentClick = (docId?: number) => {
    if (docId) {
      navigate(`/documents/${docId}`)
    }
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
        code: newDepartmentName.trim().toLowerCase().replace(/\s+/g, '_'),
        description: newDepartmentDescription.trim()
      })
      
      // Add new department to the list
      setDepartments(prev => [...prev, newDept])
      
      // Reset form and close modal
      setNewDepartmentName('')
      setNewDepartmentDescription('')
      setIsCreateDepartmentModalOpen(false)
      
    } catch (error) {
      console.error('Failed to create department:', error)
      setDepartmentError('Erreur lors de la création du département')
    } finally {
      setIsSubmitting(false)
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
        department: selectedDepartment
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
      
    } catch (error) {
      console.error('Failed to create folder:', error)
    } finally {
      setIsSubmitting(false)
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
                        value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      {departmentError && <p className="mt-2 text-sm text-red-600">{departmentError}</p>}
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
    <DepartmentProvider>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-40 w-72 h-screen transition-transform duration-300 ease-in-out border-r border-gray-200 bg-white/90 backdrop-blur-lg shadow-lg`}> 
          <div className="h-full flex flex-col">
            {/* Mobile close button */}
            <div className="md:hidden p-4 flex justify-end">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-primary-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Sidebar header */}
            <div className="p-6 border-b bg-white/80">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary-700 tracking-tight">Départements</h2>
                <button
                  onClick={() => setIsCreateDepartmentModalOpen(true)}
                  className="text-primary-600 hover:text-primary-800 p-1 rounded-full border border-primary-100 bg-primary-50 hover:bg-primary-100 transition"
                  title="Ajouter un département"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Departments list */}
            <div className="flex-grow overflow-y-auto p-6">
              <nav className="space-y-2">
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
                  <p className="text-gray-400 text-sm">Aucun département disponible</p>
                ) : (
                  <ul className="space-y-2">
                    {departments.map((dept) => (
                      <li key={dept.id}>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDepartmentClick(dept.id)}
                            className={`flex items-center w-full px-3 py-2 text-base rounded-lg font-medium transition ${
                              selectedDepartment === dept.id ? 'bg-primary-100 text-primary-800 shadow' : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                            }`}
                          >
                            <svg 
                              className={`mr-2 h-5 w-5 transition-transform ${selectedDepartment === dept.id ? 'rotate-90 text-primary-600' : 'text-gray-400'}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {dept.name}
                          </button>
                        </div>
                        {/* Folders for this department */}
                        {selectedDepartment === dept.id && (
                          <div className="ml-7 mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dossiers</span>
                              <button
                                onClick={() => setIsCreateFolderModalOpen(true)}
                                className="text-xs text-primary-600 hover:text-primary-800 p-1 rounded-full border border-primary-100 bg-primary-50 hover:bg-primary-100 transition"
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
                                      className={`w-full flex items-center px-3 py-1.5 text-sm rounded-md font-medium transition ${
                                        selectedFolder === folder.id ? 'bg-primary-50 text-primary-700 shadow' : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                                      }`}
                                    >
                                      <svg 
                                        className={`mr-2 h-4 w-4 ${selectedFolder === folder.id ? 'text-primary-600' : 'text-gray-400'}`} 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                      </svg>
                                      {folder.name}
                                    </button>
                                  </li>
                                ))
                              ) : (
                                <li className="text-xs text-gray-400 py-1 px-2">Aucun dossier</li>
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
            <div className="p-6 border-t bg-white/80 space-y-2">
              <Link
                to="/documents/upload"
                className="w-full flex items-center justify-center px-4 py-2 text-base font-semibold text-white bg-primary-600 rounded-lg shadow hover:bg-primary-700 transition"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un document
              </Link>
              {selectedFolder && (
                <Link
                  to={`/documents/upload?folder=${selectedFolder}&department=${selectedDepartment}`}
                  className="w-full flex items-center justify-center px-4 py-2 text-base font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Ajouter au dossier sélectionné
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar with search and filters */}
          <header className="bg-white/80 shadow z-10 border-b border-gray-200">
            <div className="px-6 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4 w-full md:w-auto">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-2"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-primary-700 tracking-tight hidden md:block">Tableau de bord</h1>
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Rechercher des documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Filters and status */}
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 w-full md:w-auto">
                <div className="flex items-center gap-2 md:gap-4">
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
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
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm"
                  >
                    <option value="newest">Plus récent</option>
                    <option value="oldest">Plus ancien</option>
                    <option value="name">Nom (A-Z)</option>
                    <option value="name_desc">Nom (Z-A)</option>
                  </select>
                </div>
                <div className="text-sm text-gray-500 font-medium mt-2 md:mt-0">
                  {documents.length} document{documents.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </header>
          
          {/* Document list */}
          <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            {documentsLoading ? (
              <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="p-4">
                    <div className="animate-pulse flex space-x-4">
                      <div className="rounded-md bg-gray-200 h-12 w-12"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par télécharger un document ou sélectionner un autre département.
                </p>
                <div className="mt-6">
                  <Link
                    to="/documents/upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter un document
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white/90 shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-primary-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Document</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Département</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-primary-700 uppercase tracking-wider">Tags</th>
                      <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-primary-50/60 cursor-pointer transition" onClick={() => handleDocumentClick(doc.id)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center shadow-inner">
                              <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-base font-semibold text-gray-900 truncate max-w-xs">{doc.title}</div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">{doc.file_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {formatDocumentType(doc.document_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                          {doc.department?.name || <span className="text-gray-400">Non assigné</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString('fr-FR') : 
                           doc.created_at ? new Date(doc.created_at).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {doc.tags && doc.tags.length > 0 ? (
                              doc.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded text-xs bg-gray-100 font-medium text-gray-700">
                                  {tag.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                            {doc.tags && doc.tags.length > 3 && (
                              <span className="px-2 py-0.5 rounded text-xs bg-gray-100 font-medium text-gray-700">
                                +{doc.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDocumentClick(doc.id);
                            }}
                            className="inline-flex items-center gap-1 text-primary-700 hover:text-primary-900 px-3 py-1 rounded-md transition font-semibold"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <circle cx="12" cy="12" r="10" />
                              <circle cx="12" cy="12" r="3" />
                              <path d="M2 12C4 7 8 4 12 4s8 3 10 8-4 8-10 8-8-3-10-8z" />
                            </svg>
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </main>
        </div>
        
        {/* Department Creation Modal */}
        <Transition appear show={isCreateDepartmentModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsCreateDepartmentModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                            value={newDepartmentName}
                            onChange={(e) => setNewDepartmentName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                          {departmentError && <p className="mt-2 text-sm text-red-600">{departmentError}</p>}
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
                        onClick={() => setIsCreateDepartmentModalOpen(false)}
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

        {/* Folder Creation Modal */}
        <Transition appear show={isCreateFolderModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsCreateFolderModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                        onClick={() => setIsCreateFolderModalOpen(false)}
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
      </div>
    </DepartmentProvider>
  )
}
