import { useState, useRef, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { ArtSubmissionCalculator, ArtCalculatorValues } from './ArtSubmissionCalculator';
import { WritingSubmissionCalculator, WritingCalculatorValues } from './WritingSubmissionCalculator';
import submissionService from '../../services/submissionService';

interface RewardSnapshotEntry {
  id: number;
  name?: string;
  type: 'trainer' | 'monster';
  levels: number;
  coins: number;
  cappedLevels?: number;
}

interface EditParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: number;
  submissionType: string;
  calculatorConfig: Record<string, unknown>;
  onSuccess: (newSnapshot: RewardSnapshotEntry[]) => void;
}

export function EditParticipantsModal({
  isOpen,
  onClose,
  submissionId,
  submissionType,
  calculatorConfig,
  onSuccess,
}: EditParticipantsModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Store latest calculator values without triggering submit
  const latestValues = useRef<Record<string, unknown> | null>(null);

  const isArt = submissionType === 'art';

  // Calculator auto-calls onCalculate on every change — just store the values
  const handleValuesChange = useCallback((values: ArtCalculatorValues | WritingCalculatorValues) => {
    latestValues.current = { ...values, type: isArt ? 'art' : 'writing' };
  }, [isArt]);

  // Only submit when user clicks the button
  const handleSubmit = async () => {
    if (!latestValues.current) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await submissionService.editParticipants(submissionId, latestValues.current);

      if (response.success) {
        setSuccessMessage('Participants updated successfully!');
        if (response.rewardSnapshot) {
          onSuccess(response.rewardSnapshot);
        }
        setTimeout(() => onClose(), 1500);
      } else {
        setError(response.message || 'Failed to update participants');
      }
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update participants. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Participants"
      size="large"
    >
      <div className="edit-participants-modal">
        <div className="submission__alert submission__alert--info">
          <i className="fas fa-info-circle"></i>
          <span>
            Changing participants will recalculate rewards.
            Level and coin differences will be applied to the affected trainers and monsters.
          </span>
        </div>

        {error && (
          <div className="alert error">
            <i className="fas fa-exclamation-triangle"></i> {error}
          </div>
        )}

        {successMessage && (
          <div className="alert success">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}

        <div className={saving ? 'edit-participants-form disabled' : 'edit-participants-form'}>
          {isArt ? (
            <ArtSubmissionCalculator
              onCalculate={handleValuesChange}
              initialValues={calculatorConfig as Partial<ArtCalculatorValues>}
              trainers={undefined}
            />
          ) : (
            <WritingSubmissionCalculator
              onCalculate={handleValuesChange}
              initialValues={calculatorConfig as Partial<WritingCalculatorValues>}
              trainers={undefined}
            />
          )}
        </div>

        <div className="submission__modal-actions">
          <button className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="button primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
