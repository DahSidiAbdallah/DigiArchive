/**
 * Department service for fetching department data.
 */
import api from './api';
import { Department, Folder } from '@/types/department.types';
import { AxiosRequestConfig } from 'axios';

/**
 * Get all departments
 */
export const getDepartments = async (): Promise<Department[]> => {
  const response = await api.get<Department[]>('/departments/');
  return response.data;
};

/**
 * Get a single department by ID
 */
export const getDepartment = async (id: number): Promise<Department> => {
  const response = await api.get<Department>(`/departments/${id}/`);
  return response.data;
};

/**
 * Create a new department
 */
export const createDepartment = async (departmentData: Partial<Department>): Promise<Department> => {
  const response = await api.post<Department>('/departments/', departmentData);
  return response.data;
};

/**
 * Update a department
 */
export const updateDepartment = async (id: number, departmentData: Partial<Department>): Promise<Department> => {
  const response = await api.patch<Department>(`/departments/${id}/`, departmentData);
  return response.data;
};

/**
 * Delete a department
 */
export const deleteDepartment = async (id: number): Promise<void> => {
  await api.delete(`/departments/${id}/`);
};

/**
 * Get all folders
 */
export const getFolders = async (
  departmentId?: number,
  parentId?: number | null,
  search?: string,
  config?: AxiosRequestConfig
): Promise<Folder[]> => {
  let url = '/folders/';
  const params: Record<string, string> = {};

  if (departmentId !== undefined) {
    params.department = departmentId.toString();
  }

  if (parentId !== undefined) {
    params.parent = parentId === null ? 'null' : parentId.toString();
  }

  if (search) {
    params.search = search;
  }

  const response = await api.get<Folder[]>(url, { params, ...(config || {}) });
  return response.data;
};

/**
 * Get a single folder by ID
 */
export const getFolder = async (id: number): Promise<Folder> => {
  const response = await api.get<Folder>(`/folders/${id}/`);
  return response.data;
};

/**
 * Create a new folder
 */
export const createFolder = async (folderData: Partial<Folder>): Promise<Folder> => {
  const response = await api.post<Folder>('/folders/', folderData);
  return response.data;
};

/**
 * Update a folder
 */
export const updateFolder = async (id: number, folderData: Partial<Folder>): Promise<Folder> => {
  const response = await api.patch<Folder>(`/folders/${id}/`, folderData);
  return response.data;
};

/**
 * Delete a folder
 */
export const deleteFolder = async (id: number): Promise<void> => {
  await api.delete(`/folders/${id}/`);
};
