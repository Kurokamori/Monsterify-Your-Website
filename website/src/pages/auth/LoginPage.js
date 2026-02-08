import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DiscordLoginButton from '../../components/auth/DiscordLoginButton';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login, error, clearError, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  // If already authenticated, redirect to the from path
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Handle Discord OAuth errors from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const discordError = urlParams.get('error');
    
    if (discordError) {
      let errorMessage = 'Discord authentication failed. Please try again.';
      switch (discordError) {
        case 'discord_error':
          errorMessage = 'There was an error with Discord authentication. Please try again.';
          break;
        case 'discord_no_user':
          errorMessage = 'No user data received from Discord. Please try again.';
          break;
        case 'server_error':
          errorMessage = 'A server error occurred during authentication. Please try again.';
          break;
        default:
          errorMessage = 'Discord authentication failed. Please try again.';
      }
      
      // You might want to set this error in your auth context or show it locally
      console.error('Discord OAuth error:', errorMessage);
      
      // Clear the error from URL
      navigate('/login', { replace: true });
    }
    // Don't clear error automatically - let it persist until user tries again
  }, [location.search, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear any previous errors when attempting login
    clearError();

    // Basic validation
    if (!username.trim() || !password) {
      return;
    }

    const success = await login(username, password, rememberMe);

    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Login</h1>
          <p>Welcome back! Please log in to your account.</p>
        </div>

        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="form-input">
              <i className="fas fa-user"></i>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="form-input">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
          </div>

          <div className="option-row">
            <div className="event-date">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="remember">Remember me</label>
            </div>
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
              <>
                <i className="fas fa-spinner fa-spin"></i> Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <DiscordLoginButton disabled={loading} />

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
