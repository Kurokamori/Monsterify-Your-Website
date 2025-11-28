import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import trainerService from '../../services/trainerService';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const MyTrainersPage = () => {
  useDocumentTitle('My Trainers');
  
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Define fetchTrainers inside useEffect to avoid dependency issues
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/profile/trainers' } });
      return;
    }

    // Define the function inside useEffect
    const fetchTrainersData = async () => {
      try {
        setLoading(true);

        // Fetch user's trainers using the trainer service
        console.log('Current user:', currentUser);
        const userId = currentUser?.discord_id;
        console.log('Using user ID:', userId);

        const response = await trainerService.getUserTrainers(userId);
        console.log('Trainer service response:', response);

        // Set trainers from the response
        if (response && response.trainers) {
          setTrainers(response.trainers);
        } else {
          console.error('Unexpected response format from trainer service:', response);
          setTrainers([]);
          setError('Received unexpected data format from the server.');
        }
      } catch (err) {
        console.error('Error fetching trainers:', err);
        setError('Failed to load trainers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Call the function
    fetchTrainersData();
  }, [isAuthenticated, navigate, currentUser, trainerService]);

  // This function is used for the retry button in the ErrorMessage component
  const fetchTrainers = async () => {
    try {
      setLoading(true);

      // Fetch user's trainers using the trainer service
      console.log('Current user:', currentUser);
      const userId = currentUser?.discord_id;
      console.log('Using user ID:', userId);

      const response = await trainerService.getUserTrainers(userId);
      console.log('Trainer service response:', response);

      // Set trainers from the response
      if (response && response.trainers) {
        setTrainers(response.trainers);
      } else {
        console.error('Unexpected response format from trainer service:', response);
        setTrainers([]);
        setError('Received unexpected data format from the server.');
      }
    } catch (err) {
      console.error('Error fetching trainers:', err);
      setError('Failed to load trainers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrainer = async () => {
    if (!selectedTrainer) return;

    try {
      setLoading(true);
      setDeleteError(null);

      // Delete trainer using the trainer service
      const response = await trainerService.deleteTrainer(selectedTrainer.id);

      if (response && response.success) {
        // Refresh trainers list
        await fetchTrainers();

        // Close modal
        setIsDeleteModalOpen(false);
        setSelectedTrainer(null);
      } else {
        // Handle error from the API
        const errorMessage = response?.message || 'Failed to delete trainer. Please try again.';
        console.error('Error response from delete trainer API:', errorMessage);
        setDeleteError(errorMessage);
      }
    } catch (err) {
      console.error('Error deleting trainer:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete trainer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // No fallback data - use real data from API
  const displayTrainers = trainers;

  if (loading) {
    return <LoadingSpinner message="Loading trainers..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchTrainers}
      />
    );
  }

  return (
    <div className="my-trainers-container">
      <div className="my-trainers-header">
        <h1>My Trainers</h1>
        <Link to="/add_trainer" className="add-trainer-button">
          <i className="fas fa-plus"></i> New Trainer
        </Link>
      </div>

      {displayTrainers.length > 0 ? (
        <div className="trainers-grid">
          {displayTrainers.map(trainer => (
            <div className="trainer-card" key={trainer.id}>
              
                <div className="trainer-header">
                  <div className="trainer-info">
                    <h2 className="trainer-name">{trainer.name}</h2>
                    {trainer.title && <div className="trainer-title">{trainer.title}</div>}
                    <div className="trainer-level">
                      <span className="level-badge">Lv. {trainer.level || 1}</span>
                    </div>
                  </div>
                </div>
              
              <div className="trainer-avatar-and-info">
              <div className="trainer-avatar">
                <img
                  src={trainer.avatar_url || trainer.main_ref || '/images/default_trainer.png'}
                  alt={trainer.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default_trainer.png';
                  }}
                />
              </div>
              <div className="trainer-content">
                

              <div className="my-trainer-stats">
                <div className="my-trainer-stat-item">
                  <div className="stat-info">
                    <div className="stat-icon">
                      <i className="fas fa-dragon"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{trainer.monsters_count || trainer.monster_count || 0}</div>
                      <div className="stat-label">Mons</div>
                    </div>
                  </div>
                </div>
                <div className="my-trainer-stat-item">
                  <div className="stat-info">
                    <div className="stat-icon">
                      <i className="fas fa-image"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{trainer.monster_ref_count || 0}</div>
                      <div className="stat-label">Refs</div>
                    </div>
                  </div>
                </div>
                <div className="my-trainer-stat-item">
                  <div className="stat-info">
                    <div className="stat-icon">
                      <i className="fas fa-coins"></i>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{trainer.coins || trainer.currency_amount || 0}</div>
                      <div className="stat-label">Coins</div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
</div>
                <div className="trainer-actions">
                  <div className="trainer-actions-row primary">
                    <Link to={`/trainers/${trainer.id}`} className="trainer-button primary">
                      <i className="fas fa-eye"></i> View
                    </Link>
                    <Link to={`/trainers/${trainer.id}/edit`} className="trainer-button secondary">
                      <i className="fas fa-edit"></i> Edit
                    </Link>
                  </div>
                  <div className="trainer-actions-row secondary">
                    <button
                      className="trainer-action-button delete"
                      onClick={() => {
                        setSelectedTrainer(trainer);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <i className="fas fa-trash-alt"></i> Delete
                    </button>
                  
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-trainers">
          <div className="no-trainers-icon">
            <i className="fas fa-user-slash"></i>
          </div>
          <h2>No Trainers Found</h2>
          <p>You don't have any trainers yet. Create your first trainer to start your adventure!</p>
          <Link to="/add_trainer" className="create-trainer-button">
            Create Your First Trainer
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Trainer"
      >
        {selectedTrainer && (
          <div className="delete-trainer-modal">
            <p>
              Are you sure you want to delete the trainer <strong>{selectedTrainer.name}</strong>?
              This will permanently remove the trainer and all associated data.
              This action cannot be undone.
            </p>

            {deleteError && (
              <div className="modal-error">
                <i className="fas fa-exclamation-circle"></i> {deleteError}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="modal-button secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="modal-button danger"
                onClick={handleDeleteTrainer}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  'Delete Trainer'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyTrainersPage;
