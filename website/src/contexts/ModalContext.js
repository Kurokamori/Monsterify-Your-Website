import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState([]);
  const originalOverflowRef = useRef(null);

  // Manage body overflow based on modal count
  useEffect(() => {
    // Only manage body overflow for image modals that need to prevent scrolling
    const imageModals = modals.filter(modal =>
      modal.id.includes('monster-card') ||
      modal.id.includes('image-modal')
    );

    if (imageModals.length > 0) {
      // Store original overflow value only once
      if (originalOverflowRef.current === null) {
        originalOverflowRef.current = document.body.style.overflow || '';
      }
      document.body.style.overflow = 'hidden';
    } else {
      // Restore original overflow value
      if (originalOverflowRef.current !== null) {
        document.body.style.overflow = originalOverflowRef.current;
        originalOverflowRef.current = null;
      }
    }

    // Cleanup function to ensure overflow is restored
    return () => {
      if (originalOverflowRef.current !== null) {
        document.body.style.overflow = originalOverflowRef.current;
        originalOverflowRef.current = null;
      }
    };
  }, [modals]);

  // Register a new modal
  const registerModal = useCallback((id) => {
    setModals(prev => {
      const existingModal = prev.find(modal => modal.id === id);
      if (existingModal) {
        return prev; // Modal already registered, don't change anything
      }

      // Calculate z-index based on modal type and order
      let baseZIndex = 1000;
      if (id.includes('monster-card')) {
        baseZIndex = 1100; // Higher base for monster card modals
      } else if (id.includes('image-modal')) {
        baseZIndex = 1050; // Medium base for other image modals
      }

      const newModal = {
        id,
        zIndex: baseZIndex + prev.length * 10 // Increment z-index for each modal
      };
      console.log(`Registering modal: ${id} with z-index: ${newModal.zIndex}`);
      return [...prev, newModal];
    });
  }, []);

  // Unregister a modal
  const unregisterModal = useCallback((id) => {
    setModals(prev => {
      const filtered = prev.filter(modal => modal.id !== id);
      if (filtered.length !== prev.length) {
        console.log(`Unregistering modal: ${id}`);
      }
      return filtered;
    });
  }, []);

  // Get z-index for a specific modal
  const getModalZIndex = (id) => {
    const modal = modals.find(modal => modal.id === id);
    return modal ? modal.zIndex : 1000;
  };

  // Check if a modal is the topmost
  const isTopModal = (id) => {
    if (modals.length === 0) return false;
    const topModal = modals[modals.length - 1];
    return topModal.id === id;
  };

  const value = {
    modals,
    registerModal,
    unregisterModal,
    getModalZIndex,
    isTopModal
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};
