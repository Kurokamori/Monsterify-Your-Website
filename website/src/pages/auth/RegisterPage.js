import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DiscordLoginButton from '../../components/auth/DiscordLoginButton';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    discord_id: '',
    password: '',
    confirm_password: '',
    terms: false
  });
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, error: authError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.username.trim()) {
      setLocalError('Username is required');
      return;
    }

    if (!formData.password) {
      setLocalError('Password is required');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setLocalError('Passwords do not match');
      return;
    }

    if (!formData.terms) {
      setLocalError('You must agree to the Terms of Service');
      return;
    }

    try {
      setLocalError('');
      setLoading(true);

      const success = await register(formData);

      if (success) {
        // Registration successful, navigation will be handled by useEffect
        // when isAuthenticated becomes true
        console.log('Registration successful');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setLocalError('Failed to register. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Register</h1>
          <p>Create a new account to get started</p>
        </div>
        
        {(localError || authError) && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle"></i> {localError || authError}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username*</label>
            <div className="input-with-icon">
              <i className="fas fa-user"></i>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                disabled={loading}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="display_name">Display Name</label>
            <div className="input-with-icon">
              <i className="fas fa-id-card"></i>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="How you want to be known (optional)"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="discord_id">Discord ID</label>
            <div className="input-with-icon">
              <i className="fab fa-discord"></i>
              <input
                type="text"
                id="discord_id"
                name="discord_id"
                value={formData.discord_id}
                onChange={handleChange}
                placeholder="Your Discord ID (optional)"
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password*</label>
            <div className="input-with-icon">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                disabled={loading}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirm_password">Confirm Password*</label>
            <div className="input-with-icon">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Confirm your password"
                disabled={loading}
                required
              />
            </div>
          </div>
          
          <div className="terms-checkbox checkbox-group">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              checked={formData.terms}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <label htmlFor="terms">
              I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
            </label>
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Registering...
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>
        
        <DiscordLoginButton disabled={loading} />
        
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
