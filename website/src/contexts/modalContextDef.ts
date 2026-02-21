import { createContext } from 'react';

interface Modal {
  id: string;
  zIndex: number;
}

export interface ModalContextType {
  modals: Modal[];
  registerModal: (modalId: string) => void;
  unregisterModal: (modalId: string) => void;
  getModalZIndex: (modalId: string) => number;
  isTopModal: (modalId: string) => boolean;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);
