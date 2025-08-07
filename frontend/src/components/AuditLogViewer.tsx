import { useState, useEffect } from 'react'
import api from '@/services/api'

interface AuditLogEntry {
  id: number;
  user: {
    id: number;
    username: string;
    full_name: string;
  } | null;
  action_type: string;
  content_type: {
    id: number;
    model: string;
    app_label: string;
  };
  object_id: number;
  timestamp: string;
  description: string;
  changes?: Record<string, { old: any; new: any }> | null;
}

interface AuditLogViewerProps {
  documentId: number;
}

const actionTypeLabels: Record<string, string> = {
  'create': 'Création',
  'update': 'Mise à jour',
  'delete': 'Suppression',
  'view': 'Consultation',
  'download': 'Téléchargement',
  'share': 'Partage',
  'ocr': 'Traitement OCR',
  'tag': 'Ajout de tag',
  'untag': 'Retrait de tag',
  'move': 'Déplacement'
};

const actionTypeColors: Record<string, string> = {
  'create': 'bg-green-100 text-green-800',
  'update': 'bg-blue-100 text-blue-800',
  'delete': 'bg-red-100 text-red-800',
  'view': 'bg-gray-100 text-gray-800',
  'download': 'bg-indigo-100 text-indigo-800',
  'share': 'bg-purple-100 text-purple-800',
  'ocr': 'bg-yellow-100 text-yellow-800',
  'tag': 'bg-teal-100 text-teal-800',
  'untag': 'bg-orange-100 text-orange-800',
  'move': 'bg-cyan-100 text-cyan-800'
};

export default function AuditLogViewer({ documentId }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/documents/${documentId}/audit-logs/`);
        setLogs(response.data);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setError('Impossible de charger les logs d\'activité');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [documentId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleLogExpansion = (logId: number) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-md">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="p-4 bg-gray-50 rounded-md">
        <p className="text-gray-500">Aucun historique d'activité disponible pour ce document.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Action</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Utilisateur</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleLogExpansion(log.id)}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                  {formatDate(log.timestamp)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionTypeColors[log.action_type] || 'bg-gray-100 text-gray-800'}`}>
                    {actionTypeLabels[log.action_type] || log.action_type}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {log.user ? log.user.full_name || log.user.username : 'Système'}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  {log.description}
                  
                  {log.changes && expandedLogs[log.id] && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs">
                      <h4 className="font-medium text-gray-700 mb-1">Modifications:</h4>
                      <ul className="space-y-1">
                        {Object.entries(log.changes).map(([field, change]) => (
                          <li key={field} className="flex flex-col">
                            <span className="font-medium">{field}</span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-red-600">Avant: </span>
                                <span className="text-gray-600">{JSON.stringify(change.old) || '(vide)'}</span>
                              </div>
                              <div>
                                <span className="text-green-600">Après: </span>
                                <span className="text-gray-600">{JSON.stringify(change.new) || '(vide)'}</span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
