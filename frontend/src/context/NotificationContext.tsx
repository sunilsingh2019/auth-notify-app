import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import wsService from '../services/websocket';

// Notification type
export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  data: {
    email?: string;
    [key: string]: any;
  };
}

// NotificationContext type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  testNotification: () => void;
}

// Create notification context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider props
interface NotificationProviderProps {
  children: ReactNode;
}

// NotificationProvider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isAuthenticated } = useAuth();
  const callbackRef = useRef<((data: any) => void) | null>(null);
  const [isWebSocketSetup, setIsWebSocketSetup] = useState(false);
  const [wsStatus, setWsStatus] = useState<string>('Not connected');

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Periodically check WebSocket status (just for logging purposes)
  useEffect(() => {
    const checkWsStatus = setInterval(() => {
      const status = wsService.getStatus();
      setWsStatus(status);
      console.log('Current WebSocket status:', status);
    }, 5000);
    
    return () => clearInterval(checkWsStatus);
  }, []);

  // Listen for direct test notifications
  useEffect(() => {
    const handleDirectTest = (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log('Received direct test notification event:', event.detail);
        handleNewNotification(event.detail);
      }
    };
    
    document.addEventListener('notification-test', handleDirectTest);
    
    return () => {
      document.removeEventListener('notification-test', handleDirectTest);
    };
  }, []);

  // Test function to manually trigger a notification
  const testNotification = () => {
    console.log('Manually triggering test notification');
    const testData = {
      type: 'NEW_USER',
      data: {
        email: 'test@example.com'
      }
    };
    
    // Process the test notification
    handleNewNotification(testData);
  };

  // Handle notification data
  const handleNewNotification = (data: any) => {
    console.log('Processing notification data:', data);
    
    try {
      // Check if data is a string (sometimes WebSocket messages come as strings)
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          console.log('Parsed string data:', data);
        } catch (e) {
          console.error('Failed to parse string data:', e);
        }
      }
      
      // Validate data structure
      if (!data || !data.type) {
        console.error('Invalid notification data structure:', data);
        return;
      }
      
      if (data.type === 'NEW_USER') {
        // Extract email with fallback for different data structures
        let userEmail = 'Unknown User';
        
        if (data.data && data.data.email) {
          userEmail = data.data.email;
        } else if (data.email) {
          userEmail = data.email;
        }
        
        console.log('New user registered with email:', userEmail);
        
        // Create unique ID based on type and content
        const uniqueId = `${data.type}-${userEmail}-${Date.now()}`;
        
        // Create new notification
        const newNotification: Notification = {
          id: uniqueId,
          type: data.type,
          message: `New user registered: ${userEmail}`,
          read: false,
          createdAt: new Date().toISOString(),
          data: data.data || { email: userEmail }
        };
        
        // Log the current notifications before updating
        console.log('Current notifications before update:', notifications);
        console.log('Adding new notification to state:', newNotification);
        
        // Add to notifications list - using functional update to avoid closure issues
        setNotifications(prevNotifications => {
          const updated = [newNotification, ...prevNotifications].slice(0, 50); // Keep only last 50
          console.log('Updated notifications list length:', updated.length);
          
          // Force sync to localStorage immediately
          localStorage.setItem('notifications', JSON.stringify(updated));
          
          return updated;
        });
        
        // Debug: Check if notification was added
        setTimeout(() => {
          const currentNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
          console.log('Notifications in localStorage after update:', currentNotifications);
        }, 100);
        
        console.log('Notification update processed');
      } else {
        console.log('Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('Error processing notification:', error);
    }
  };

  // Set up a single callback for WebSocket notifications
  useEffect(() => {
    console.log('Setting up WebSocket notification callback');
    
    // Create a static handler that won't be recreated
    const handleWebSocketNotification = (data: any) => {
      console.log('WebSocket notification received:', data);
      handleNewNotification(data);
    };
    
    // Store the handler in a ref so we can unsubscribe later
    callbackRef.current = handleWebSocketNotification;
    
    // Clean up on unmount
    return () => {
      console.log('Unmounting notification context, cleaning up');
      // Make sure we don't leave any subscribers
      if (callbackRef.current) {
        console.log('Unsubscribing WebSocket callback on unmount');
        wsService.unsubscribe(callbackRef.current);
        callbackRef.current = null;
      }
    };
  }, []);

  // Handle WebSocket connection when authentication changes
  useEffect(() => {
    console.log('Auth state changed, isAuthenticated:', isAuthenticated);
    
    // Clean up existing connection and subscription
    const cleanup = () => {
      console.log('Cleaning up WebSocket connection');
      if (callbackRef.current) {
        wsService.unsubscribe(callbackRef.current);
      }
      wsService.disconnect();
      setIsWebSocketSetup(false);
    };
    
    // If user is authenticated and WebSocket is not set up, set up WebSocket
    if (isAuthenticated && !isWebSocketSetup) {
      console.log('Setting up WebSocket connection for authenticated user');
      
      // Clean up any existing connection
      cleanup();
      
      // Set up new connection with delay
      const setupTimeout = setTimeout(() => {
        console.log('Connecting to WebSocket...');
        wsService.connect();
        
        // Subscribe to notifications after a short delay to ensure connection is established
        setTimeout(() => {
          // Subscribe to notifications
          if (callbackRef.current) {
            console.log('Subscribing to WebSocket notifications');
            wsService.subscribe(callbackRef.current);
            setIsWebSocketSetup(true);
          }
        }, 1000);
        
        // Load saved notifications
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications) {
          try {
            const parsed = JSON.parse(savedNotifications);
            console.log('Loaded saved notifications from localStorage, count:', parsed.length);
            setNotifications(parsed);
          } catch (error) {
            console.error('Error parsing notifications from localStorage:', error);
          }
        }
      }, 1000);
      
      return () => {
        clearTimeout(setupTimeout);
      };
    } 
    else if (!isAuthenticated && isWebSocketSetup) {
      // If user is not authenticated but WebSocket is set up, clean up
      console.log('User is not authenticated, cleaning up WebSocket');
      cleanup();
    }
    
    return () => {}; // Empty cleanup for other cases
  }, [isAuthenticated, isWebSocketSetup]);

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (notifications.length > 0) {
      console.log('Saving notifications to localStorage, count:', notifications.length);
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        testNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext; 