import { useEffect, useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Notification } from '@/types/notification.types'
import { useToast } from '@/contexts/ToastContext'

export default function Notifications() {
  const { notifications, loading, error, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  // Toggle select all notifications
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    if (newSelectAll) {
      const filteredNotifications = filterNotifications(notifications);
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };
  
  // Toggle select individual notification
  const handleSelectNotification = (id: number) => {
    setSelectedNotifications(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // Mark selected notifications as read
  const markSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      // Get only unread notifications from the selected ones
      const unreadSelectedNotifications = selectedNotifications.filter(id => {
        const notification = notifications.find(n => n.id === id);
        return notification && !notification.is_read;
      });
      
      if (unreadSelectedNotifications.length === 0) {
        addToast({
          title: 'Info',
          message: 'No unread notifications selected',
          type: 'info'
        });
        return;
      }
      
      // Mark each selected notification as read
      await Promise.all(unreadSelectedNotifications.map(id => markAsRead(id)));
      
      // Clear selection and refresh
      setSelectedNotifications([]);
      setSelectAll(false);
      fetchNotifications();
      
      addToast({
        title: 'Success',
        message: `${unreadSelectedNotifications.length} notification${unreadSelectedNotifications.length > 1 ? 's' : ''} marked as read`,
        type: 'success'
      });
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      addToast({
        title: 'Error',
        message: 'Failed to mark notifications as read',
        type: 'error'
      });
    }
  };
  
  // Filter notifications based on filter type
  const filterNotifications = (notifs: Notification[]) => {
    if (filterType === 'all') return notifs;
    if (filterType === 'unread') return notifs.filter(n => !n.is_read);
    if (filterType === 'read') return notifs.filter(n => n.is_read);
    
    // Filter by notification type
    return notifs.filter(n => n.notification_type === filterType);
  };

  // Get unique notification types for filter
  const notificationTypes = [...new Set(notifications.map(n => n.notification_type))];
  
  // Apply filters to notifications
  const filteredNotifications = filterNotifications(notifications);
  
  // Count notifications by status
  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = totalCount - unreadCount;
  
  // Count notifications by type - used in filter buttons

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Notifications</h2>
          <p className="mt-1 text-sm text-gray-500">All your important notifications and system alerts are listed here.</p>
        </div>
      </div>
      
      {/* Notification Stats */}
      {totalCount > 0 && (
        <div className="mb-8">
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Total Notifications</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{totalCount}</dd>
            </div>
            
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Unread Notifications</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-primary-600">{unreadCount}</dd>
            </div>
            
            <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
              <dt className="truncate text-sm font-medium text-gray-500">Read Notifications</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-500">{readCount}</dd>
            </div>
          </dl>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div className="min-w-0 flex-1">
          {filteredNotifications.length > 0 && (
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredNotifications.length}</span> 
              {filterType !== 'all' && ` filtered`} notifications
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedNotifications.length > 0 && (
            <button
              type="button"
              onClick={markSelectedAsRead}
              className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Mark Selected ({selectedNotifications.length}) as Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="inline-flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>
      
      {/* Filters */}
      {notifications.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter notifications:</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                filterType === 'all' 
                  ? 'bg-primary-600 text-white border-primary-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                filterType === 'unread' 
                  ? 'bg-primary-600 text-white border-primary-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Unread ({notifications.filter(n => !n.is_read).length})
            </button>
            <button
              onClick={() => setFilterType('read')}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                filterType === 'read' 
                  ? 'bg-primary-600 text-white border-primary-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Read ({notifications.filter(n => n.is_read).length})
            </button>
            {notificationTypes.map(type => {
              // Count notifications of this type
              const typeCount = notifications.filter(n => n.notification_type === type).length;
              
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                    filterType === type 
                      ? 'bg-primary-600 text-white border-primary-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type.replace(/_/g, ' ')} ({typeCount})
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-r-transparent"></div>
            <span className="mt-4 text-gray-500">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">You don't have any notifications yet.</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">No matching notifications</h3>
            <p className="mt-1 text-sm text-gray-500">Try changing your filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                        checked={selectAll}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectAll();
                        }}
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <tr 
                    key={notification.id} 
                    className={`group transition-colors hover:bg-gray-50 ${notification.is_read ? '' : 'bg-primary-50'}`}
                    onClick={(e) => {
                      // Prevent row click if clicking on checkbox or buttons
                      if ((e.target as HTMLElement).closest('input, button, a')) {
                        return;
                      }
                      // Show notification detail in modal
                      setSelectedNotification(notification);
                      setDetailModalOpen(true);
                      
                      // Mark as read if unread
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                    }}
                    style={{ cursor: notification.document_id ? 'pointer' : 'default' }}
                  >
                    <td className="px-3 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => handleSelectNotification(notification.id)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {!notification.is_read && <span className="h-2 w-2 rounded-full bg-primary-500"></span>}
                        <span className={`font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{notification.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                        {notification.notification_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{notification.message}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{notification.time_since}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {notification.document_id && (
                          <button
                            className="text-xs font-medium text-primary-600 hover:text-primary-800 underline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = `/documents/${notification.document_id}`;
                            }}
                          >
                            View document
                          </button>
                        )}
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAsRead(notification.id);
                              // Refresh to update UI state
                              setTimeout(() => {
                                fetchNotifications();
                              }, 300);
                            }}
                            className="text-xs font-medium text-primary-600 hover:text-primary-800 underline"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Notification Detail Modal */}
      {detailModalOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setDetailModalOpen(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setDetailModalOpen(false)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {selectedNotification.title}
                  </h3>
                  
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold leading-5 text-green-800">
                          {selectedNotification.notification_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-500">{selectedNotification.time_since}</span>
                      </div>
                      
                      <div className="mt-4 bg-gray-50 p-4 rounded-md">
                        <p className="text-sm text-gray-700">{selectedNotification.message}</p>
                      </div>
                    </div>
                    
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      {selectedNotification.document_id && (
                        <button
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDetailModalOpen(false);
                            setTimeout(() => {
                              window.location.href = `/documents/${selectedNotification.document_id}`;
                            }, 50);
                          }}
                        >
                          View Document
                        </button>
                      )}
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={() => setDetailModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
