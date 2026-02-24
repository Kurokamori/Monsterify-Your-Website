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
  const [message, setMessage] = useState('');

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
          return;
        }

        if (!token || !refreshToken || !userParam) {
          setStatus('error');
          setMessage('Missing authentication data. Please try logging in again.');
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
          setMessage(user.display_name || user.username);

          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } catch {
          setStatus('error');
          setMessage('Invalid user data received. Please try logging in again.');
        }
      } catch {
        setStatus('error');
        setMessage('An error occurred during authentication. Please try again.');
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
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'processing' && (
          <>
            <div style={{ marginBottom: 'var(--spacing-medium)' }}>
              <i className="fa-brands fa-discord" style={{ fontSize: '2.5rem', color: '#5865F2' }} />
            </div>
            <LoadingSpinner message="Signing you in..." />
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ marginBottom: 'var(--spacing-medium)' }}>
              <i className="fa-solid fa-check-circle" style={{ fontSize: '2.5rem', color: 'var(--success-color)' }} />
            </div>
            <h2 style={{ color: 'var(--text-color)', marginBottom: 'var(--spacing-xxsmall)' }}>
              Welcome back, {message}!
            </h2>
            <p style={{ color: 'var(--text-color-muted)', fontSize: 'var(--font-size-small)' }}>
              Redirecting you now...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ marginBottom: 'var(--spacing-medium)' }}>
              <i className="fa-solid fa-exclamation-triangle" style={{ fontSize: '2.5rem', color: 'var(--error-color)' }} />
            </div>
            <h2 style={{ color: 'var(--text-color)', marginBottom: 'var(--spacing-xxsmall)' }}>
              Authentication Failed
            </h2>
            <p style={{ color: 'var(--text-color-muted)', fontSize: 'var(--font-size-small)', marginBottom: 'var(--spacing-medium)' }}>
              {message}
            </p>
            <button
              className="button primary lg block"
              onClick={() => navigate('/login', { replace: true })}
            >
              Return to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
