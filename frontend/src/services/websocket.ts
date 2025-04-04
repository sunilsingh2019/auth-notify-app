type NotificationCallback = (data: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private notificationCallbacks: Set<NotificationCallback> = new Set();
  private reconnectTimer: number | null = null;
  private url: string;
  private isConnecting: boolean = false;
  private pingTimer: number | null = null;

  constructor(url: string) {
    this.url = url;
    console.log('WebSocket service created with URL:', url);
  }

  // Connect to WebSocket server
  connect(): void {
    // If already connecting, don't try again
    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }
    
    // If already connected, don't reconnect
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found for WebSocket connection');
      return;
    }

    this.isConnecting = true;
    console.log('Starting WebSocket connection attempt with token:', token.substring(0, 10) + '...');
    
    // Try multiple WebSocket URL approaches to ensure connectivity
    let wsUrls = [];
    
    // Option 1: Direct to backend (most reliable for development)
    wsUrls.push(`ws://localhost:8000/api/notifications/ws?token=${token}`);
    
    // Option 2: Relative URL from current location (for production)
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    wsUrls.push(`${wsProtocol}//${wsHost}/api/notifications/ws?token=${token}`);
    
    // Option 3: Using the passed URL parameter with proper protocol
    if (this.url.startsWith('/')) {
      wsUrls.push(`${wsProtocol}//${wsHost}${this.url}?token=${token}`);
    } else if (!this.url.includes('://')) {
      // If no protocol in the URL, add it
      wsUrls.push(`${wsProtocol}//${this.url.replace(/^\/\//, '')}?token=${token}`);
    } else {
      wsUrls.push(`${this.url}?token=${token}`);
    }
    
    // Option 4: Try a proxy approach for development environments
    wsUrls.push(`${wsProtocol}//${wsHost}/api/ws-proxy?token=${token}`);
    
    // Option 5: Direct IP for local development
    wsUrls.push(`ws://127.0.0.1:8000/api/notifications/ws?token=${token}`);
    
    console.log('WebSocket URLs to try:', wsUrls);
    
    // Try to connect using the first URL
    this.tryConnect(wsUrls, 0);
  }

  // Try to connect using the provided URLs one by one
  private tryConnect(urls: string[], index: number): void {
    if (index >= urls.length) {
      console.error('Failed to connect to WebSocket using all available URLs');
      this.isConnecting = false;
      this.scheduleReconnect();
      return;
    }
    
    const currentUrl = urls[index];
    console.log(`Attempting to connect to WebSocket at: ${currentUrl} (attempt ${index + 1}/${urls.length})`);
    
    try {
      // Clean up any existing socket
      if (this.socket) {
        console.log('Cleaning up existing socket before creating new one');
        this.socket.onclose = null; // Prevent onclose from triggering reconnect
        this.socket.onerror = null;
        this.socket.onmessage = null;
        this.socket.onopen = null;
        this.socket.close();
        this.socket = null;
      }
      
      // Create WebSocket connection
      console.log('Creating new WebSocket with URL:', currentUrl);
      this.socket = new WebSocket(currentUrl);

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        console.log('WebSocket connection attempt timed out');
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          // Force close and try next URL
          console.log('Closing timed out socket and trying next URL');
          const socket = this.socket;
          this.socket = null; // Clear reference before closing to prevent recursion
          socket.onclose = null;
          socket.close();
          this.tryConnect(urls, index + 1);
        }
      }, 5000); // 5 second timeout

      this.socket.onopen = () => {
        console.log('WebSocket connected successfully to:', currentUrl);
        this.isConnecting = false;
        
        // Clear the connection timeout
        clearTimeout(connectionTimeout);
        
        // Start sending periodic pings to keep the connection alive
        this.startPinging();
        
        // Clear reconnect timer if connection is successful
        if (this.reconnectTimer) {
          window.clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        // Dispatch a connection event for debugging
        document.dispatchEvent(new CustomEvent('websocket-connected'));
      };

      this.socket.onmessage = (event) => {
        try {
          console.log('WebSocket message received:', event.data);
          const data = JSON.parse(event.data);
          console.log('Parsed WebSocket message data:', data);
          this.notifyCallbacks(data);
          
          // Reset reconnect timer on successful message
          if (this.reconnectTimer) {
            window.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
        this.isConnecting = false;
        
        // Clear the connection timeout
        clearTimeout(connectionTimeout);
        
        // Try the next URL if this was not an intentional close
        if (event.code !== 1000) {
          console.log('Attempting next URL after disconnect');
          // Try next URL
          if (this.socket) {
            this.socket = null;
            this.tryConnect(urls, index + 1);
          }
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        // We'll handle reconnection in the onclose handler
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      
      // Try next URL
      this.tryConnect(urls, index + 1);
    }
  }

  // Subscribe to notifications
  subscribe(callback: NotificationCallback): void {
    console.log('Adding WebSocket notification callback, total callbacks:', this.notificationCallbacks.size + 1);
    // Using a Set ensures each callback is only added once
    this.notificationCallbacks.add(callback);
  }

  // Unsubscribe from notifications
  unsubscribe(callback: NotificationCallback): void {
    console.log('Removing WebSocket notification callback');
    this.notificationCallbacks.delete(callback);
    console.log('Remaining callbacks:', this.notificationCallbacks.size);
  }

  // Send message to WebSocket server
  send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(data);
      console.log('Sending WebSocket message:', message);
      this.socket.send(message);
    } else {
      console.error('WebSocket is not connected, cannot send message');
    }
  }

  // Close WebSocket connection
  disconnect(): void {
    console.log('Disconnecting WebSocket');
    this.isConnecting = false;
    
    // Stop pinging
    this.stopPinging();
    
    if (this.socket) {
      // Set onclose to null to prevent automatic reconnection attempts
      this.socket.onclose = null;
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
      console.log('WebSocket disconnected successfully');
    } else {
      console.log('No active WebSocket to disconnect');
    }
    
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      console.log('WebSocket reconnect timer cleared');
    }
  }

  // Schedule reconnection
  private scheduleReconnect(): void {
    if (!this.reconnectTimer) {
      console.log('Scheduling WebSocket reconnection in 5 seconds');
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        console.log('Attempting reconnection after timeout');
        this.connect();
      }, 5000);
    }
  }

  // Notify all callbacks with received data
  private notifyCallbacks(data: any): void {
    console.log('Notifying', this.notificationCallbacks.size, 'callbacks with data:', data);
    
    // Try to parse the data if it's a string
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
        console.log('Successfully parsed string data to JSON:', parsedData);
      } catch (e) {
        console.error('Error parsing string data:', e);
      }
    }
    
    this.notificationCallbacks.forEach((callback) => {
      try {
        console.log('Executing notification callback with data:', parsedData);
        callback(parsedData);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  // Debug method to check connection status
  getStatus(): string {
    if (!this.socket) {
      return 'No socket created';
    }
    
    switch(this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'Connecting';
      case WebSocket.OPEN:
        return 'Connected';
      case WebSocket.CLOSING:
        return 'Closing';
      case WebSocket.CLOSED:
        return 'Closed';
      default:
        return 'Unknown';
    }
  }

  // Start sending periodic pings to keep the connection alive
  private startPinging(): void {
    // Clear any existing ping timer
    if (this.pingTimer) {
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    // Send a ping every 30 seconds
    console.log('Starting WebSocket ping interval');
    this.pingTimer = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('Sending WebSocket ping to keep connection alive');
        this.socket.send('ping');
      } else {
        console.log('WebSocket is not open, cannot send ping');
      }
    }, 30000); // 30 seconds
  }
  
  // Stop pinging
  private stopPinging(): void {
    if (this.pingTimer) {
      console.log('Stopping WebSocket ping interval');
      window.clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  // Add debug test function
  testConnection(): void {
    console.log('Testing WebSocket connection...');
    
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot test: WebSocket is not connected');
      alert('WebSocket is not connected! Status: ' + this.getStatus());
      return;
    }
    
    try {
      // Send a ping message to test the connection
      this.socket.send(JSON.stringify({
        type: 'PING',
        timestamp: Date.now()
      }));
      console.log('Ping message sent to test WebSocket connection');
      
      // Create and dispatch a test notification event
      const testEvent = new CustomEvent('notification-test', {
        detail: {
          type: 'NEW_USER',
          data: {
            email: 'test-websocket@example.com'
          }
        }
      });
      
      console.log('Dispatching test notification event');
      document.dispatchEvent(testEvent);
    } catch (error) {
      console.error('Error testing WebSocket connection:', error);
      alert('Error testing WebSocket: ' + error);
    }
  }
}

// Create and export WebSocket service instance
const wsService = new WebSocketService('/api/notifications/ws');

export default wsService;

// Add a diagnostic function to test WebSocket connection
export function testWebSocketConnection() {
  console.log('Testing WebSocket connection...');
  console.log('WebSocket status:', wsService.getStatus());
  
  // Check if token exists
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No authentication token found for WebSocket connection');
    return false;
  }
  
  // Check which URLs we would try
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.host;
  
  const urls = [
    `ws://localhost:8000/api/notifications/ws?token=${token}`,
    `${wsProtocol}//${wsHost}/api/notifications/ws?token=${token}`,
    `${wsProtocol}//${wsHost}/api/notifications/ws?token=${token}`
  ];
  
  console.log('WebSocket URLs that would be tried:', urls);
  return true;
}
