import React, { useEffect, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import '../styles/NotificationPopup.css';

const NotificationPopup: React.FC = () => {
  const { notifications } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<Array<{id: string, message: string}>>([]);

  // Process new notifications to show them as toasts
  useEffect(() => {
    if (notifications.length > 0) {
      const mostRecent = notifications[0];

      // Check if this notification is already visible
      if (!visibleNotifications.some(n => n.id === mostRecent.id)) {
        console.log("Adding new notification to popup:", mostRecent);
        
        // Add the notification to visible list
        setVisibleNotifications(prev => [...prev, {
          id: mostRecent.id,
          message: mostRecent.message
        }]);

        // Remove it after 5 seconds
        setTimeout(() => {
          setVisibleNotifications(prev => 
            prev.filter(n => n.id !== mostRecent.id)
          );
        }, 5000);
      }
    }
  }, [notifications]);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {visibleNotifications.map(notification => (
        <div key={notification.id} className="notification-toast">
          <div className="notification-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          <div className="notification-content">
            <div className="notification-title">New Notification</div>
            <div className="notification-message">{notification.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationPopup;
