import { useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { extractErrorMessage } from '../../utils/errorUtils';
import { TrainerPageForm } from '../../components/trainers/TrainerPageForm';
import type { SubmitResult } from '../../components/trainers/TrainerPageForm';
import trainerService from '../../services/trainerService';

const AddTrainerPage = () => {
  useDocumentTitle('Add Trainer');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile/add-trainer' } });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = useCallback(async (formData: FormData): Promise<SubmitResult> => {
    try {
      const response = await trainerService.createTrainerWithFiles(formData);
      // The API response is the raw data from the server
      const data = response as unknown as { success?: boolean; data?: { id?: number }; message?: string; id?: number };
      const trainerId = data.data?.id ?? data.id;
      if (data.success !== false) {
        return {
          success: true,
          message: 'Trainer created successfully! Redirecting to starter selection...',
          trainerId,
        };
      }
      return { success: false, message: data.message || 'Failed to create trainer.' };
    } catch (err) {
      return { success: false, message: extractErrorMessage(err, 'Failed to create trainer. Please try again.') };
    }
  }, []);

  const handleSuccess = useCallback((result: SubmitResult) => {
    setTimeout(() => {
      if (result.trainerId) {
        navigate(`/profile/trainers/${result.trainerId}/starter-selection`);
      } else {
        navigate('/profile/trainers');
      }
    }, 2000);
  }, [navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="main-container">
      <div className="page-header">
        <Link to="/profile/trainers" className="button secondary sm">
          <i className="fa-solid fa-arrow-left"></i> Back to Trainers
        </Link>
      </div>

      <TrainerPageForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate('/profile/trainers')}
        onSuccess={handleSuccess}
        title="Create New Trainer"
        introText="Below you can create your very own trainer! Fill in as much or as little information as you'd like. Only the trainer name is required. You can always come back and edit your trainer later."
      />
    </div>
  );
};

export default AddTrainerPage;
