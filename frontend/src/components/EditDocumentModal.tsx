import React, { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Document, updateDocument, getTags } from '@/services/document.service'
import { Department, Folder } from '@/types/department.types'
import { getDepartments, getFolders } from '@/services/department.service'
import { DocumentType, documentTypeLabels } from '@/types/document.types'
import { useToast } from '@/contexts/ToastContext'

interface EditDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  document: Document
  onDocumentUpdated: (updatedDocument: Document) => void
}

export default function EditDocumentModal({ 
  isOpen, 
  onClose, 
  document, 
  onDocumentUpdated 
}: EditDocumentModalProps) {
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: '',
    reference_number: '',
    date: '',
    department: '',
    folder: '',
    tag_ids: [] as number[]
  })
  const [departments, setDepartments] = useState<Department[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [availableTags, setAvailableTags] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form state
  const resetFormState = () => {
    setErrors({});
    setLoading(false);
  }

  // Initialize form data when document changes
  useEffect(() => {
    if (document) {
      // Clean any potentially problematic values
      let cleanDocType = '';
      if (document.document_type) {
        cleanDocType = document.document_type.replace(/[\\'"]/g, '');
      }
      
      // Extract tag IDs as numbers to ensure they're properly handled
      const tagIds = document.tags?.map(tag => {
        if (tag.id !== undefined) {
          return typeof tag.id === 'string' ? parseInt(tag.id) : tag.id;
        }
        return null;
      }).filter(id => id !== null && !isNaN(id as number)) as number[] || [];
      
      console.log('Setting form with document type:', cleanDocType);
      console.log('Setting form with tag IDs:', tagIds);
      
      setFormData({
        title: document.title || '',
        description: document.description || '',
        document_type: cleanDocType,
        reference_number: document.reference_number || '',
        date: document.date || '',
        department: (document.department as any)?.toString() || '',
        folder: (document.folder as any)?.toString() || '',
        tag_ids: tagIds
      })
    }
  }, [document])

  // Load departments, folders, and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptResponse, tagsResponse] = await Promise.all([
          getDepartments(),
          getTags()
        ])
        setDepartments(deptResponse)
        setAvailableTags(tagsResponse)
      } catch (error) {
        console.error('Error loading data:', error)
        showError('Erreur', 'Impossible de charger les données')
      }
    }

    if (isOpen) {
      loadData()
    }
  }, [isOpen, showError])

  // Load folders when department changes
  useEffect(() => {
    const loadFolders = async () => {
      if (formData.department) {
        try {
          const foldersResponse = await getFolders(parseInt(formData.department))
          setFolders(foldersResponse)
        } catch (error) {
          console.error('Error loading folders:', error)
          setFolders([])
        }
      } else {
        setFolders([])
      }
    }

    loadFolders()
  }, [formData.department])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleTagToggle = (tagId: number) => {
    // Ensure tagId is a number
    const numericTagId = typeof tagId === 'string' ? parseInt(tagId) : tagId;
    
    if (isNaN(numericTagId)) {
      console.error('Invalid tag ID:', tagId);
      return;
    }
    
    console.log('Toggling tag ID:', numericTagId, typeof numericTagId);
    
    setFormData(prev => {
      // Check if the tag is already in the array
      const isTagIncluded = prev.tag_ids.some(id => id === numericTagId);
      
      // Create the updated tag_ids array
      const updatedTagIds = isTagIncluded
        ? prev.tag_ids.filter(id => id !== numericTagId)
        : [...prev.tag_ids, numericTagId];
      
      console.log('Updated tag_ids:', updatedTagIds);
      
      return {
        ...prev,
        tag_ids: updatedTagIds
      };
    });
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis'
    }

    if (!formData.document_type) {
      newErrors.document_type = 'Le type de document est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      if (!document.id) {
        throw new Error('Document ID is missing');
      }
      
      // Clone the form data to avoid modifying the state directly
      const updateData: Record<string, any> = {};
      
      // Only include non-empty fields or explicitly null values
      if (formData.title.trim()) updateData.title = formData.title.trim();
      if (formData.description.trim()) updateData.description = formData.description.trim();
      
      // Handle document_type - use the exact lowercase values the backend expects
      if (formData.document_type) {
        // Keep the value as is since we're now using the correct values in the select
        updateData.document_type = formData.document_type;
        
        // Debug the actual value being sent
        console.log('Document type value being sent:', updateData.document_type);
      }
      
      if (formData.reference_number.trim()) updateData.reference_number = formData.reference_number.trim();
      if (formData.date) updateData.date = formData.date;
      
      // Handle department - convert to number or null
      updateData.department = formData.department ? parseInt(formData.department) : null;

      // Handle folder - convert to number or null
      updateData.folder = formData.folder ? parseInt(formData.folder) : null;
      
      // Always include tag_ids as a clean array of numbers
      updateData.tag_ids = [];
      
      if (Array.isArray(formData.tag_ids) && formData.tag_ids.length > 0) {
        // Convert all tag IDs to numbers, filtering out any invalid values
        updateData.tag_ids = formData.tag_ids
          .map(id => {
            // If it's a string, try to parse it
            if (typeof id === 'string') {
              return parseInt(id, 10);
            } 
            // If it's already a number, just return it
            else if (typeof id === 'number') {
              return id;
            }
            return null;
          })
          // Remove any null values or NaN results
          .filter(id => id !== null && !isNaN(id as number)) as number[];
      }
          
      // Debug the actual tag_ids being sent
      console.log('Tag IDs being sent:', updateData.tag_ids);
      
      console.log('Submitting document update:', updateData);
      const updatedDocument = await updateDocument(document.id, updateData)
      onDocumentUpdated(updatedDocument)
      showSuccess('Succès', 'Document mis à jour avec succès')
      resetFormState()
      onClose()
    } catch (error) {
      console.error('Error updating document:', error)
      
      // More detailed error message with status code if available
      let errorMessage = 'Impossible de mettre à jour le document';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        const axiosError = error as any;
        
        // Include response status in the error message
        if (axiosError.response?.status) {
          errorMessage += ` (Status: ${axiosError.response.status})`;
        }
        
        // Add response data details to the error message
        if (axiosError.response?.data) {
          // Log the full error response for debugging
          console.log('Error response data:', axiosError.response.data);
          
          if (typeof axiosError.response.data === 'string') {
            errorMessage += `: ${axiosError.response.data}`;
          } else if (axiosError.response.data.detail) {
            errorMessage += `: ${axiosError.response.data.detail}`;
          } else if (axiosError.response.data.non_field_errors) {
            errorMessage += `: ${axiosError.response.data.non_field_errors.join(', ')}`;
          } else {
            // Handle field-specific errors
            const fieldErrors = Object.entries(axiosError.response.data)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            
            if (fieldErrors) {
              errorMessage += `: ${fieldErrors}`;
            }
          }
        }
      }
      
      showError('Erreur', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {
        resetFormState();
        onClose();
      }}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-6">
                  Modifier le document
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Titre *
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                        errors.title ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  {/* Document Type */}
                  <div>
                    <label htmlFor="document_type" className="block text-sm font-medium text-gray-700">
                      Type de document *
                    </label>
                    <select
                      name="document_type"
                      id="document_type"
                      value={formData.document_type}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData(prev => ({
                          ...prev,
                          document_type: value
                        }))
                        if (errors.document_type) {
                          setErrors(prev => ({ ...prev, document_type: '' }))
                        }
                        console.log('Selected document_type:', value)
                      }}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                        errors.document_type ? 'border-red-300' : ''
                      }`}
                    >
                      <option value="">Sélectionner un type</option>
                      {Object.values(DocumentType).map((type) => (
                        <option key={type} value={type}>
                          {documentTypeLabels[type]}
                        </option>
                      ))}
                    </select>
                    {errors.document_type && (
                      <p className="mt-1 text-sm text-red-600">{errors.document_type}</p>
                    )}
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label htmlFor="reference_number" className="block text-sm font-medium text-gray-700">
                      Numéro de référence
                    </label>
                    <input
                      type="text"
                      name="reference_number"
                      id="reference_number"
                      value={formData.reference_number}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                      Département
                    </label>
                    <select
                      name="department"
                      id="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    >
                      <option value="">Sélectionner un département</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Folder */}
                  {formData.department && (
                    <div>
                      <label htmlFor="folder" className="block text-sm font-medium text-gray-700">
                        Dossier
                      </label>
                      <select
                        name="folder"
                        id="folder"
                        value={formData.folder}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      >
                        <option value="">Sélectionner un dossier</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => {
                        // Ensure tag.id is a number
                        const tagId = typeof tag.id === 'string' ? parseInt(tag.id) : (tag.id || 0);
                        
                        return (
                          <button
                            key={tagId}
                            type="button"
                            onClick={() => handleTagToggle(tagId)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              formData.tag_ids.some(id => id === tagId)
                                ? 'bg-primary-100 text-primary-800 border-primary-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                            } border`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        resetFormState();
                        onClose();
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
