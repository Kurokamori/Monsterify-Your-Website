import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="auth-container">
      <div className="not-found-content">
        <div className="not-found-icon">
          <i className="fas fa-ghost"></i>
        </div>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>Oops! The page you're looking for seems to have wandered off into the tall grass.</p>
        <div className="not-found-actions">
          <Link to="/" className="button primary">
            <i className="fas fa-home"></i> Return Home
          </Link>
          <Link to="/guides" className="button secondary">
            <i className="fas fa-book"></i> View Guides
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
