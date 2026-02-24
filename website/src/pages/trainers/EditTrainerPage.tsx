import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { extractErrorMessage } from '../../utils/errorUtils';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorModal } from '../../components/common/ErrorModal';
import { TrainerPageForm } from '../../components/trainers/TrainerPageForm';
import type { SubmitResult } from '../../components/trainers/TrainerPageForm';
import trainerService from '../../services/trainerService';
import type { Trainer } from '../../components/trainers/types/Trainer';

const EditTrainerPage = () => {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle('Edit Trainer');

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load trainer data
  useEffect(() => {
    if (!id) {
      setLoadError('Invalid trainer ID');
      setLoading(false);
      return;
    }

    const loadTrainer = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await trainerService.getTrainer(Number(id));
        if (!data) {
          setLoadError('Trainer not found');
        } else {
          setTrainer(data);
        }
      } catch (err) {
        setLoadError(extractErrorMessage(err, 'Failed to load trainer data. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    loadTrainer();
  }, [id]);

  // Authorization check
  const isAuthorized = useMemo(() => {
    if (!currentUser || !trainer) return false;
    if (currentUser.is_admin) return true;

    const userId = String(currentUser.id);
    const discordId = currentUser.discord_id ? String(currentUser.discord_id) : null;
    const playerId = trainer.player_user_id ? String(trainer.player_user_id) : null;

    if (playerId && (userId === playerId || discordId === playerId)) return true;

    return false;
  }, [currentUser, trainer]);

  const handleSubmit = useCallback(async (formData: FormData): Promise<SubmitResult> => {
    if (!id) return { success: false, message: 'Invalid trainer ID' };

    try {
      const response = await trainerService.updateTrainer(Number(id), formData);
      const data = response as unknown as { success?: boolean; message?: string };
      if (data.success !== false) {
        return { success: true, message: 'Trainer updated successfully!' };
      }
      return { success: false, message: data.message || 'Failed to update trainer.' };
    } catch (err) {
      return { success: false, message: extractErrorMessage(err, 'Failed to update trainer. Please try again.') };
    }
  }, [id]);

  const handleSuccess = useCallback(() => {
    setTimeout(() => {
      navigate(`/trainers/${id}`);
    }, 2000);
  }, [navigate, id]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    trainerService.getTrainer(Number(id)).then(data => {
      if (!data) setLoadError('Trainer not found');
      else setTrainer(data);
    }).catch((err) => {
      setLoadError(extractErrorMessage(err, 'Failed to load trainer data.'));
    }).finally(() => {
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading trainer data..." />;
  }

  if (loadError) {
    return (
      <div className="main-container">
        <ErrorModal
          isOpen={true}
          onClose={() => navigate(-1)}
          message={loadError}
          title="Failed to Load Trainer"
          onRetry={handleRetry}
          closeText="Go Back"
        />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="main-container">
        <div className="state-container">
          <i className="fa-solid fa-lock"></i>
          <h2>Not Authorized</h2>
          <p>You are not authorized to edit this trainer.</p>
          <Link to={`/trainers/${id}`} className="button secondary">
            View Trainer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="page-header">
        <Link to={`/trainers/${id}`} className="button secondary sm">
          <i className="fa-solid fa-arrow-left"></i> Back to Trainer
        </Link>
      </div>

      <TrainerPageForm
        mode="edit"
        initialTrainer={trainer}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/trainers/${id}`)}
        onSuccess={handleSuccess}
        title={`Edit Trainer: ${trainer?.name || ''}`}
      />
    </div>
  );
};

export default EditTrainerPage;
