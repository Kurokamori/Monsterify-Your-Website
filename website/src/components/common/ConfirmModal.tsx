import { ReactNode, useState, useCallback, useMemo } from 'react';
import { Modal } from './Modal';
import { ActionButtonGroup } from './ActionButtonGroup';

type ConfirmVariant = 'default' | 'danger' | 'warning';

export interface ConfirmModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Cancel handler (alias for onClose) */
  onCancel?: () => void;
  /** Confirm handler */
  onConfirm: () => void | Promise<void>;
  /** Modal title */
  title?: string;
  /** Main message to display */
  message?: ReactNode;
  /** Additional details or list of items */
  details?: ReactNode;
  /** Warning text to show */
  warning?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Variant affects confirm button style */
  variant?: ConfirmVariant;
  /** @deprecated Use variant instead */
  confirmVariant?: string;
  /** Confirm button icon */
  confirmIcon?: string;
  /** Show loading state on confirm */
  loading?: boolean;
  /** Disable confirm button */
  confirmDisabled?: boolean;
}

const variantButtonClass: Record<ConfirmVariant, string> = {
  default: 'primary',
  danger: 'danger',
  warning: 'warning'
};

/**
 * ConfirmModal - Simple confirmation dialog
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title = 'Confirm',
  message = 'Are you sure?',
  details,
  warning,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  confirmVariant,
  confirmIcon,
  loading = false,
  confirmDisabled = false
}: ConfirmModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Use onCancel as fallback for onClose
  const handleClose = useMemo(() => onClose ?? onCancel ?? (() => {}), [onClose, onCancel]);

  // Support deprecated confirmVariant prop
  const resolvedVariant = (confirmVariant as ConfirmVariant) || variant;

  const handleConfirm = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      handleClose();
    } catch {
      // Error handling is left to the caller
    } finally {
      setIsProcessing(false);
    }
  }, [onConfirm, handleClose]);

  const isLoading = loading || isProcessing;

  const footer = (
    <ActionButtonGroup align="end" gap="sm">
      <button
        type="button"
        className="button secondary"
        onClick={handleClose}
        disabled={isLoading}
      >
        {cancelText}
      </button>
      <button
        type="button"
        className={`button ${variantButtonClass[resolvedVariant]}`}
        onClick={handleConfirm}
        disabled={isLoading || confirmDisabled}
      >
        {isLoading ? (
          <>
            <i className="fas fa-spinner fa-spin"></i>
            <span>Processing...</span>
          </>
        ) : (
          <>
            {confirmIcon && <i className={confirmIcon}></i>}
            <span>{confirmText}</span>
          </>
        )}
      </button>
    </ActionButtonGroup>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      footer={footer}
      size="small"
    >
      <div className="confirm-modal">
        {message && (
          <p className="confirm-modal__message">{message}</p>
        )}

        {details && (
          <div className="confirm-modal__details">
            {details}
          </div>
        )}

        {warning && (
          <div className="confirm-modal__warning">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{warning}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Re-export hook for convenience
// eslint-disable-next-line react-refresh/only-export-components
export { useConfirmModal } from './useConfirmModal';
