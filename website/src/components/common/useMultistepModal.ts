import { useState, useCallback } from 'react';

/**
 * Hook for managing multistep modal state
 */
export const useMultistepModal = <T extends Record<string, unknown>>(
  initialData: T
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T>(initialData);

  const open = useCallback(() => {
    setData(initialData);
    setIsOpen(true);
  }, [initialData]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const updateData = useCallback((updates: Partial<T>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetData = useCallback(() => {
    setData(initialData);
  }, [initialData]);

  return {
    isOpen,
    data,
    open,
    close,
    updateData,
    resetData,
    modalProps: {
      isOpen,
      onClose: close
    }
  };
};

