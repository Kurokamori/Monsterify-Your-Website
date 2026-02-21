import { Modal } from './Modal';

export interface ErrorModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Error message to display */
  message?: string;
  /** Modal title */
  title?: string;
  /** Optional retry handler */
  onRetry?: () => void;
  /** Retry button text */
  retryText?: string;
  /** Close button text */
  closeText?: string;
}

/**
 * ErrorModal - Modal for displaying error messages
 * Replaces inline error messages that may be off-screen
 */
export const ErrorModal = ({
  isOpen,
  onClose,
  message = 'An error occurred. Please try again later.',
  title = 'Error',
  onRetry,
  retryText = 'Try Again',
  closeText = 'Close',
}: ErrorModalProps) => {
  const handleRetry = () => {
    onRetry?.();
    onClose();
  };

  const footer = (
    <div className="modal-footer-actions">
      {onRetry && (
        <button
          type="button"
          className="button primary"
          onClick={handleRetry}
        >
          <i className="fas fa-redo"></i>
          <span>{retryText}</span>
        </button>
      )}
      <button
        type="button"
        className="button secondary"
        onClick={onClose}
      >
        <span>{closeText}</span>
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size="small"
    >
      <div className="error-modal">
        <div className="error-modal__icon">
          <i className="fas fa-exclamation-circle"></i>
        </div>
        <div className="error-modal__message">
          {message}
        </div>
      </div>
    </Modal>
  );
};

