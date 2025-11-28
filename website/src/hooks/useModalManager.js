import { useEffect, useRef } from 'react';
import { useModal } from '../contexts/ModalContext';

/**
 * Custom hook for managing individual modals with proper z-index stacking
 * @param {boolean} isOpen - Whether the modal is currently open
 * @param {string} modalId - Unique identifier for the modal (optional, will generate if not provided)
 * @returns {object} - Object containing modalId and zIndex for the modal
 */
export const useModalManager = (isOpen, modalId = null) => {
  const { registerModal, unregisterModal, getModalZIndex } = useModal();

  // Generate stable modal ID only once
  const modalIdRef = useRef(null);
  if (modalIdRef.current === null) {
    modalIdRef.current = modalId || `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const currentModalId = modalIdRef.current;
  const isRegisteredRef = useRef(false);
  const previousIsOpenRef = useRef(isOpen);

  useEffect(() => {
    // Only act if isOpen state actually changed
    if (isOpen !== previousIsOpenRef.current) {
      if (isOpen && !isRegisteredRef.current) {
        console.log(`useModalManager: Opening modal ${currentModalId}`);
        registerModal(currentModalId);
        isRegisteredRef.current = true;
      } else if (!isOpen && isRegisteredRef.current) {
        console.log(`useModalManager: Closing modal ${currentModalId}`);
        unregisterModal(currentModalId);
        isRegisteredRef.current = false;
      }
      previousIsOpenRef.current = isOpen;
    }
  }, [isOpen, registerModal, unregisterModal]); // Remove currentModalId from deps since it's stable

  // Separate cleanup effect that only runs on unmount
  useEffect(() => {
    return () => {
      if (isRegisteredRef.current) {
        console.log(`useModalManager: Cleanup modal ${currentModalId}`);
        unregisterModal(currentModalId);
        isRegisteredRef.current = false;
      }
    };
  }, []); // Empty deps - only runs on mount/unmount

  return {
    modalId: currentModalId,
    zIndex: getModalZIndex(currentModalId)
  };
};
