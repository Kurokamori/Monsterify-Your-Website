import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import { FormInput } from '../../components/common/FormInput';
import { FormCheckbox } from '../../components/common/FormCheckbox';
import { ErrorModal } from '../../components/common/ErrorModal';
import { DiscordLoginButton } from '../../components/auth/DiscordLoginButton';

type DiscordErrorCode = 'discord_error' | 'discord_no_user' | 'server_error';

const DISCORD_ERROR_MESSAGES: Record<DiscordErrorCode, string> = {
  discord_error: 'There was an error with Discord authentication. Please try again.',
  discord_no_user: 'No user data received from Discord. Please try again.',
  server_error: 'A server error occurred during authentication. Please try again.',
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [discordError, setDiscordError] = useState('');

  const { login, error, clearError, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Clear any stale auth errors from other pages on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const errorCode = urlParams.get('error');

    if (errorCode) {
      const message = DISCORD_ERROR_MESSAGES[errorCode as DiscordErrorCode]
        || 'Discord authentication failed. Please try again.';
      setDiscordError(message);
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!username.trim() || !password) return;

    const success = await login(username, password, rememberMe);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const displayError = discordError || error;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Login</h1>
          <p>Welcome back! Please log in to your account.</p>
        </div>

        <ErrorModal
          isOpen={!!displayError}
          onClose={() => { clearError(); setDiscordError(''); }}
          message={displayError}
          title="Login Error"
        />

        <form className="auth-form" onSubmit={handleSubmit}>
          <FormInput
            label="Username"
            name="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter your username"
            disabled={loading}
            icon={<i className="fa-solid fa-user" />}
          />

          <FormInput
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={loading}
            icon={<i className="fa-solid fa-lock" />}
          />

          <div className="auth-options-row">
            <FormCheckbox
              label="Remember me"
              name="remember"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="button primary lg block"
            disabled={loading}
          >
            {loading ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Logging in...</>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <DiscordLoginButton disabled={loading} />

        <div className="auth-footer">
          <p>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="auth-link">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
