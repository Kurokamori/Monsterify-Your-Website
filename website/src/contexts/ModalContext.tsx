import { useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { ModalContext, type ModalContextType } from './modalContextDef';

// Re-export types for consumers
export type { ModalContextType };

interface Modal {
  id: string;
  zIndex: number;
}

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modals, setModals] = useState<Modal[]>([]);
  const originalOverflowRef = useRef<string | null>(null);

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
  const registerModal = useCallback((id: string) => {
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

      const newModal: Modal = {
        id,
        zIndex: baseZIndex + prev.length * 10 // Increment z-index for each modal
      };
      return [...prev, newModal];
    });
  }, []);

  // Unregister a modal
  const unregisterModal = useCallback((id: string) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  }, []);

  // Get z-index for a specific modal
  const getModalZIndex = useCallback((id: string): number => {
    const modal = modals.find(modal => modal.id === id);
    return modal ? modal.zIndex : 1000;
  }, [modals]);

  // Check if a modal is the topmost
  const isTopModal = useCallback((id: string): boolean => {
    if (modals.length === 0) return false;
    const topModal = modals[modals.length - 1];
    return topModal.id === id;
  }, [modals]);

  const value: ModalContextType = {
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

// Re-export hook for convenience (import from useModal.ts for better Fast Refresh)
// eslint-disable-next-line react-refresh/only-export-components
export { useModal } from './useModal';
