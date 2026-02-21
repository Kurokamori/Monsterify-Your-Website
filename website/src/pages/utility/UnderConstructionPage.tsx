import React from 'react';
import { Link } from 'react-router-dom';

const UnderConstructionPage: React.FC = () => {
  return (
    <div className="auth-container">
      <div className="not-found-content">
        <div className="not-found-icon">
          <i className="fas fa-hard-hat"></i>
        </div>
        <h1>Under Construction</h1>
        <h2>Coming Soon</h2>
        <p>This page is currently being worked on. Check back later!</p>
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

export default UnderConstructionPage;
