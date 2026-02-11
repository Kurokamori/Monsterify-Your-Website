import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = '' }) => {
  return (
    <div className="spinner-container">
      <div className={`spinner-dots ${size}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="spinner-dot"></div>
        ))}
      </div>
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
