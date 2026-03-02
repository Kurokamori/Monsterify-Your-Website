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
    const userId = currentUser ? String(currentUser.id) : 'N/A';
    const discordId = currentUser?.discord_id ? String(currentUser.discord_id) : 'N/A';
    const playerId = trainer?.player_user_id ? String(trainer.player_user_id) : 'N/A';

    const reasons: string[] = [];
    if (!currentUser) {
      reasons.push('You are not logged in.');
    } else if (!trainer) {
      reasons.push('Trainer data could not be loaded.');
    } else {
      if (!trainer.player_user_id) {
        reasons.push('This trainer has no owner assigned (player_user_id is empty). An admin needs to assign ownership.');
      } else {
        if (userId !== playerId && discordId !== playerId) {
          reasons.push(`Your account does not match this trainer's owner.`);
        }
        if (discordId === 'N/A') {
          reasons.push('Your account has no Discord ID linked. Try logging out and back in via Discord.');
        }
      }
    }

    return (
      <div className="main-container">
        <div className="state-container">
          <i className="fa-solid fa-lock"></i>
          <h2>Not Authorized</h2>
          <p>You are not authorized to edit this trainer.</p>
          <div style={{ textAlign: 'left', background: 'var(--bg-secondary, #1a1a2e)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.85rem', maxWidth: '500px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Debug Info:</p>
            <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', margin: 0 }}>
              {reasons.map((r, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{r}</li>)}
              <li>Your User ID: <code>{userId}</code></li>
              <li>Your Discord ID: <code>{discordId}</code></li>
              <li>Trainer Owner ID: <code>{playerId}</code></li>
            </ul>
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.7 }}>
              Share this info with an admin if you believe this is an error.
            </p>
          </div>
          <Link to={`/trainers/${id}`} className="button secondary" style={{ marginTop: '1rem' }}>
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
