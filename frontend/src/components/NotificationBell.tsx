import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/notification.types';
import { createPortal } from 'react-dom';

export default function NotificationBell() {
  const { unreadCount, notifications, loading, fetchRecentNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  
  // Update dropdown position
  const updateDropdownPosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchRecentNotifications();
      updateDropdownPosition();
    }
  }, [isOpen, fetchRecentNotifications]);
  
  // Update position when window is resized
  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition);
      
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition);
      };
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      updateDropdownPosition();
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAllAsRead();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };
  
  // Create notification dropdown portal
  const renderNotificationDropdown = () => {
    if (!isOpen) return null;
    
    return createPortal(
      <div 
        className="fixed z-[9999] mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none"
        style={{
          top: `${dropdownPosition.top}px`,
          right: `${dropdownPosition.right}px`,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                to={notification.document_id ? `/documents/${notification.document_id}` : '#'}
                className={`block px-4 py-3 hover:bg-gray-50 ${
                  notification.is_read ? 'bg-white' : 'bg-gray-50'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{notification.time_since}</p>
                  </div>
                  {!notification.is_read && (
                    <div className="ml-3 flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
        
        <div className="border-t border-gray-100 px-4 py-2">
          <Link
            to="/notifications"
            className="block text-center text-xs font-medium text-primary-600 hover:text-primary-800"
            onClick={() => setIsOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="relative z-[9999]" ref={dropdownRef}>
      <button
        type="button"
        className="relative rounded-full p-1 text-gray-700 hover:text-gray-900 focus:outline-none"
        onClick={toggleDropdown}
      >
        <span className="sr-only">View notifications</span>
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {renderNotificationDropdown()}
    </div>
  );
}
