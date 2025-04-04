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

// Notification context type
export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  testNotification: () => void;
  connectionStatus: string;
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
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing...');

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Periodically check WebSocket status and update the connection status
  useEffect(() => {
    const checkWsStatus = setInterval(() => {
      const status = wsService.getStatus();
      setWsStatus(status);
      
      // Update the user-friendly connection status
      if (status === 'Connected') {
        setConnectionStatus('Connected to notification server');
      } else if (status === 'Connecting') {
        setConnectionStatus('Connecting to notification server...');
      } else if (status === 'Closed' || status === 'Closing') {
        setConnectionStatus('Disconnected from notification server');
      } else {
        setConnectionStatus(`WebSocket status: ${status}`);
      }
      
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

  // Listen for immediate notifications (like from registration)
  useEffect(() => {
    const handleImmediateNotification = (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log('Received immediate notification event:', event.detail);
        handleNewNotification(event.detail);
      }
    };
    
    document.addEventListener('notification-immediate', handleImmediateNotification);
    
    return () => {
      document.removeEventListener('notification-immediate', handleImmediateNotification);
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
        
        // Add to notifications list - using functional update to avoid closure issues
        setNotifications(prevNotifications => {
          const updated = [newNotification, ...prevNotifications].slice(0, 50); // Keep only last 50
          console.log('Updated notifications list length:', updated.length);
          
          // Force sync to localStorage immediately
          localStorage.setItem('notifications', JSON.stringify(updated));
          
          // Request browser notification permission if not granted yet
          if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
          
          // Show a browser notification if supported and permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('New User Registered', {
                body: `${userEmail} has just registered`
              });
            } catch (e) {
              console.error('Error showing browser notification:', e);
            }
          }
          
          return updated;
        });
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
      
      // Don't show an alert in normal operation, just log it
      console.log(`Notification received: ${JSON.stringify(data)}`);
      
      handleNewNotification(data);
    };
    
    // Store the handler in a ref so we can unsubscribe later
    callbackRef.current = handleWebSocketNotification;
    
    // Subscribe to notifications immediately
    if (callbackRef.current) {
      console.log('Subscribing to WebSocket notifications');
      wsService.subscribe(callbackRef.current);
      setIsWebSocketSetup(true);
    }
    
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
      setConnectionStatus('Disconnected');
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
        setConnectionStatus('Connecting...');
        
        // Subscribe to notifications after a short delay to ensure connection is established
        setTimeout(() => {
          // Subscribe to notifications
          if (callbackRef.current) {
            console.log('Subscribing to WebSocket notifications');
            wsService.subscribe(callbackRef.current);
            setIsWebSocketSetup(true);
            setConnectionStatus('Connected and subscribed');
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

  // Request browser notification permission if not already granted
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        testNotification,
        connectionStatus
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

// Export a helper function to create an immediate notification for new users
export const createNewUserNotification = (email: string) => {
  console.log('Creating immediate notification for newly registered user:', email);
  
  // Create a notification object
  const notification = {
    type: 'NEW_USER',
    data: { email }
  };
  
  // Dispatch a custom event to notify of the new user
  const event = new CustomEvent('notification-immediate', {
    detail: notification
  });
  
  document.dispatchEvent(event);
  
  return true;
};

export default NotificationContext; 