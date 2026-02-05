import React, { useState, useEffect, useMemo } from 'react';
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

  // Sorting and filtering state
  const [sortBy, setSortBy] = useState('alphabet');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterFaction, setFilterFaction] = useState('');

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

  // Get unique factions for filter dropdown
  const uniqueFactions = useMemo(() => {
    const factions = trainers
      .map(t => t.faction)
      .filter(f => f && f.trim() !== '');
    return [...new Set(factions)].sort();
  }, [trainers]);

  // Filter and sort trainers
  const displayTrainers = useMemo(() => {
    let result = [...trainers];

    // Apply faction filter
    if (filterFaction) {
      result = result.filter(t => t.faction === filterFaction);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'alphabet':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'level':
          comparison = (a.level || 0) - (b.level || 0);
          break;
        case 'monster_count':
          const aCount = a.monsters_count || a.monster_count || 0;
          const bCount = b.monsters_count || b.monster_count || 0;
          comparison = aCount - bCount;
          break;
        case 'ref_percent':
          const aMonsters = a.monsters_count || a.monster_count || 0;
          const bMonsters = b.monsters_count || b.monster_count || 0;
          const aRefs = a.monster_ref_count || 0;
          const bRefs = b.monster_ref_count || 0;
          const aPercent = aMonsters > 0 ? (aRefs / aMonsters) * 100 : 0;
          const bPercent = bMonsters > 0 ? (bRefs / bMonsters) * 100 : 0;
          comparison = aPercent - bPercent;
          break;
        case 'currency':
          const aCurrency = a.coins || a.currency_amount || 0;
          const bCurrency = b.coins || b.currency_amount || 0;
          comparison = aCurrency - bCurrency;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [trainers, filterFaction, sortBy, sortOrder]);

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

      {trainers.length > 0 && (
        <div className="trainers-filter-sort">
          <div className="filter-group">
            <label htmlFor="faction-filter">
              <i className="fas fa-filter"></i> Faction
            </label>
            <select
              id="faction-filter"
              value={filterFaction}
              onChange={(e) => setFilterFaction(e.target.value)}
            >
              <option value="">All Factions</option>
              {uniqueFactions.map(faction => (
                <option key={faction} value={faction}>{faction}</option>
              ))}
            </select>
          </div>

          <div className="sort-group">
            <label htmlFor="sort-by">
              <i className="fas fa-sort"></i> Sort By
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="alphabet">Name</option>
              <option value="level">Level</option>
              <option value="monster_count">Monster Count</option>
              <option value="ref_percent">Ref %</option>
              <option value="currency">Currency</option>
            </select>
          </div>

          <div className="order-group">
            <button
              className={`order-button ${sortOrder === 'asc' ? 'active' : ''}`}
              onClick={() => setSortOrder('asc')}
              title="Ascending"
            >
              <i className="fas fa-sort-amount-up-alt"></i>
            </button>
            <button
              className={`order-button ${sortOrder === 'desc' ? 'active' : ''}`}
              onClick={() => setSortOrder('desc')}
              title="Descending"
            >
              <i className="fas fa-sort-amount-down"></i>
            </button>
          </div>

          {filterFaction && (
            <button
              className="clear-filter-button"
              onClick={() => setFilterFaction('')}
            >
              <i className="fas fa-times"></i> Clear Filter
            </button>
          )}
        </div>
      )}

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
      ) : trainers.length > 0 ? (
        <div className="no-trainers">
          <div className="no-trainers-icon">
            <i className="fas fa-filter"></i>
          </div>
          <h2>No Trainers Match Filter</h2>
          <p>No trainers found for the selected faction "{filterFaction}".</p>
          <button
            className="create-trainer-button"
            onClick={() => setFilterFaction('')}
          >
            Clear Filter
          </button>
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
