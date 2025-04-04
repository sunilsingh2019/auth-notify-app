import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ResendVerification: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Define handleSubmit with useCallback so it can be referenced in useEffect
  const handleSubmit = useCallback(async (e: React.FormEvent | null, autoSubmit = false) => {
    if (e) e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/auth/resend-verification', { email });
      setSuccess(response.data.success);
      setMessage(response.data.message || 'Verification email has been sent. Please check your inbox.');

      if (response.data.success && !autoSubmit) {
        // Clear form on manual success
        // For auto-submit, keep the email in the field
        setEmail('');
      }
    } catch (error: any) {
      console.error('Error:', error);
      setSuccess(false);
      setMessage(error.response?.data?.detail || 'Failed to resend verification email. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [email]); // Include email in dependencies

  // Extract email from URL query parameters
  useEffect(() => {
    console.log('ResendVerification: location changed', location.search);
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      console.log('ResendVerification: email param found', emailParam);
      setEmail(emailParam);
      // Optionally auto-submit the form if redirected from registration
      if (params.get('auto') === 'true') {
        console.log('ResendVerification: auto param found, submitting form');
        handleSubmit(null, true);
      }
    }
  }, [location, handleSubmit]); // Add handleSubmit to dependencies

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2>Resend Verification Email</h2>
          <p>Get a new verification link</p>
        </div>

        {message && (
          <div className={`${success ? 'success-message' : 'error-message'}`}>
            {success ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
            {message}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e)}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="form-input"
            />
          </div>

          <button 
            type="submit" 
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            Resend Verification Email
          </button>
        </form>

        <div className="auth-footer">
          <button
            type="button"
            className="text-button"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResendVerification; 