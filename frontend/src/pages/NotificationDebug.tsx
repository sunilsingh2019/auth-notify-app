import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications, createNewUserNotification } from '../context/NotificationContext';
import wsService from '../services/websocket';
import axios from 'axios';
import './NotificationDebug.css'; // We'll create this CSS file after

const NotificationDebug: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { notifications, connectionStatus, testNotification } = useNotifications();
  const [wsStatus, setWsStatus] = useState('Unknown');
  const [localStorageData, setLocalStorageData] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testEmail, setTestEmail] = useState('test-debug@example.com');
  const [testPassword, setTestPassword] = useState('password123');

  // Regularly check websocket status
  useEffect(() => {
    const interval = setInterval(() => {
      setWsStatus(wsService.getStatus());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get localStorage data
  useEffect(() => {
    const getStorageData = () => {
      try {
        const notificationsData = localStorage.getItem('notifications') || '[]';
        const parsedData = JSON.parse(notificationsData);
        setLocalStorageData(JSON.stringify(parsedData, null, 2));
      } catch (error) {
        setLocalStorageData(`Error parsing localStorage: ${error}`);
      }
    };

    getStorageData();
    const interval = setInterval(getStorageData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Test WebSocket connection
  const testWebSocketConnection = () => {
    try {
      wsService.testConnection();
      setTestResult('WebSocket test initiated - check console for results');
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
  };

  // Check token and WebSocket URLs
  const checkWebSocketDetails = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setTestResult('No authentication token found. Please login first.');
      return;
    }
    
    const tokenPreview = token.substring(0, 10) + '...';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    
    const urls = [
      `ws://localhost:8000/api/notifications/ws?token=${tokenPreview}`,
      `${wsProtocol}//${wsHost}/api/notifications/ws?token=${tokenPreview}`,
      `${wsProtocol}//${wsHost}/api/ws-proxy?token=${tokenPreview}`
    ];
    
    setTestResult(`Token: ${tokenPreview}\n\nWebSocket URLs to try:\n${urls.join('\n')}`);
  };

  // Force connect WebSocket
  const forceConnectWebSocket = () => {
    try {
      wsService.disconnect();
      setTimeout(() => {
        wsService.connect();
        setTestResult('WebSocket connection initiated');
      }, 500);
    } catch (error) {
      setTestResult(`Error connecting: ${error}`);
    }
  };

  // Force reconnect WebSocket
  const reconnectWebSocket = () => {
    try {
      wsService.disconnect();
      setTimeout(() => {
        wsService.connect();
        setTestResult('WebSocket reconnection initiated');
      }, 1000);
    } catch (error) {
      setTestResult(`Error reconnecting: ${error}`);
    }
  };

  // Test notification manually
  const triggerTestNotification = () => {
    testNotification();
    setTestResult('Manual notification test triggered');
  };

  // Clear localStorage notifications
  const clearStorageNotifications = () => {
    localStorage.removeItem('notifications');
    setLocalStorageData('[]');
    setTestResult('Cleared notifications from localStorage');
    window.location.reload();
  };

  // Register a test user via API to trigger notifications
  const registerTestUser = async () => {
    try {
      setTestResult('Registering test user...');
      const response = await axios.post('/api/auth/register', {
        email: testEmail,
        password: testPassword
      });
      
      // Create immediate notification
      createNewUserNotification(testEmail);
      
      setTestResult(`Test user registered: ${JSON.stringify(response.data)}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setTestResult(`Registration error: ${JSON.stringify(error.response.data)}`);
      } else {
        setTestResult(`Error: ${error}`);
      }
    }
  };

  return (
    <div className="debug-container">
      <h1>Notification System Debug</h1>
      
      {!isAuthenticated && (
        <div className="warning-box">
          <p className="warning-title">Warning: You are not logged in</p>
          <p>WebSocket connections require authentication. Please log in to test the notification system.</p>
        </div>
      )}
      
      <div className="debug-grid">
        {/* Status Panel */}
        <div className="debug-panel">
          <h2>Connection Status</h2>
          <div>
            <div className="status-item">
              <span className="status-label">WebSocket Status:</span>{' '}
              <span style={{ color: wsStatus === 'Connected' ? 'green' : 'orange' }}>
                {wsStatus}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">User Context Status:</span>{' '}
              <span style={{ color: connectionStatus.includes('Connected') ? 'green' : 'orange' }}>
                {connectionStatus}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Current User:</span>{' '}
              {isAuthenticated ? user?.email : 'Not logged in'}
            </div>
            <div className="status-item">
              <span className="status-label">Notifications Count:</span>{' '}
              {notifications.length}
            </div>
          </div>
          
          <div className="button-group">
            <button 
              onClick={testWebSocketConnection}
              className="primary-button"
            >
              Test WebSocket
            </button>
            <button 
              onClick={checkWebSocketDetails}
              className="info-button"
            >
              Check Connection Details
            </button>
            <button 
              onClick={forceConnectWebSocket}
              className="success-button"
            >
              Force Connect
            </button>
            <button 
              onClick={reconnectWebSocket}
              className="warning-button"
            >
              Force Reconnect
            </button>
            <button 
              onClick={triggerTestNotification}
              className="success-button"
            >
              Test Notification
            </button>
          </div>
          
          {testResult && (
            <div className="test-result">
              <div className="result-label">Test Result:</div>
              <div className="result-content">{testResult}</div>
            </div>
          )}
        </div>
        
        {/* Register Test User Panel */}
        <div className="debug-panel">
          <h2>Register Test User</h2>
          <p className="panel-description">
            Use this form to register a test user and trigger the notification system.
          </p>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="text"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="form-input"
            />
          </div>
          
          <button 
            onClick={registerTestUser}
            className="primary-button full-width"
            disabled={!testEmail || !testPassword}
          >
            Register Test User
          </button>
        </div>
        
        {/* LocalStorage Panel */}
        <div className="debug-panel full-width">
          <div className="panel-header">
            <h2>Notifications in localStorage</h2>
            <button 
              onClick={clearStorageNotifications}
              className="danger-button small"
            >
              Clear Storage
            </button>
          </div>
          <pre className="code-block">
            {localStorageData}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default NotificationDebug; 