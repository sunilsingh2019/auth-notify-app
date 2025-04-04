import React from 'react';
import { Link } from 'react-router-dom';

const ReadMore: React.FC = () => {
  return (
    <div className="readmore-page">
      <div className="container">
        <div className="readmore-header">
          <h1>Learn More About Our Platform</h1>
          <p className="subtitle">Watch our introductory video to understand how our notification system works</p>
        </div>

        <div className="video-container">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/hL7ZaWSwUvU" 
            title="Authentication & Notification System" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          ></iframe>
        </div>

        <div className="readmore-content">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3>Secure Authentication</h3>
              <p>
                Our system provides robust user authentication with email verification,
                password reset functionality, and secure session management.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3Z"></path>
                  <path d="M9 17v1a3 3 0 0 0 6 0v-1"></path>
                </svg>
              </div>
              <h3>Real-Time Notifications</h3>
              <p>
                Get instant updates through WebSockets, ensuring your users never miss
                important information or updates to their account.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3>User Management</h3>
              <p>
                Comprehensive user management tools to help you track and manage
                user accounts, permissions, and activities.
              </p>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Get Started?</h2>
          <p>
            Experience our powerful authentication and notification system by creating an account today.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="hero-button">Create Account</Link>
            <Link to="/" className="secondary-button">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadMore; 