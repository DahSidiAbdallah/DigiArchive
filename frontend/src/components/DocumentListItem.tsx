import { Link } from 'react-router-dom';
import { Document } from '@/services/document.service';

interface DocumentListItemProps {
  document: Document;
}


export default function DocumentListItem({ document }: DocumentListItemProps) {
  // Format document type for display
  const formatDocumentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if document has a valid ID
  const hasValidId = document.id !== undefined && document.id !== null && !isNaN(Number(document.id));

  return (
    <li className="relative bg-white shadow-sm rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200 p-0 mb-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 px-6 py-5">
        {/* Left: Icon & Main Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Document Icon */}
          <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-inner">
            <svg className="h-7 w-7 text-primary-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" rx="3" className="fill-primary-50" />
              <path d="M8 8h8M8 12h8M8 16h4" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900 truncate" title={document.title}>{document.title}</span>
              {document.is_ocr_processed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 border border-green-200">
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  OCR Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700 border border-yellow-200">
                  <svg className="h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2" /></svg>
                  Processing
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-500">Type:</span>
                <span>{formatDocumentType(document.document_type)}</span>
              </div>
              {document.department && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-500">Dept:</span>
                  <span>{document.department.name}</span>
                </div>
              )}
              {document.folder && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-500">Folder:</span>
                  <span>{document.folder.name}</span>
                </div>
              )}
              {document.reference_number && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-500">Ref:</span>
                  <span>{document.reference_number}</span>
                </div>
              )}
              {document.date && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-500">Date:</span>
                  <span>{formatDate(document.date)}</span>
                </div>
              )}
            </div>
            {!hasValidId && (
              <p className="text-xs text-red-500 mt-2 font-medium">Document ID missing</p>
            )}
          </div>
        </div>
        {/* Right: Actions */}
        <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-4">
          {hasValidId ? (
            <Link
              to={`/documents/${document.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-primary-700 font-semibold shadow-sm hover:bg-primary-100 hover:text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 transition"
              title="View document details"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path d="M2 12C4 7 8 4 12 4s8 3 10 8-4 8-10 8-8-3-10-8z" /></svg>
              View
            </Link>
          ) : (
            <span
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-400 font-semibold cursor-not-allowed"
              title="Document ID missing"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path d="M2 12C4 7 8 4 12 4s8 3 10 8-4 8-10 8-8-3-10-8z" /></svg>
              View
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
