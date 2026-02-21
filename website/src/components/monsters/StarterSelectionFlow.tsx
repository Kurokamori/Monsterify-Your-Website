import { LoadingSpinner, ErrorMessage, SuccessMessage } from '@components/common';
import { StarterMonsterCard } from './StarterMonsterCard';
import { STEPS, getOrdinal } from './starterSelectionUtils';
import type { StarterMonster, StarterSet } from '@services/monsterRollerService';

// ── Sub-components ────────────────────────────────────────────────────

interface ProgressTabsProps {
  currentStep: number;
  selectedStarters: (StarterMonster | null)[];
  allSelected: boolean;
  submitting: boolean;
  onStepChange: (step: number) => void;
}

export function ProgressTabs({
  currentStep,
  selectedStarters,
  allSelected,
  submitting,
  onStepChange,
}: ProgressTabsProps) {
  return (
    <div className="starter-progress">
      <div className="tab-container__bar tab-container__bar--stretch">
        {STEPS.map((step, index) => {
          const isReviewTab = index === 3;
          const isDisabled = (isReviewTab && !allSelected) || submitting;
          const hasSelection = index < 3 && selectedStarters[index] !== null;
          const isCompleted = index < currentStep && hasSelection;
          const isActive = currentStep === index;

          return (
            <button
              key={index}
              className={[
                'tab-container__tab',
                isActive && 'tab-container__tab--active',
                isDisabled && 'tab-container__tab--disabled',
              ].filter(Boolean).join(' ')}
              onClick={() => onStepChange(index)}
              disabled={isDisabled}
            >
              {isCompleted && <i className="fas fa-check" />}
              <span className="starter-tab-label">{step.label}</span>
              <span className="starter-tab-label-short">{step.short}</span>
            </button>
          );
        })}
      </div>
      <div className="progress sm">
        <div
          className="progress-fill primary"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>
    </div>
  );
}

interface NavigationButtonsProps {
  currentStep: number;
  selectedStarters: (StarterMonster | null)[];
  allSelected: boolean;
  submitting: boolean;
  submitLabel?: string;
  submitIcon?: string;
  onStepChange: (step: number) => void;
  onSubmit: () => void;
}

export function NavigationButtons({
  currentStep,
  selectedStarters,
  allSelected,
  submitting,
  submitLabel = 'Add Starters to Your Team',
  submitIcon = 'fa-check',
  onStepChange,
  onSubmit,
}: NavigationButtonsProps) {
  return (
    <div className="starter-nav">
      <button
        className="button secondary no-flex"
        onClick={() => onStepChange(Math.max(0, currentStep - 1))}
        disabled={currentStep === 0 || submitting}
      >
        <i className="fas fa-arrow-left" />
        Back
      </button>

      {currentStep < 3 && selectedStarters[currentStep] && (
        <button
          className="button primary no-flex"
          onClick={() => onStepChange(Math.min(3, currentStep + 1))}
          disabled={submitting || (currentStep === 2 && !allSelected)}
        >
          Next
          <i className="fas fa-arrow-right" />
        </button>
      )}

      {currentStep === 3 && (
        <button
          className="button success no-flex"
          onClick={onSubmit}
          disabled={submitting || !allSelected}
        >
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin" />
              Submitting...
            </>
          ) : (
            <>
              <i className={`fas ${submitIcon}`} />
              {submitLabel}
            </>
          )}
        </button>
      )}
    </div>
  );
}

interface SelectionStepProps {
  step: number;
  starterSet: StarterSet | undefined;
  selectedMonster: StarterMonster | null;
  onSelect: (setIndex: number, monster: StarterMonster) => void;
}

export function SelectionStep({ step, starterSet, selectedMonster, onSelect }: SelectionStepProps) {
  if (!starterSet?.monsters) {
    return (
      <div className="empty-state">
        <h3>Loading starter monsters...</h3>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="starter-step-title">
        Set {step + 1}: Choose your {getOrdinal(step + 1)} starter
      </h2>
      <div className="monster-card-grid">
        {starterSet.monsters.map((monster, index) => (
          <StarterMonsterCard
            key={`${starterSet.setId}-${index}`}
            monster={monster}
            selected={selectedMonster === monster}
            onClick={() => onSelect(step, monster)}
          />
        ))}
      </div>
    </div>
  );
}

interface ReviewStepProps {
  selectedStarters: (StarterMonster | null)[];
  starterNames: string[];
  onNameChange: (index: number, name: string) => void;
  onGoBack: (step: number) => void;
}

export function ReviewStep({ selectedStarters, starterNames, onNameChange, onGoBack }: ReviewStepProps) {
  const validStarters = selectedStarters.filter((s): s is StarterMonster => s !== null);

  if (validStarters.length < 3) {
    return (
      <div className="empty-state">
        <h3>Please select all three starters first</h3>
        <button className="button secondary no-flex" onClick={() => onGoBack(0)}>
          <i className="fas fa-arrow-left" />
          Go back to selection
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="starter-step-title">Name Your Starter Monsters</h2>
      <div className="starter-review-grid">
        {validStarters.map((monster, index) => (
          <div key={index} className="starter-review-card">
            <StarterMonsterCard monster={monster} />
            <div className="starter-review-card__body">
              <label className="form-label">
                Name your {getOrdinal(index + 1)} starter:
              </label>
              <div className="starter-name-row">
                <input
                  type="text"
                  className="input"
                  placeholder={monster.species1 || `New Monster ${index + 1}`}
                  value={starterNames[index]}
                  onChange={(e) => onNameChange(index, e.target.value)}
                />
                {starterNames[index] && (
                  <button
                    className="button danger icon"
                    onClick={() => onNameChange(index, '')}
                    type="button"
                    aria-label="Clear name"
                  >
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
              <button
                className="button secondary no-flex sm"
                onClick={() => onGoBack(index)}
                type="button"
              >
                <i className="fas fa-arrow-left" />
                Return to roll
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Composite Flow ────────────────────────────────────────────────────

export interface StarterSelectionFlowProps {
  title?: string;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  successMessage: string | null;
  starterSets: StarterSet[];
  currentStep: number;
  selectedStarters: (StarterMonster | null)[];
  starterNames: string[];
  allSelected: boolean;
  submitLabel?: string;
  submitIcon?: string;
  extraActions?: React.ReactNode;
  setCurrentStep: (step: number) => void;
  handleSelectMonster: (setIndex: number, monster: StarterMonster) => void;
  handleNameChange: (index: number, name: string) => void;
  handleSubmit: () => void;
  clearError: () => void;
}

export function StarterSelectionFlow({
  title = 'Choose Your Starter Monsters',
  loading,
  submitting,
  error,
  successMessage,
  starterSets,
  currentStep,
  selectedStarters,
  starterNames,
  allSelected,
  submitLabel,
  submitIcon,
  extraActions,
  setCurrentStep,
  handleSelectMonster,
  handleNameChange,
  handleSubmit,
  clearError,
}: StarterSelectionFlowProps) {
  if (loading) {
    return (
      <div className="main-container">
        <h1 className="section-title starter-page-title">
          <i className="fas fa-dice" />
          {title}
        </h1>
        <LoadingSpinner message="Rolling starter monsters..." />
      </div>
    );
  }

  if (error && starterSets.length === 0) {
    return (
      <div className="main-container">
        <h1 className="section-title starter-page-title">
          <i className="fas fa-dice" />
          {title}
        </h1>
        <ErrorMessage message={error} onDismiss={clearError} />
        {extraActions}
      </div>
    );
  }

  return (
    <div className="main-container">
      <h1 className="section-title starter-page-title">
        <i className="fas fa-dice" />
        {title}
      </h1>

      {error && <div className="alert error">{error}</div>}
      {successMessage && <SuccessMessage message={successMessage} />}
      {extraActions}

      <ProgressTabs
        currentStep={currentStep}
        selectedStarters={selectedStarters}
        allSelected={allSelected}
        submitting={submitting}
        onStepChange={setCurrentStep}
      />

      <NavigationButtons
        currentStep={currentStep}
        selectedStarters={selectedStarters}
        allSelected={allSelected}
        submitting={submitting}
        submitLabel={submitLabel}
        submitIcon={submitIcon}
        onStepChange={setCurrentStep}
        onSubmit={handleSubmit}
      />

      {currentStep < 3 ? (
        <SelectionStep
          step={currentStep}
          starterSet={starterSets[currentStep]}
          selectedMonster={selectedStarters[currentStep]}
          onSelect={handleSelectMonster}
        />
      ) : (
        <ReviewStep
          selectedStarters={selectedStarters}
          starterNames={starterNames}
          onNameChange={handleNameChange}
          onGoBack={setCurrentStep}
        />
      )}

      <NavigationButtons
        currentStep={currentStep}
        selectedStarters={selectedStarters}
        allSelected={allSelected}
        submitting={submitting}
        submitLabel={submitLabel}
        submitIcon={submitIcon}
        onStepChange={setCurrentStep}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
