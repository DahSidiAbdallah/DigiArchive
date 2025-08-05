import { useEffect, useState } from 'react';
import { Folder } from '@/types/department.types';
import { getFolders, createFolder } from '@/services/department.service';

interface FolderManagerProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: number | null;
  onFolderCreated?: (folder: Folder) => void;
}

export default function FolderManager({ isOpen, onClose, departmentId, onFolderCreated }: FolderManagerProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [parent, setParent] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !departmentId) {
      setFolders([]);
      return;
    }
    const controller = new AbortController();
    const loadFolders = async () => {
      try {
        const data = await getFolders(departmentId, undefined, search, { signal: controller.signal });
        setFolders(data);
      } catch (err) {
        if (!(err instanceof DOMException)) {
          console.error('Failed to load folders:', err);
        }
      }
    };
    loadFolders();
    return () => controller.abort();
  }, [isOpen, departmentId, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId || !name.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const folder = await createFolder({ name, department: departmentId, parent });
      setName('');
      setParent(null);
      if (onFolderCreated) onFolderCreated(folder);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du dossier');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Gérer les dossiers</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {!departmentId ? (
          <p className="text-sm text-gray-600">Sélectionnez d'abord un département.</p>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Rechercher un dossier"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border rounded-md mb-4">
              <ul className="divide-y divide-gray-100">
                {folders.map((f) => (
                  <li key={f.id} className="p-2 text-sm text-gray-700">
                    {f.path}
                  </li>
                ))}
                {folders.length === 0 && (
                  <li className="p-2 text-sm text-gray-500">Aucun dossier trouvé.</li>
                )}
              </ul>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom du dossier</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dossier parent</label>
                <select
                  value={parent ?? ''}
                  onChange={(e) => setParent(e.target.value ? Number(e.target.value) : null)}
                  className="mt-1 w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Aucun</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.path}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium shadow-sm hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
                >
                  {isLoading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

