import { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useModalManager } from '../../hooks/useModalManager';

type ModalSize = 'small' | 'medium' | 'large' | 'xlarge';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  small: 'max-w-sm',
  medium: 'max-w-md',
  large: 'max-w-lg',
  xlarge: 'max-w-xl'
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeOnOverlayClick = true
}: ModalProps) => {
  const { zIndex } = useModalManager(isOpen);

  // Handle ESC key to close modal
  useEffect(() => {
    if (isOpen) {
      const handleEsc = (event: KeyboardEvent) => {
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

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const sizeClass = sizeClasses[size] || sizeClasses.medium;

  return createPortal(
    <div className="modal-overlay" style={{ zIndex }} onClick={handleOverlayClick}>
      <div className={`modal-container ${sizeClass}`}>
        {title && (
          <div className="modal-header">
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
