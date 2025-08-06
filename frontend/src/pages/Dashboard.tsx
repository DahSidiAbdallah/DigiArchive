import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getDocuments, Document } from '@/services/document.service'
import { notificationService } from '@/services/notification.service'
import { Notification } from '@/types/notification.types'

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documentStats, setDocumentStats] = useState({
    total: 0,
    recent: 0,
    ocrProcessed: 0
  });
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchDocumentStats = async () => {
      setLoading(true);
      try {
        // Fetch all documents to get the count
        const allDocuments = await getDocuments(1, '', { limit: 100 });
        
        // Calculate total documents
        const total = allDocuments.count;
        
        // Get recent documents (uploaded in the last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentDocs = allDocuments.results.filter(doc => 
          doc.created_at && new Date(doc.created_at) > oneWeekAgo
        );
        
        // Get OCR processed documents
        const ocrProcessed = allDocuments.results.filter(doc => 
          doc.is_ocr_processed === true
        ).length;
        
        // Set document statistics
        setDocumentStats({
          total,
          recent: recentDocs.length,
          ocrProcessed
        });
        
        // Get the 5 most recent documents
        const sortedDocuments = [...allDocuments.results].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        
        setRecentDocuments(sortedDocuments.slice(0, 5));
      } catch (error) {
        console.error('Error fetching document statistics:', error);
      }
    };
    
    const fetchRecentNotifications = async () => {
      try {
        const notifications = await notificationService.getRecentNotifications();
        setRecentNotifications(notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    Promise.all([fetchDocumentStats(), fetchRecentNotifications()])
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  const getDocumentTypeIcon = (documentType: string) => {
    switch(documentType) {
      case 'invoice':
        return (
          <div className="bg-blue-100 rounded-lg p-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'contract':
        return (
          <div className="bg-purple-100 rounded-lg p-2">
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 rounded-lg p-2">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl font-extrabold text-gray-900">Bienvenue, {user?.username || 'Utilisateur'}</h2>
            <p className="mt-1 text-gray-500 text-base">Voici un aperçu de vos documents et de l'activité récente.</p>
          </div>
          <div>
            <Link
              to="/documents"
              state={{ openUploadModal: true }}
              className="inline-flex items-center rounded-lg bg-primary-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Télécharger un document
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {/* Total Documents */}
          <div className="rounded-2xl bg-white shadow p-6 flex flex-col gap-2 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Documents Totaux</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse h-7 w-12 bg-gray-200 rounded"></div>
                  ) : (
                    documentStats.total
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <Link to="/documents" className="text-primary-700 hover:text-primary-900 text-sm font-semibold underline">Voir tous</Link>
            </div>
          </div>
          {/* Recent Uploads */}
          <div className="rounded-2xl bg-white shadow p-6 flex flex-col gap-2 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Téléchargements Récents</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse h-7 w-12 bg-gray-200 rounded"></div>
                  ) : (
                    documentStats.recent
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <Link to="/documents?sort=recent" className="text-primary-700 hover:text-primary-900 text-sm font-semibold underline">Voir récents</Link>
            </div>
          </div>
          {/* OCR Processed */}
          <div className="rounded-2xl bg-white shadow p-6 flex flex-col gap-2 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Traités par OCR</div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="animate-pulse h-7 w-12 bg-gray-200 rounded"></div>
                  ) : (
                    documentStats.ocrProcessed
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <Link to="/documents?filter=ocr" className="text-primary-700 hover:text-primary-900 text-sm font-semibold underline">Voir traités</Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Documents Récents</h3>
          <ul className="divide-y divide-gray-200">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <li key={index} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="animate-pulse h-10 w-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="animate-pulse h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                      <div className="animate-pulse h-3 w-1/2 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </li>
              ))
            ) : recentDocuments.length === 0 ? (
              <li className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Aucun document récent trouvé</span>
                </div>
              </li>
            ) : (
              recentDocuments.map(document => (
                <li key={document.id} className="py-4">
                  <Link to={`/documents/${document.id}`} className="block">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getDocumentTypeIcon(document.document_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {document.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {document.document_type} • {formatDate(document.created_at || '')}
                        </p>
                      </div>
                      <div>
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
          
          {/* Notifications Section */}
          <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Activités Récentes</h3>
          <ul className="divide-y divide-gray-200">
            {loading ? (
              // Loading skeleton for notifications
              Array.from({ length: 2 }).map((_, index) => (
                <li key={index} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="animate-pulse h-4 w-full bg-gray-200 rounded mb-2"></div>
                      <div className="animate-pulse h-3 w-1/3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </li>
              ))
            ) : recentNotifications.length === 0 ? (
              <li className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Aucune activité récente trouvée</span>
                </div>
              </li>
            ) : (
              recentNotifications.map(notification => (
                <li key={notification.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        notification.is_read ? 'bg-gray-100 text-gray-600' : 'bg-primary-100 text-primary-600'
                      }`}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${notification.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
