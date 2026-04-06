import { useState, useEffect, useCallback, useRef } from 'react';
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
  const seedRef = useRef<string>('');

  const allSelected = selectedStarters.every(s => s !== null);

  const clearError = useCallback(() => setError(null), []);

  // Save session progress to the backend (debounced via caller)
  const saveSession = useCallback((
    sets: StarterSet[],
    selected: (StarterMonster | null)[],
    names: string[],
    step: number,
  ) => {
    if (!trainerId || !seedRef.current || sets.length === 0) return;
    monsterRollerService.saveStarterSession(trainerId, {
      seed: seedRef.current,
      starterSets: sets,
      selectedStarters: selected,
      starterNames: names,
      currentStep: step,
    }).catch(() => { /* silent - best effort */ });
  }, [trainerId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
    }
  }, [isAuthenticated, navigate, location]);

  // Fetch starter sets on mount (restores existing session if present)
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const fetchStarterSets = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await monsterRollerService.rollStarterSets(trainerId);

        if (cancelled) return;

        if (response.success && response.data) {
          setStarterSets(response.data);
          seedRef.current = response.seed ?? '';

          // Restore session state if the backend returned one
          if (response.session) {
            const { selectedStarters: restored, starterNames: restoredNames, currentStep: restoredStep } = response.session;
            if (restored && Array.isArray(restored)) {
              setSelectedStarters(restored);
            }
            if (restoredNames && Array.isArray(restoredNames)) {
              setStarterNames(restoredNames);
            }
            if (typeof restoredStep === 'number') {
              setCurrentStep(restoredStep);
            }
          }
        } else {
          setError('Failed to load starter monsters');
        }
      } catch (err) {
        if (cancelled) return;
        const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
        if (e.response?.status === 401) {
          navigate('/login', { state: { from: location } });
        } else if (e.response?.status === 400 && trainerId) {
          // Trainer already has monsters — redirect to their page
          navigate(`/trainers/${trainerId}`);
        } else {
          setError(`Error loading starter monsters: ${e.response?.data?.message ?? e.message ?? 'Unknown error'}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStarterSets();

    return () => { cancelled = true; };
  }, [isAuthenticated, navigate, location, trainerId]);

  const handleSelectMonster = useCallback((setIndex: number, monster: StarterMonster) => {
    setError(null);
    setSelectedStarters(prev => {
      const next = [...prev];
      next[setIndex] = monster;

      // Determine the new step
      const nextStep = setIndex < 2 ? setIndex + 1 : 3;

      // Save session with the updated selections
      setTimeout(() => saveSession(starterSets, next, starterNames, nextStep), 0);

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
  }, [starterSets, starterNames, saveSession]);

  const handleNameChange = useCallback((index: number, name: string) => {
    setStarterNames(prev => {
      const next = [...prev];
      next[index] = name;

      // Save session with the updated names
      setTimeout(() => saveSession(starterSets, selectedStarters, next, currentStep), 0);

      return next;
    });
  }, [starterSets, selectedStarters, currentStep, saveSession]);

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
