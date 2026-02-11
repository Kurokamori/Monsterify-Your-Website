import React from 'react';

/**
 * Success message component
 * @param {Object} props Component props
 * @param {string} props.title Message title
 * @param {string} props.message Message content
 * @param {Function} props.onClose Function to call when close button is clicked
 * @returns {JSX.Element} Success message component
 */
const SuccessMessage = ({ title, message, onClose }) => {
  return (
    <div className="option-row success">
      <div className="message-icon">
        <i className="fas fa-check-circle"></i>
      </div>
      <div className="message-content">
        {title && <h3 className="message-title">{title}</h3>}
        <p className="message-text">{message}</p>
      </div>
      {onClose && (
        <button className="message-close" onClick={onClose}>
          &times;
        </button>
      )}
    </div>
  );
};

export default SuccessMessage;
