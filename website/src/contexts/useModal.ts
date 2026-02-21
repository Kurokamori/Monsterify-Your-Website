import { useContext } from 'react';
import { ModalContext, type ModalContextType } from './modalContextDef';

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

