import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Document, getDocument, deleteDocument, processDocumentOCR } from '@/services/document.service'
import DocumentOCRView from '@/components/DocumentOCRView'
import { useToast } from '@/contexts/ToastContext'
import EditDocumentModal from '@/components/EditDocumentModal'
import AuditLogViewer from '@/components/AuditLogViewer'

export default function EnhancedDocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [processingOCR, setProcessingOCR] = useState(false)

  useEffect(() => {
    const loadDocument = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        const docId = parseInt(id)
        if (isNaN(docId)) {
          throw new Error('Invalid document ID')
        }
        const doc = await getDocument(docId)
        setDocument(doc)
      } catch (err) {
        console.error('Error loading document:', err)
        setError('Impossible de charger le document')
        showError('Erreur', 'Impossible de charger le document')
      } finally {
        setLoading(false)
      }
    }

    loadDocument()
  }, [id, showError])

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleDocumentUpdated = async (updatedDocument: Document) => {
    // After a document update, fetch the full document again to ensure we have all related details
    if (updatedDocument && updatedDocument.id) {
      try {
        // Fetch the complete document with all related objects
        const refreshedDoc = await getDocument(updatedDocument.id)
        setDocument(refreshedDoc)
      } catch (err) {
        console.error('Error refreshing document after update:', err)
        // Still set the document from the update response as a fallback
        setDocument(updatedDocument)
      }
    } else {
      setDocument(updatedDocument)
    }
  }

  const handleProcessOCR = async () => {
    if (!document?.id) return;
    
    setProcessingOCR(true);
    
    try {
      await processDocumentOCR(document.id);
      // Refetch the document to get updated OCR status
      const updatedDocument = await getDocument(document.id);
      setDocument(updatedDocument);
      showSuccess('OCR Traitement', 'Le document a été traité avec OCR avec succès')
    } catch (err) {
      console.error('Error processing OCR:', err);
      showError('Erreur', 'Impossible de traiter le document avec OCR')
    } finally {
      setProcessingOCR(false);
    }
  };

  const handleDelete = async () => {
    if (!document?.id) return

    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.'
    )

    if (!confirmed) return

    try {
      setIsDeleting(true)
      await deleteDocument(document.id)
      showSuccess('Succès', 'Document supprimé avec succès')
      navigate('/documents')
    } catch (error) {
      console.error('Error deleting document:', error)
      showError('Erreur', 'Impossible de supprimer le document')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      )
    }
    if (fileType?.includes('image')) {
      return (
        <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Document non trouvé</h2>
          <p className="text-gray-600 mb-6">{error || 'Le document demandé n\'existe pas.'}</p>
          <Link
            to="/documents"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Retour aux documents
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/" className="text-gray-400 hover:text-gray-500">
                  Accueil
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <Link to="/documents" className="text-gray-400 hover:text-gray-500">
                  Documents
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li className="text-gray-500">{document.title}</li>
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Document Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(document.file_type || '')}
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
                      <p className="text-sm text-gray-500">{document.file_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleEdit}
                      className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Preview */}
              {document.file && (
                <div className="mb-4 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Aperçu du document</h3>
                  <div className="flex justify-center">
                    {(() => {
                      const fileUrl = typeof document.file === 'string' ? document.file : '';
                      const fileType = document.file_type || '';
                      
                      if (fileUrl && fileUrl.toLowerCase().endsWith('.pdf')) {
                        return (
                          <iframe 
                            src={fileUrl} 
                            title="Document PDF" 
                            className="w-full h-[600px] border rounded-lg shadow-sm"
                          />
                        );
                      } else if (
                        fileUrl && (
                          fileType.includes('image') || 
                          fileUrl.toLowerCase().endsWith('.jpg') || 
                          fileUrl.toLowerCase().endsWith('.jpeg') || 
                          fileUrl.toLowerCase().endsWith('.png')
                        )
                      ) {
                        return (
                          <img 
                            src={fileUrl} 
                            alt={document.title} 
                            className="max-h-[600px] rounded-lg shadow-sm object-contain"
                          />
                        );
                      } else {
                        return (
                          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg w-full">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2 text-gray-600">Ce type de fichier ne peut pas être prévisualisé</p>
                            {fileUrl && (
                              <a 
                                href={fileUrl}
                                download
                                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                              >
                                Télécharger le fichier
                              </a>
                            )}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Document Content */}
              <div className="px-6 py-4">
                {document.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{document.description}</p>
                  </div>
                )}

                {document.content_text && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Contenu extracté</h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{document.content_text}</p>
                    </div>
                  </div>
                )}
                
                {/* OCR Content */}
                {document.id && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Contenu OCR</h3>
                    <DocumentOCRView documentId={document.id} />
                  </div>
                )}

                {/* Tags */}
                {document.tags && document.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {document.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Audit Log Section */}
                {document.id && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Historique d'activité</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Consultez l'historique des actions effectuées sur ce document.
                    </p>
                    <AuditLogViewer documentId={document.id} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="text-sm text-gray-900">{document.document_type}</dd>
                </div>
                
                {document.reference_number && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Référence</dt>
                    <dd className="text-sm text-gray-900">{document.reference_number}</dd>
                  </div>
                )}

                {document.date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date du document</dt>
                    <dd className="text-sm text-gray-900">{formatDate(document.date)}</dd>
                  </div>
                )}

                {document.created_at && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date de création</dt>
                    <dd className="text-sm text-gray-900">{formatDate(document.created_at)}</dd>
                  </div>
                )}

                {document.file_size && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Taille</dt>
                    <dd className="text-sm text-gray-900">{formatFileSize(document.file_size)}</dd>
                  </div>
                )}

                {document.department && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Département</dt>
                    <dd className="text-sm text-gray-900">
                      {typeof document.department === 'object' && document.department !== null && 'name' in document.department
                        ? document.department.name
                        : document.department_details?.name || 'Chargement...'}
                    </dd>
                  </div>
                )}

                {document.folder && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Dossier</dt>
                    <dd className="text-sm text-gray-900">
                      {typeof document.folder === 'object' && document.folder !== null && 'name' in document.folder
                        ? document.folder.name
                        : document.folder_details?.name || 'Chargement...'}
                    </dd>
                  </div>
                )}

                {document.uploaded_by_username && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Téléchargé par</dt>
                    <dd className="text-sm text-gray-900">{document.uploaded_by_username}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {/* Download Button */}
                {document.file && typeof document.file === 'string' && (
                  <a
                    href={document.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Télécharger
                  </a>
                )}
                
                {document && !document.is_ocr_processed && (
                  <button
                    onClick={handleProcessOCR}
                    disabled={processingOCR}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-primary-300 shadow-sm text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-60"
                  >
                    {processingOCR ? (
                      <>
                        <svg className="animate-spin w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Traitement OCR...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Traiter avec OCR
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {document && (
        <EditDocumentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          document={document}
          onDocumentUpdated={handleDocumentUpdated}
        />
      )}
    </div>
  )
}
