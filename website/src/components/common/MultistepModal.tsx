import { ReactNode, useState, useCallback, useMemo } from 'react';
import { Modal } from './Modal';
import { ActionButtonGroup } from './ActionButtonGroup';

type ModalSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface Step {
  /** Unique key for the step */
  key: string;
  /** Step title (shown in header and progress) */
  title: string;
  /** Optional description for the step */
  description?: string;
  /** Step content */
  content: ReactNode;
  /** Icon for progress indicator */
  icon?: string;
  /** Validation function - return true to allow proceeding */
  validate?: () => boolean | Promise<boolean>;
  /** Whether this step can be skipped */
  optional?: boolean;
  /** Custom next button text for this step */
  nextText?: string;
  /** Custom back button text for this step */
  backText?: string;
}

interface MultistepModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Array of step definitions */
  steps: Step[];
  /** Modal title (optional, uses step title if not provided) */
  title?: string;
  /** Called when wizard is completed */
  onComplete: () => void | Promise<void>;
  /** Called when step changes */
  onStepChange?: (stepIndex: number, stepKey: string) => void;
  /** Initial step index */
  initialStep?: number;
  /** Show step progress indicator */
  showProgress?: boolean;
  /** Progress variant */
  progressVariant?: 'dots' | 'steps' | 'bar';
  /** Allow clicking on progress to navigate */
  clickableProgress?: boolean;
  /** Complete button text */
  completeText?: string;
  /** Complete button icon */
  completeIcon?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Show cancel button */
  showCancel?: boolean;
  /** Next button text (default for all steps) */
  nextText?: string;
  /** Back button text (default for all steps) */
  backText?: string;
  /** Modal size */
  size?: ModalSize;
  /** Show loading state during completion */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * MultistepModal - Wizard-style modal with step navigation
 */
export const MultistepModal = ({
  isOpen,
  onClose,
  steps,
  title,
  onComplete,
  onStepChange,
  initialStep = 0,
  showProgress = true,
  progressVariant = 'steps',
  clickableProgress = false,
  completeText = 'Complete',
  completeIcon = 'fas fa-check',
  cancelText = 'Cancel',
  showCancel = true,
  nextText = 'Next',
  backText = 'Back',
  size = 'medium',
  loading = false,
  className = ''
}: MultistepModalProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isProcessing, setIsProcessing] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([initialStep]));

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const isLoading = loading || isProcessing;

  // Reset state when modal opens
  const handleClose = useCallback(() => {
    setCurrentStep(initialStep);
    setVisitedSteps(new Set([initialStep]));
    onClose();
  }, [initialStep, onClose]);

  const goToStep = useCallback(async (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    // Only allow going back or to visited steps without validation
    if (stepIndex < currentStep || visitedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex);
      onStepChange?.(stepIndex, steps[stepIndex].key);
      return;
    }

    // Validate current step before proceeding forward
    if (currentStepData.validate) {
      const isValid = await currentStepData.validate();
      if (!isValid) return;
    }

    setVisitedSteps(prev => new Set([...prev, stepIndex]));
    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex, steps[stepIndex].key);
  }, [currentStep, currentStepData, steps, visitedSteps, onStepChange]);

  const handleNext = useCallback(async () => {
    if (isLoading) return;

    setIsProcessing(true);
    try {
      // Validate current step
      if (currentStepData.validate) {
        const isValid = await currentStepData.validate();
        if (!isValid) {
          setIsProcessing(false);
          return;
        }
      }

      if (isLastStep) {
        await onComplete();
        handleClose();
      } else {
        const nextStep = currentStep + 1;
        setVisitedSteps(prev => new Set([...prev, nextStep]));
        setCurrentStep(nextStep);
        onStepChange?.(nextStep, steps[nextStep].key);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [currentStep, currentStepData, isLastStep, isLoading, steps, onComplete, onStepChange, handleClose]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep, steps[prevStep].key);
    }
  }, [currentStep, steps, onStepChange]);

  const handleProgressClick = useCallback((stepIndex: number) => {
    if (!clickableProgress) return;

    // Can only click on visited steps or the next unvisited step
    if (visitedSteps.has(stepIndex) || stepIndex === currentStep + 1) {
      goToStep(stepIndex);
    }
  }, [clickableProgress, visitedSteps, currentStep, goToStep]);

  // Progress indicator
  const progressIndicator = useMemo(() => {
    if (!showProgress) return null;

    if (progressVariant === 'bar') {
      const progress = ((currentStep + 1) / steps.length) * 100;
      return (
        <div className="multistep-modal__progress-bar">
          <div
            className="multistep-modal__progress-fill"
            style={{ width: `${progress}%` }}
          />
          <span className="multistep-modal__progress-text">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
      );
    }

    if (progressVariant === 'dots') {
      return (
        <div className="multistep-modal__progress-dots">
          {steps.map((_, index) => (
            <button
              key={index}
              type="button"
              className={[
                'multistep-modal__dot',
                index === currentStep && 'multistep-modal__dot--active',
                visitedSteps.has(index) && 'multistep-modal__dot--visited',
                clickableProgress && 'multistep-modal__dot--clickable'
              ].filter(Boolean).join(' ')}
              onClick={() => handleProgressClick(index)}
              disabled={!clickableProgress}
              aria-label={`Step ${index + 1}: ${steps[index].title}`}
            />
          ))}
        </div>
      );
    }

    // Default: steps variant
    return (
      <div className="multistep-modal__progress-steps">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = visitedSteps.has(index) && index < currentStep;
          const isClickable = clickableProgress && (visitedSteps.has(index) || index === currentStep + 1);

          return (
            <div
              key={step.key}
              className={[
                'multistep-modal__step-indicator',
                isActive && 'multistep-modal__step-indicator--active',
                isCompleted && 'multistep-modal__step-indicator--completed',
                isClickable && 'multistep-modal__step-indicator--clickable'
              ].filter(Boolean).join(' ')}
              onClick={() => isClickable && handleProgressClick(index)}
            >
              <div className="multistep-modal__step-number">
                {isCompleted ? (
                  <i className="fas fa-check"></i>
                ) : step.icon ? (
                  <i className={step.icon}></i>
                ) : (
                  index + 1
                )}
              </div>
              <span className="multistep-modal__step-title">{step.title}</span>
            </div>
          );
        })}
      </div>
    );
  }, [showProgress, progressVariant, steps, currentStep, visitedSteps, clickableProgress, handleProgressClick]);

  // Footer with navigation buttons
  const footer = (
    <ActionButtonGroup align="between" gap="sm" fullWidth>
      <div className="multistep-modal__footer-left">
        {showCancel && (
          <button
            type="button"
            className="button ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
        )}
      </div>
      <ActionButtonGroup align="end" gap="sm">
        {!isFirstStep && (
          <button
            type="button"
            className="button secondary"
            onClick={handleBack}
            disabled={isLoading}
          >
            <i className="fas fa-arrow-left"></i>
            <span>{currentStepData.backText || backText}</span>
          </button>
        )}
        <button
          type="button"
          className="button primary"
          onClick={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              <span>Processing...</span>
            </>
          ) : isLastStep ? (
            <>
              {completeIcon && <i className={completeIcon}></i>}
              <span>{completeText}</span>
            </>
          ) : (
            <>
              <span>{currentStepData.nextText || nextText}</span>
              <i className="fas fa-arrow-right"></i>
            </>
          )}
        </button>
      </ActionButtonGroup>
    </ActionButtonGroup>
  );

  const modalTitle = title || currentStepData?.title;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      footer={footer}
      size={size}
      closeOnOverlayClick={false}
    >
      <div className={`multistep-modal ${className}`}>
        {progressIndicator}

        {currentStepData?.description && (
          <p className="multistep-modal__description">
            {currentStepData.description}
          </p>
        )}

        <div className="multistep-modal__content">
          {currentStepData?.content}
        </div>
      </div>
    </Modal>
  );
};
