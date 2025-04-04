import React, { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { testWebSocketConnection } from '../services/websocket';

const Notifications: React.FC = () => {
  const { notifications, markAllAsRead, clearNotifications, testNotification } = useNotifications();

  // Debugging code to check notifications
  useEffect(() => {
    console.log('Current notifications on Notifications page:', notifications);
    // Also check localStorage
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        console.log('localStorage notifications:', JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Error parsing localStorage notifications:', e);
      }
    } else {
      console.log('No notifications found in localStorage');
    }
    
    // Debug WebSocket connection
    console.log('Checking WebSocket connection from the frontend');
  }, [notifications]);

  // Test functions for debugging
  const runConnectionTest = () => {
    testWebSocketConnection();
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, typeof notifications>);

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>All Notifications</h1>
        <div className="notifications-actions">
          {notifications.length > 0 && (
            <>
              <button 
                className="btn-secondary" 
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
              <button 
                className="btn-danger" 
                onClick={clearNotifications}
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      {/* Debugging buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          className="btn-secondary" 
          onClick={testNotification}
          style={{ backgroundColor: '#4CAF50', color: 'white' }}
        >
          Test Notification
        </button>
        <button 
          className="btn-secondary" 
          onClick={runConnectionTest}
          style={{ backgroundColor: '#2196F3', color: 'white' }}
        >
          Check WebSocket
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <h2>No notifications yet</h2>
          <p>When you receive notifications, they will appear here.</p>
        </div>
      ) : (
        <div className="notifications-container">
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date} className="notification-group">
              <div className="date-header">
                <h3>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
              </div>
              
              <div className="notification-list">
                {items.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-card ${!notification.read ? 'unread' : ''}`}
                  >
                    <div className="notification-card-content">
                      <div className="notification-icon">
                        {notification.type === 'NEW_USER' && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        )}
                      </div>
                      <div className="notification-details">
                        <p className="notification-message">{notification.message}</p>
                        <p className="notification-time">{formatDate(notification.createdAt)}</p>
                      </div>
                    </div>
                    {!notification.read && <span className="unread-dot"></span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications; 