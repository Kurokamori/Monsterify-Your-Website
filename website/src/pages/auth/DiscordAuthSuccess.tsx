import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import api from '../../services/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

type AuthStatus = 'processing' | 'success' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  discord_error: 'There was an error with Discord authentication. Please try again.',
  discord_no_user: 'No user data received from Discord. Please try again.',
  server_error: 'A server error occurred during authentication. Please try again.',
};

export default function DiscordAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<AuthStatus>('processing');
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
          setMessage(ERROR_MESSAGES[error] || 'An unexpected error occurred. Please try again.');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        if (!token || !refreshToken || !userParam) {
          setStatus('error');
          setMessage('Missing authentication data. Please try logging in again.');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        try {
          const user = JSON.parse(decodeURIComponent(userParam));

          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));

          if (api.defaults) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }

          setStatus('success');
          setMessage(`Welcome, ${user.display_name || user.username}! Redirecting...`);

          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } catch {
          setStatus('error');
          setMessage('Invalid user data received. Please try logging in again.');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
      } catch {
        setStatus('error');
        setMessage('An error occurred during authentication. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleDiscordAuth();
  }, [searchParams, navigate]);

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
              <><i className="fa-solid fa-spinner fa-spin" /> Processing...</>
            )}
            {status === 'success' && (
              <span className="auth-status-success">
                <i className="fa-solid fa-check-circle" /> Success!
              </span>
            )}
            {status === 'error' && (
              <span className="auth-status-error">
                <i className="fa-solid fa-exclamation-circle" /> Error
              </span>
            )}
          </h1>
          <p>{message}</p>
        </div>

        {status === 'processing' && (
          <LoadingSpinner message="" />
        )}

        {status === 'error' && (
          <div className="auth-error-actions">
            <button
              className="button primary lg block"
              onClick={() => navigate('/login', { replace: true })}
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
