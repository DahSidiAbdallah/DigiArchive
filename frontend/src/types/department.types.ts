/**
 * Department types for the application.
 */

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  parent: number | null;
  folders: Folder[];
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: number;
  name: string;
  department: number | Department;  // Department can be either the ID or the full department object
  parent: number | null;
  description: string;
  path: string;
  created_at: string;
  updated_at: string;
}
