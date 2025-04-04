import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import wsService from '../services/websocket';
import { useAuth } from './AuthContext';

// WebSocket context type
interface WebSocketContextType {
  connect: () => void;
  disconnect: () => void;
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

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('WebSocketProvider: User is authenticated, connecting to WebSocket');
      wsService.connect();

      // Clean up
      return () => {
        console.log('WebSocketProvider: Cleaning up WebSocket connection');
        wsService.disconnect();
      };
    }
  }, [isAuthenticated]);

  // Context value
  const value = {
    connect: () => wsService.connect(),
    disconnect: () => wsService.disconnect(),
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
