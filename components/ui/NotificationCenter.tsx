
import React, { useState, useEffect, useRef } from 'react';
import { User, Notification } from '../../types';
import { subscribe, markAsRead, markAllAsRead } from '../../services/notificationService';

interface Props {
  user: User;
}

const NotificationCenter: React.FC<Props> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = subscribe((allNotifications) => {
      // Filter for current user
      const userNotifications = allNotifications
        .filter(n => n.recipientId === user.id || n.recipientId === 'ALL')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setNotifications(userNotifications);
    });

    return () => unsubscribe();
  }, [user.id]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead(user.id);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'ALERT': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'REMINDER': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case 'INFO': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ALERT': return 'fa-circle-exclamation';
      case 'REMINDER': return 'fa-clock';
      case 'INFO': return 'fa-circle-info';
      default: return 'fa-bell';
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <i className={`fa-regular fa-bell text-lg ${unreadCount > 0 ? 'animate-swing' : ''}`}></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-down origin-top-right">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center text-slate-400 dark:text-slate-500">
                <i className="fa-regular fa-bell-slash text-3xl mb-3 opacity-50"></i>
                <p className="text-sm">No notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleMarkRead(notif.id)}
                    className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer relative group ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${getTypeStyles(notif.type)}`}>
                        <i className={`fa-solid ${getTypeIcon(notif.type)}`}></i>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.read ? 'font-semibold text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          {formatTime(notif.timestamp)}
                          {notif.senderId !== 'SYSTEM' && <span>• from {notif.senderId === 'ADMIN' ? 'Admin' : notif.senderId === 'f-demo' ? 'Faculty' : notif.senderId}</span>}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-center">
             <button className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium py-1">
               View All History
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
