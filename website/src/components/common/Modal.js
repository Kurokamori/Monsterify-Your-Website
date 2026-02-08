import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useModalManager } from '../../hooks/useModalManager';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeOnOverlayClick = true
}) => {
  // Use modal manager for proper z-index stacking and body overflow management
  const { modalId, zIndex } = useModalManager(isOpen);

  // Handle ESC key to close modal
  useEffect(() => {
    // Only add event listeners if the modal is open
    if (isOpen) {
      const handleEsc = (event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEsc);

      return () => {
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  // Don't render if modal is not open
  if (!isOpen) return null;

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  // Determine modal size class
  const sizeClass = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-lg',
    xlarge: 'max-w-xl'
  }[size] || 'max-w-md';

  // Create portal to render modal at the end of the document body
  return ReactDOM.createPortal(
    <div className="modal-overlay" style={{ zIndex }} onClick={handleOverlayClick}>
      <div className={`modal-container ${sizeClass}`}>
        {title && (
          <div className="tree-header">
            <h2 className="modal-title">{title}</h2>
            <button
              type="button"
              className="button close no-flex"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
