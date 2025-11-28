import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner-dots">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="spinner-dot"></div>
          ))}
        </div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
