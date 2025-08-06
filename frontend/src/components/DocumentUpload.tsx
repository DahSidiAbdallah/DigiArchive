import { useState, useEffect, useRef } from 'react'
import { useDocumentUpload, DocumentFormData } from '@/hooks/useDocumentUpload'
import { Tag, getTags } from '@/services/document.service'
import DepartmentSelector from './DepartmentSelector'
import { useLocation } from 'react-router-dom'
import FolderManager from '@/components/FolderManager'
import { DocumentType, documentTypeLabels } from '@/types/document.types'

interface DocumentUploadProps {
  onSuccess?: () => void
  onCancel?: () => void
  isOpen: boolean
}

export default function DocumentUpload({ onSuccess, onCancel, isOpen }: DocumentUploadProps) {
  const location = useLocation()
  
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    document_type: '',
    file: null,
    description: '',
    reference_number: '',
    date: '',
    tag_ids: [],
    department: null,
    folder: null
  })
  
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [folderRefreshKey, setFolderRefreshKey] = useState(0)
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [validationError, setValidationError] = useState<string>('')
  
  const { uploadDocument, isLoading, error: uploadError, success, resetState } = useDocumentUpload()
  
  // Reference to track if component is mounted
  const isMounted = useRef(true)
  
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])
  
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tagData = await getTags()
        if (isMounted.current) {
          setTags(tagData)
        }
      } catch (err) {
        console.error('Failed to load tags:', err)
      }
    }
    
    if (isOpen) {
      loadTags()
      
      // Parse query parameters for initial department and folder
      const queryParams = new URLSearchParams(location.search)
      const departmentId = queryParams.get('department')
      const folderId = queryParams.get('folder')
      
      if (departmentId) {
        const deptId = parseInt(departmentId, 10)
        setSelectedDepartment(deptId)
        setFormData(prev => ({ ...prev, department: deptId }))
      }
      
      if (folderId) {
        const folId = parseInt(folderId, 10)
        setSelectedFolder(folId)
        setFormData(prev => ({ ...prev, folder: folId }))
      }
    }
  }, [isOpen, location.search])
  
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])
  
  const resetForm = () => {
    setFormData({
      title: '',
      document_type: '',
      file: null,
      description: '',
      reference_number: '',
      date: '',
      tag_ids: [],
      department: null,
      folder: null
    })
    setFileName('')
    setSelectedTags([])
    setSelectedDepartment(null)
    setSelectedFolder(null)
    setValidationError('')
    resetState()
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear validation errors when fields are being filled
    if (validationError) {
      setValidationError('')
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // File validation
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setValidationError('File size exceeds 10MB limit')
        return
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        setValidationError('File type not supported. Please upload PDF, JPEG, PNG, or Word documents.')
        return
      }
      
      setFormData({
        ...formData,
        file: file
      })
      setFileName(file.name)
      setValidationError('')
    }
  }
  
  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => Number(option.value))
    setSelectedTags(selectedOptions)
    setFormData({
      ...formData,
      tag_ids: selectedOptions
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset any previous errors
    setValidationError('')
    
    // Validate required fields
    if (!formData.title.trim()) {
      setValidationError('Title is required')
      return
    }
    
    if (!formData.document_type) {
      setValidationError('Please select a document type')
      return
    }
    
    if (!formData.file) {
      setValidationError('Please select a file to upload')
      return
    }
    
    // Set department and folder from state
    const submitData = {
      ...formData,
      department: selectedDepartment,
      folder: selectedFolder
    }
    
    try {
      console.log('Submitting document upload with data:', {
        title: submitData.title,
        document_type: submitData.document_type,
        fileName: submitData.file ? submitData.file.name : null,
        fileSize: submitData.file ? `${(submitData.file.size / 1024).toFixed(2)} KB` : null,
        reference_number: submitData.reference_number,
        date: submitData.date,
        tagCount: submitData.tag_ids?.length || 0,
        department: submitData.department,
        folder: submitData.folder
      })
      
      const result = await uploadDocument(submitData)
      
      if (result) {
        // Validate the result has a valid ID
        if (result.id === undefined || result.id === null) {
          console.error('Document upload succeeded but received invalid ID:', result);
          setValidationError('Document was uploaded but the server returned an invalid ID.');
          return;
        }
        
        console.log('Document upload successful with ID:', result.id);
        
        if (onSuccess && isMounted.current) {
          console.log('Document upload successful, calling onSuccess');
          onSuccess();
        }
      } else if (isMounted.current) {
        // uploadDocument returned null but didn't throw an error (handled by the hook)
        console.warn('Document upload completed but no document was returned');
        // We don't need to set an error here as the hook will set its own error state
      }
    } catch (err: any) {
      console.error('Error in document upload submit handler:', err)
      // Set local validation error if not captured by the hook
      if (isMounted.current && !uploadError) {
        setValidationError(err.message || 'Upload failed. Please try again.')
      }
    }
  }
  
  // Determine what error to display (prioritize validation error over upload error)
  const displayError = validationError || uploadError
  
  return (
    <>
    <div className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 ${isOpen ? 'block' : 'hidden'} overflow-y-auto`}>
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-3xl mx-auto">
          {/* Header */}
          <div className="bg-primary-50 px-4 py-4 sm:px-6 border-b border-primary-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold leading-6 text-primary-900">
                Télécharger un Document
              </h3>
              <button
                type="button"
                className="rounded-md bg-primary-50 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={onCancel}
              >
                <span className="sr-only">Fermer</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="px-4 py-5 sm:p-6 max-h-[80vh] overflow-y-auto">
            {displayError && (
              <div className="rounded-md bg-red-50 p-4 mb-6 shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erreur de Téléchargement</h3>
                    <div className="mt-1 text-sm text-red-700">{displayError}</div>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="rounded-md bg-green-50 p-4 mb-6 shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Document Téléchargé Avec Succès</h3>
                  </div>
                </div>
              </div>
            )}
                
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Two-column layout for form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-5">
                  {/* Title field */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
                      Titre <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Entrez le titre du document"
                        className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-colors"
                      />
                    </div>
                  </div>
                  
                  {/* Document type field */}
                  <div>
                    <label htmlFor="document_type" className="block text-sm font-medium leading-6 text-gray-900">
                      Type de Document <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <select
                        id="document_type"
                        name="document_type"
                        required
                        value={formData.document_type}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-colors"
                      >
                        <option value="">Sélectionner le type de document</option>
                        {Object.values(DocumentType).map(type => (
                          <option key={type} value={type}>
                            {documentTypeLabels[type]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Reference number field */}
                  <div>
                    <label htmlFor="reference_number" className="block text-sm font-medium leading-6 text-gray-900">
                      Numéro de Référence
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="reference_number"
                        id="reference_number"
                        value={formData.reference_number || ''}
                        onChange={handleChange}
                        placeholder="Ex: INV-2025-001"
                        className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-colors"
                      />
                    </div>
                  </div>
                  
                  {/* Date field */}
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium leading-6 text-gray-900">
                      Date du Document
                    </label>
                    <div className="mt-2">
                      <input
                        type="date"
                        name="date"
                        id="date"
                        value={formData.date || ''}
                        onChange={handleChange}
                        className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-colors"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Right column */}
                <div className="space-y-5">
                  {/* File upload field */}
                  <div>
                    <label htmlFor="file" className="block text-sm font-medium leading-6 text-gray-900">
                      Fichier de Document <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2">
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez</p>
                            <p className="text-xs text-gray-500">{fileName || 'PDF, JPEG, PNG, documents Word'}</p>
                          </div>
                          <input
                            id="file-upload"
                            name="file"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            required
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                        </label>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Formats pris en charge : PDF, JPEG, PNG, documents Word. Taille max : 10 Mo
                      </p>
                    </div>
                  </div>
                  
                  {/* Tags field */}
                  <div>
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
                        className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-colors"
                        style={{ height: '80px' }}
                      >
                        {tags.map(tag => (
                          <option key={tag.id} value={tag.id}>
                            {tag.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple tags</p>
                  </div>
                </div>
              </div>
              
              {/* Department selector - full width */}
              <div>
                <label className="block text-sm font-medium leading-6 text-gray-900">
                  Département et Dossier
                </label>
                <div className="mt-2">
                  <DepartmentSelector
                    selectedDepartment={selectedDepartment}
                    selectedFolder={selectedFolder}
                    onDepartmentChange={(id) => setSelectedDepartment(id)}
                    onFolderChange={(id) => setSelectedFolder(id)}
                    className="space-y-2"
                    refreshKey={folderRefreshKey}
                  />
                  <button
                    type="button"
                    onClick={() => setIsFolderManagerOpen(true)}
                    className="mt-2 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-primary-700 shadow border border-primary-200 hover:bg-primary-50"
                  >
                    Ajouter un dossier
                  </button>
                </div>
              </div>
              
              {/* Description - full width */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                  Description
                </label>
                <div className="mt-2">
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Ajoutez une description du document..."
                    className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 transition-colors"
                  />
                </div>
              </div>
              
              {/* Required fields note */}
              <div className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Champs obligatoires
              </div>
              
              {/* Form buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={onCancel}
                  className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto inline-flex justify-center items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-70 transition-colors"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      Télécharger
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <FolderManager
      isOpen={isFolderManagerOpen}
      onClose={() => setIsFolderManagerOpen(false)}
      departmentId={selectedDepartment}
      onFolderCreated={(folder) => {
        setFolderRefreshKey((k) => k + 1)
        setSelectedFolder(folder.id)
        setFormData(prev => ({ ...prev, folder: folder.id }))
      }}
    />
    </>
  )
}

