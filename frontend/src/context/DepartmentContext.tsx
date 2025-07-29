import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDepartments, getFolders } from '@/services/department.service';
import { Department, Folder } from '@/types/department.types';

interface DepartmentContextProps {
  departments: Department[];
  folders: Folder[];
  selectedDepartment: number | null;
  selectedFolder: number | null;
  setSelectedDepartment: (id: number | null) => void;
  setSelectedFolder: (id: number | null) => void;
}

const DepartmentContext = createContext<DepartmentContextProps | undefined>(undefined);

export const DepartmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!selectedDepartment) {
        setFolders([]);
        return;
      }

      try {
        const data = await getFolders(selectedDepartment);
        setFolders(data);
      } catch (error) {
        console.error('Failed to fetch folders:', error);
      }
    };

    fetchFolders();
  }, [selectedDepartment]);

  return (
    <DepartmentContext.Provider
      value={{
        departments,
        folders,
        selectedDepartment,
        selectedFolder,
        setSelectedDepartment,
        setSelectedFolder,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
};

export const useDepartmentContext = () => {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error('useDepartmentContext must be used within a DepartmentProvider');
  }
  return context;
};
