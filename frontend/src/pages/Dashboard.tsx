import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Dashboard() {
  const { user } = useAuth();

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
                <div className="text-2xl font-bold text-gray-900">0</div>
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
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Téléchargements Récents</div>
                <div className="text-2xl font-bold text-gray-900">0</div>
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
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Traités par OCR</div>
                <div className="text-2xl font-bold text-gray-900">0</div>
              </div>
            </div>
            <div className="mt-2">
              <Link to="/documents?filter=ocr" className="text-primary-700 hover:text-primary-900 text-sm font-semibold underline">Voir traités</Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Activité Récente</h3>
          <ul className="divide-y divide-gray-200">
            <li className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Aucune activité récente trouvée</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
