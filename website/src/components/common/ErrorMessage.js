import React from 'react';

const ErrorMessage = ({ 
  message = 'An error occurred. Please try again later.',
  onRetry,
  backButton
}) => {
  return (
    <div className="error-container">
      <i className="fas fa-exclamation-circle"></i>
      <p className="error-message">{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary">
            <i className="fas fa-redo"></i> Try Again
          </button>
        )}
        {backButton && (
          <button onClick={backButton.onClick} className="button button-secondary">
            <i className="fas fa-arrow-left"></i> {backButton.text}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
