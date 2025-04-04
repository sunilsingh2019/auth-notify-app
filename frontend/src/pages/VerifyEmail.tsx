import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail: React.FC = () => {
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('Verifying your email...');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (!token) {
          setMessage('Verification token is missing.');
          setVerifying(false);
          return;
        }

        const response = await axios.get(`/api/auth/verify-email?token=${token}`);
        setSuccess(response.data.success);
        setMessage(response.data.message);
        setVerifying(false);

        // Redirect to login after successful verification
        if (response.data.success) {
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error) {
        console.error('Verification error:', error);
        setMessage('An error occurred during verification. Please try again later.');
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [location.search, navigate]);

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <h1>Email Verification</h1>
        
        {verifying ? (
          <div className="verifying">
            <div className="spinner"></div>
            <p>{message}</p>
          </div>
        ) : (
          <div className={`verification-result ${success ? 'success' : 'error'}`}>
            <div className="icon">
              {success ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              )}
            </div>
            <p>{message}</p>
            
            {success ? (
              <p className="redirect-message">Redirecting to login page...</p>
            ) : (
              <div className="action-buttons">
                <button onClick={() => navigate('/login')}>Go to Login</button>
                <button onClick={() => navigate('/resend-verification')}>Resend Verification</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail; 