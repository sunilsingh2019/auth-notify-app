import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import stirlingRoseLogo from '../assets/stirling-rose-logo.png';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src={stirlingRoseLogo} alt="Stirling and Rose" />
        </Link>
        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', marginRight: '0.5rem' }}>{user?.email}</span>
              <NotificationBell />
              <button onClick={logout} className="logout-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Sign In</Link>
              <Link to="/register" style={{
                backgroundColor: 'var(--accent-color)', 
                color: 'var(--primary-color)',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
