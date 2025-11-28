import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DiscordAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Processing Discord authentication...');

  useEffect(() => {
    const handleDiscordAuth = async () => {
      try {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          switch (error) {
            case 'discord_error':
              setMessage('There was an error with Discord authentication. Please try again.');
              break;
            case 'discord_no_user':
              setMessage('No user data received from Discord. Please try again.');
              break;
            case 'server_error':
              setMessage('A server error occurred during authentication. Please try again.');
              break;
            default:
              setMessage('An unexpected error occurred. Please try again.');
          }
          
          // Redirect to login page after a delay
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        if (!token || !refreshToken || !userParam) {
          setStatus('error');
          setMessage('Missing authentication data. Please try logging in again.');
          
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          
          // Store the tokens and user data in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));

          // Set the token in API headers
          const api = (await import('../../services/api')).default;
          if (api.defaults) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }

          setStatus('success');
          setMessage(`Welcome, ${user.display_name || user.username}! Redirecting...`);

          // Redirect to home page after a short delay
          setTimeout(() => {
            window.location.href = '/'; // Force full page reload to ensure auth context updates
          }, 1500);

        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          setStatus('error');
          setMessage('Invalid user data received. Please try logging in again.');
          
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error('Discord auth handling error:', error);
        setStatus('error');
        setMessage('An error occurred during authentication. Please try again.');
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleDiscordAuth();
  }, [searchParams, navigate]);

  // If user is already authenticated (from a previous session), redirect
  useEffect(() => {
    if (currentUser && status === 'processing') {
      navigate('/', { replace: true });
    }
  }, [currentUser, status, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>
            {status === 'processing' && (
              <>
                <i className="fas fa-spinner fa-spin"></i> Processing...
              </>
            )}
            {status === 'success' && (
              <>
                <i className="fas fa-check-circle" style={{ color: '#28a745' }}></i> Success!
              </>
            )}
            {status === 'error' && (
              <>
                <i className="fas fa-exclamation-circle" style={{ color: '#dc3545' }}></i> Error
              </>
            )}
          </h1>
          <p>{message}</p>
        </div>

        {status === 'processing' && (
          <div className="auth-loading">
            <div className="loading-spinner"></div>
          </div>
        )}

        {status === 'error' && (
          <div className="auth-error-actions">
            <button 
              className="auth-button"
              onClick={() => navigate('/login', { replace: true })}
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscordAuthSuccess;