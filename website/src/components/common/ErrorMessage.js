import React from 'react';

const ErrorMessage = ({ 
  message = 'An error occurred. Please try again later.',
  onRetry,
  backButton
}) => {
  return (
    <div className="error-container">
      <i className="fas fa-exclamation-circle"></i>
      <p className="alert error">{message}</p>
      <div className="stat-group">
        {onRetry && (
          <button onClick={onRetry} className="button primary">
            <i className="fas fa-redo"></i> Try Again
          </button>
        )}
        {backButton && (
          <button onClick={backButton.onClick} className="button secondary">
            <i className="fas fa-arrow-left"></i> {backButton.text}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
