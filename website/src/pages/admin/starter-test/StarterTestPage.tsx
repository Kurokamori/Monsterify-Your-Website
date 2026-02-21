import { useState, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common';
import { StarterSelectionFlow } from '@components/monsters/StarterSelectionFlow';
import type { StarterMonster, StarterSet } from '@services/monsterRollerService';
import monsterRollerService from '@services/monsterRollerService';

function StarterTestContent() {
  useDocumentTitle('Starter Test');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [starterSets, setStarterSets] = useState<StarterSet[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedStarters, setSelectedStarters] = useState<(StarterMonster | null)[]>([null, null, null]);
  const [starterNames, setStarterNames] = useState(['', '', '']);

  const allSelected = selectedStarters.every(s => s !== null);

  const rollStarters = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setStarterSets([]);
    setCurrentStep(0);
    setSelectedStarters([null, null, null]);
    setStarterNames(['', '', '']);

    try {
      const response = await monsterRollerService.rollStarterSets();
      if (response.success && response.data) {
        setStarterSets(response.data);
      } else {
        setError('Failed to load starter monsters');
      }
    } catch (err) {
      const e = err as { message?: string };
      setError(`Error loading starter monsters: ${e.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectMonster = useCallback((setIndex: number, monster: StarterMonster) => {
    setError(null);
    setSelectedStarters(prev => {
      const next = [...prev];
      next[setIndex] = monster;
      return next;
    });

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

  const handleSubmit = useCallback(() => {
    setSuccessMessage('Test complete! In a real scenario, these starters would be added to the trainer.');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Show initial state before first roll
  if (starterSets.length === 0 && !loading && !error) {
    return (
      <div className="main-container">
        <h1 className="section-title starter-page-title">
          <i className="fas fa-flask" />
          Starter Selection Test
        </h1>
        <p className="text-muted">
          Test the starter selection flow without creating a real trainer. Rolls use the same API
          and rendering as the actual starter selection page.
        </p>
        <button className="button primary" onClick={rollStarters}>
          <i className="fas fa-dice" /> Roll Test Starters
        </button>
      </div>
    );
  }

  return (
    <StarterSelectionFlow
      title="Starter Selection Test"
      loading={loading}
      submitting={false}
      error={error}
      successMessage={successMessage}
      starterSets={starterSets}
      currentStep={currentStep}
      selectedStarters={selectedStarters}
      starterNames={starterNames}
      allSelected={allSelected}
      submitLabel="Complete Test"
      submitIcon="fa-flask"
      extraActions={
        <button className="button secondary" onClick={rollStarters}>
          <i className="fas fa-redo" /> Re-roll
        </button>
      }
      setCurrentStep={setCurrentStep}
      handleSelectMonster={handleSelectMonster}
      handleNameChange={handleNameChange}
      handleSubmit={handleSubmit}
      clearError={clearError}
    />
  );
}

export default function StarterTestPage() {
  return (
    <AdminRoute>
      <StarterTestContent />
    </AdminRoute>
  );
}
