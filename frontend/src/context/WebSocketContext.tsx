import React, { createContext, useContext, useEffect, ReactNode, useState, useCallback } from 'react';
import wsService from '../services/websocket';
import { useAuth } from './AuthContext';

// WebSocket context type
interface WebSocketContextType {
  connect: () => void;
  disconnect: () => void;
  connectionAttempts: number;
  manualConnect: () => void;
}

// Create WebSocket context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// WebSocket provider props
interface WebSocketProviderProps {
  children: ReactNode;
}

// WebSocket provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastTokenCheck, setLastTokenCheck] = useState('');
  
  // Initialize connection
  const initializeConnection = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('WebSocketProvider: No token found, cannot connect');
      return;
    }
    
    // Only connect if token has changed
    if (token !== lastTokenCheck) {
      console.log('WebSocketProvider: Token changed, reconnecting WebSocket');
      setLastTokenCheck(token);
      
      // Disconnect any existing connection first
      wsService.disconnect();
      
      // Attempt connection with a slight delay to allow token to be fully set in localStorage
      setTimeout(() => {
        console.log('WebSocketProvider: Initiating WebSocket connection');
        wsService.connect();
        
        // Track connection attempts for debugging
        setConnectionAttempts(prev => prev + 1);
      }, 500);
    }
  }, [lastTokenCheck]);
  
  // Manual connection function
  const manualConnect = useCallback(() => {
    console.log('WebSocketProvider: Manual connection requested');
    // Force token check to be reset so it will reconnect
    setLastTokenCheck('');
    
    // Check again in next render cycle
    setTimeout(() => {
      initializeConnection();
    }, 100);
  }, [initializeConnection]);
  
  // Connect to WebSocket when authenticated
  useEffect(() => {
    console.log('WebSocketProvider: Auth state changed, isAuthenticated:', isAuthenticated);
    
    let connectionTimer: number | null = null;
    
    if (isAuthenticated) {
      console.log('WebSocketProvider: User is authenticated, will connect to WebSocket');
      initializeConnection();
    } else {
      // Disconnect when not authenticated
      console.log('WebSocketProvider: User not authenticated, disconnecting WebSocket');
      wsService.disconnect();
    }
    
    return () => {
      if (connectionTimer) window.clearTimeout(connectionTimer);
    };
  }, [isAuthenticated, initializeConnection]);
  
  // Poll for token changes every 5 seconds
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        initializeConnection();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, initializeConnection]);
  
  // Re-attempt connection periodically if authenticated
  useEffect(() => {
    let reconnectInterval: number | null = null;
    
    if (isAuthenticated) {
      reconnectInterval = window.setInterval(() => {
        const status = wsService.getStatus();
        if (status !== 'Connected' && status !== 'Connecting') {
          console.log('WebSocketProvider: Detected disconnected state, reconnecting...');
          wsService.connect();
        }
      }, 30000); // Check every 30 seconds
    }
    
    return () => {
      if (reconnectInterval) window.clearInterval(reconnectInterval);
    };
  }, [isAuthenticated]);

  // Monitor for token changes in localStorage and reconnect
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue) {
        console.log('WebSocketProvider: Token changed in localStorage, reconnecting WebSocket');
        setLastTokenCheck('');
        setTimeout(() => {
          initializeConnection();
        }, 500);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initializeConnection]);

  // Context value
  const value = {
    connect: () => wsService.connect(),
    disconnect: () => wsService.disconnect(),
    connectionAttempts,
    manualConnect,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

// Custom hook to use WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Export the context for testing purposes, but primarily use the hook
export { WebSocketContext };
