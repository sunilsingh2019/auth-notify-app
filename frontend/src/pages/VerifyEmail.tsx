import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail: React.FC = () => {
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('Verifying your email...');
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        console.log(`Verification attempt starting with token preview: ${token?.substring(0, 10)}...`);

        if (!token) {
          console.log("Verification token is missing in URL");
          setMessage('Verification token is missing.');
          setVerifying(false);
          return;
        }
        
        // Check if this token was already verified (stored in localStorage)
        const verifiedTokens = JSON.parse(localStorage.getItem('verifiedTokens') || '{}');
        if (verifiedTokens[token]) {
          console.log("Token was already verified according to localStorage");
          setSuccess(true);
          setMessage(verifiedTokens[token]);
          setVerifying(false);
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            console.log("Redirecting to login page after cached verification");
            navigate('/login');
          }, 3000);
          
          return;
        }

        // Skip if verification was already attempted in this session
        if (verificationAttempted) {
          console.log("Verification already attempted in this session, skipping duplicate request");
          return;
        }

        // Mark that we've attempted verification to prevent duplicate requests
        setVerificationAttempted(true);

        console.log("Sending verification request to API...");
        const response = await axios.get(`/api/auth/verify-email?token=${token}`);
        console.log("Verification API response:", response.data);
        
        setSuccess(response.data.success);
        setMessage(response.data.message);
        setVerifying(false);

        // Store successful verifications in localStorage to prevent duplicate attempts
        if (response.data.success) {
          console.log("Storing successful verification in localStorage");
          verifiedTokens[token] = response.data.message;
          localStorage.setItem('verifiedTokens', JSON.stringify(verifiedTokens));
          
          // Redirect to login after successful verification
          console.log("Verification successful, will redirect to login in 3 seconds");
          setTimeout(() => {
            console.log("Redirecting to login page now");
            navigate('/login');
          }, 3000);
        } else {
          console.log("Verification failed:", response.data.message);
        }
      } catch (error) {
        console.error('Verification error:', error);
        setMessage('An error occurred during verification. Please try again later.');
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [location.search, navigate, verificationAttempted]);

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