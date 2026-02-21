import { ReactNode, useState, useCallback } from 'react';
import type { ConfirmModalProps } from './ConfirmModal';

/**
 * Hook for managing confirm modal state
 */
export const useConfirmModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Partial<ConfirmModalProps>>({});

  const open = useCallback((options: Partial<ConfirmModalProps> = {}) => {
    setConfig(options);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const confirm = useCallback((
    message: ReactNode,
    onConfirm: () => void | Promise<void>,
    options: Partial<ConfirmModalProps> = {}
  ) => {
    setConfig({ message, onConfirm, ...options });
    setIsOpen(true);
  }, []);

  const confirmDanger = useCallback((
    message: ReactNode,
    onConfirm: () => void | Promise<void>,
    options: Partial<ConfirmModalProps> = {}
  ) => {
    confirm(message, onConfirm, { variant: 'danger', ...options });
  }, [confirm]);

  return {
    isOpen,
    open,
    close,
    confirm,
    confirmDanger,
    modalProps: {
      isOpen,
      onClose: close,
      onConfirm: config.onConfirm || (() => {}),
      ...config
    }
  };
};

