import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import monsterRollerService from '@services/monsterRollerService';
import type { StarterMonster, StarterSet } from '@services/monsterRollerService';

export type { StarterMonster, StarterSet };

export interface UseStarterSelectionReturn {
  loading: boolean;
  submitting: boolean;
  error: string | null;
  successMessage: string | null;
  starterSets: StarterSet[];
  currentStep: number;
  selectedStarters: (StarterMonster | null)[];
  starterNames: string[];
  allSelected: boolean;
  setCurrentStep: (step: number) => void;
  handleSelectMonster: (setIndex: number, monster: StarterMonster) => void;
  handleNameChange: (index: number, name: string) => void;
  handleSubmit: () => Promise<void>;
  clearError: () => void;
}

export function useStarterSelection(trainerId: string | undefined): UseStarterSelectionReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [starterSets, setStarterSets] = useState<StarterSet[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedStarters, setSelectedStarters] = useState<(StarterMonster | null)[]>([null, null, null]);
  const [starterNames, setStarterNames] = useState(['', '', '']);

  const allSelected = selectedStarters.every(s => s !== null);

  const clearError = useCallback(() => setError(null), []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
    }
  }, [isAuthenticated, navigate, location]);

  // Fetch starter sets on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const fetchStarterSets = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await monsterRollerService.rollStarterSets();

        if (cancelled) return;

        if (response.success && response.data) {
          setStarterSets(response.data);
        } else {
          setError('Failed to load starter monsters');
        }
      } catch (err) {
        if (cancelled) return;
        const e = err as { response?: { status?: number }; message?: string };
        if (e.response?.status === 401) {
          navigate('/login', { state: { from: location } });
        } else {
          setError(`Error loading starter monsters: ${e.message ?? 'Unknown error'}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStarterSets();

    return () => { cancelled = true; };
  }, [isAuthenticated, navigate, location]);

  const handleSelectMonster = useCallback((setIndex: number, monster: StarterMonster) => {
    setError(null);
    setSelectedStarters(prev => {
      const next = [...prev];
      next[setIndex] = monster;
      return next;
    });

    // Auto-advance after a short delay
    setTimeout(() => {
      if (setIndex < 2) {
        setCurrentStep(setIndex + 1);
      } else {
        setCurrentStep(3);
      }
    }, 500);
  }, []);

  const handleNameChange = useCallback((index: number, name: string) => {
    setStarterNames(prev => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!allSelected) {
      setError('Please select one starter from each set');
      return;
    }

    if (!trainerId) {
      setError('No trainer specified');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const starterData = selectedStarters.map((monster, index) => ({
        monster: monster!,
        name: starterNames[index] || monster!.species1 || `New Monster ${index + 1}`,
      }));

      const response = await monsterRollerService.selectStarters(trainerId, starterData);

      if (response.success) {
        setSuccessMessage('Starter monsters added successfully! Redirecting...');
        setTimeout(() => navigate(`/trainers/${trainerId}`), 2000);
      } else {
        setError(response.message || 'Failed to add starter monsters');
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Error adding starter monsters');
    } finally {
      setSubmitting(false);
    }
  }, [allSelected, trainerId, selectedStarters, starterNames, navigate]);

  return {
    loading,
    submitting,
    error,
    successMessage,
    starterSets,
    currentStep,
    selectedStarters,
    starterNames,
    allSelected,
    setCurrentStep,
    handleSelectMonster,
    handleNameChange,
    handleSubmit,
    clearError,
  };
}
