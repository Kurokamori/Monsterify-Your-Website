import { useState, useCallback } from 'react';
import type { TrainerFormData, Trainer } from './types/Trainer';
import { trainerToFormData } from './trainerFormUtils';

/**
 * useTrainerForm - Hook for managing trainer form state externally
 */
export function useTrainerForm(initialData?: Partial<Trainer>) {
  const [formData, setFormData] = useState<Partial<TrainerFormData>>(() =>
    initialData ? trainerToFormData(initialData) : { name: '' }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }, [errors]);

  const reset = useCallback((data?: Partial<Trainer>) => {
    setFormData(data ? trainerToFormData(data) : { name: '' });
    setErrors({});
    setSaving(false);
  }, []);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    saving,
    setSaving,
    handleFieldChange,
    reset
  };
}

