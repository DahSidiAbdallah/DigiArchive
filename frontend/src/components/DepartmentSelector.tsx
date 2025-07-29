import { useState, useEffect } from 'react';
import { Department, Folder } from '@/types/department.types';
import { getDepartments, getFolders } from '@/services/department.service';

interface DepartmentSelectorProps {
  selectedDepartment: number | null;
  selectedFolder: number | null;
  onDepartmentChange: (departmentId: number | null) => void;
  onFolderChange: (folderId: number | null) => void;
  className?: string;
}

export default function DepartmentSelector({
  selectedDepartment,
  selectedFolder,
  onDepartmentChange,
  onFolderChange,
  className = ''
}: DepartmentSelectorProps) {
  // State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const departmentsData = await getDepartments();
        setDepartments(departmentsData);
      } catch (err: any) {
        console.error('Error fetching departments:', err);
        setError('Failed to load departments');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDepartments();
  }, []);
  
  // Fetch folders when department changes
  useEffect(() => {
    const fetchFolders = async () => {
      if (!selectedDepartment) {
        setFolders([]);
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      try {
        const foldersData = await getFolders(selectedDepartment);
        setFolders(foldersData);
        
        // If the currently selected folder doesn't belong to this department,
        // reset the folder selection
        if (selectedFolder && !foldersData.some(f => f.id === selectedFolder)) {
          onFolderChange(null);
        }
      } catch (err: any) {
        console.error('Error fetching folders:', err);
        setError('Failed to load folders');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFolders();
  }, [selectedDepartment, selectedFolder, onFolderChange]);
  
  // Handler for department change
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const departmentId = e.target.value === '' ? null : Number(e.target.value);
    onDepartmentChange(departmentId);
    // Reset folder when department changes
    onFolderChange(null);
  };
  
  // Handler for folder change
  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const folderId = e.target.value === '' ? null : Number(e.target.value);
    onFolderChange(folderId);
  };
  
  return (
    <div className={`flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 ${className}`}>
      <div className="w-full sm:w-1/2">
        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
          Département
        </label>
        <select
          id="department"
          name="department"
          value={selectedDepartment?.toString() || ''}
          onChange={handleDepartmentChange}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
        >
          <option value="">Tous les départements</option>
          {departments.map(department => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
      
      <div className="w-full sm:w-1/2">
        <label htmlFor="folder" className="block text-sm font-medium text-gray-700">
          Dossier
        </label>
        <select
          id="folder"
          name="folder"
          value={selectedFolder?.toString() || ''}
          onChange={handleFolderChange}
          disabled={isLoading || !selectedDepartment}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
        >
          <option value="">Tous les dossiers</option>
          {folders.map(folder => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
