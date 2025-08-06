/**
 * Document types for the application.
 */
import { Department, Folder } from './department.types';

export interface Tag {
  id: number;
  name: string;
}

export interface OCRData {
  id: number;
  full_text: string;
  processed_at: string;
}

export interface Document {
  id: number;
  title: string;
  document_type: string;
  department?: number | Department | null;
  folder?: number | Folder | null;
  file: string | File;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  description: string;
  reference_number: string;
  date: string | null;
  upload_date?: string;
  tags: Tag[];
  uploaded_by: number;
  uploaded_by_username: string;
  created_at: string;
  updated_at: string;
  content_text: string;
  is_ocr_processed: boolean;
  ocr_data?: OCRData;
  status?: string;
}

export enum DocumentType {
  INVOICE = 'invoice',
  BILL_OF_LADING = 'bill_of_lading',
  TRANSFER_REQUEST = 'transfer_request',
  CONTRACT = 'contract',
  CERTIFICATE = 'certificate',
  REPORT = 'report',
  OTHER = 'other',
}

export const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.INVOICE]: 'Invoice (Facture)',
  [DocumentType.BILL_OF_LADING]: 'Bill of Lading (BL)',
  [DocumentType.TRANSFER_REQUEST]: 'Transfer Request (Demande de transfert)',
  [DocumentType.CONTRACT]: 'Contract (Contrat)',
  [DocumentType.CERTIFICATE]: 'Certificate (Certificat)',
  [DocumentType.REPORT]: 'Report (Rapport)',
  [DocumentType.OTHER]: 'Other (Autre)',
};
