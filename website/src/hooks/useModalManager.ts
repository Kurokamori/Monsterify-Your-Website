import { useEffect, useRef } from 'react';
import { useModal } from '../contexts/ModalContext';

interface UseModalManagerResult {
  modalId: string;
  zIndex: number;
}

/**
 * Custom hook for managing individual modals with proper z-index stacking
 * @param isOpen - Whether the modal is currently open
 * @param customModalId - Optional unique identifier for the modal
 * @returns Object containing modalId and zIndex for the modal
 */
export const useModalManager = (isOpen: boolean, customModalId?: string): UseModalManagerResult => {
  const { registerModal, unregisterModal, getModalZIndex } = useModal();

  // Generate stable modal ID only once
  const modalIdRef = useRef<string | null>(null);
  if (modalIdRef.current === null) {
    modalIdRef.current = customModalId || `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const currentModalId = modalIdRef.current;
  const isRegisteredRef = useRef(false);
  const previousIsOpenRef = useRef(isOpen);

  useEffect(() => {
    // Only act if isOpen state actually changed
    if (isOpen !== previousIsOpenRef.current) {
      if (isOpen && !isRegisteredRef.current) {
        registerModal(currentModalId);
        isRegisteredRef.current = true;
      } else if (!isOpen && isRegisteredRef.current) {
        unregisterModal(currentModalId);
        isRegisteredRef.current = false;
      }
      previousIsOpenRef.current = isOpen;
    }
  }, [isOpen, registerModal, unregisterModal, currentModalId]);

  // Separate cleanup effect that only runs on unmount
  useEffect(() => {
    return () => {
      if (isRegisteredRef.current) {
        unregisterModal(currentModalId);
        isRegisteredRef.current = false;
      }
    };
  }, [currentModalId, unregisterModal]);

  return {
    modalId: currentModalId,
    zIndex: getModalZIndex(currentModalId)
  };
};
