import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import api from '../../services/api';

const TrainerSettings = () => {
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainers, setTrainers] = useState([]);
  
  // New trainer modal
  const [isNewTrainerModalOpen, setIsNewTrainerModalOpen] = useState(false);
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newTrainerAvatar, setNewTrainerAvatar] = useState(null);
  const [newTrainerAvatarPreview, setNewTrainerAvatarPreview] = useState('');
  const [newTrainerError, setNewTrainerError] = useState(null);
  
  // Edit trainer modal
  const [isEditTrainerModalOpen, setIsEditTrainerModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [editTrainerName, setEditTrainerName] = useState('');
  const [editTrainerAvatar, setEditTrainerAvatar] = useState(null);
  const [editTrainerAvatarPreview, setEditTrainerAvatarPreview] = useState('');
  const [editTrainerError, setEditTrainerError] = useState(null);
  
  // Delete trainer modal
  const [isDeleteTrainerModalOpen, setIsDeleteTrainerModalOpen] = useState(false);
  const [deleteTrainerError, setDeleteTrainerError] = useState(null);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      
      // Fetch user's trainers
      const response = await api.get('/trainers/user');
      setTrainers(response.data.trainers || []);
      
    } catch (err) {
      console.error('Error fetching trainers:', err);
      setError('Failed to load trainers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewTrainerAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewTrainerAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTrainerAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditTrainerAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditTrainerAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditTrainerAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTrainer = async () => {
    if (!newTrainerName.trim()) {
      setNewTrainerError('Trainer name is required.');
      return;
    }
    
    try {
      setLoading(true);
      setNewTrainerError(null);
      
      const formData = new FormData();
      formData.append('name', newTrainerName);
      if (newTrainerAvatar) {
        formData.append('avatar', newTrainerAvatar);
      }
      
      // Create new trainer
      await api.post('/trainers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh trainers list
      await fetchTrainers();
      
      // Reset form and close modal
      setNewTrainerName('');
      setNewTrainerAvatar(null);
      setNewTrainerAvatarPreview('');
      setIsNewTrainerModalOpen(false);
      
    } catch (err) {
      console.error('Error creating trainer:', err);
      setNewTrainerError(err.response?.data?.message || 'Failed to create trainer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTrainer = async () => {
    if (!editTrainerName.trim()) {
      setEditTrainerError('Trainer name is required.');
      return;
    }
    
    try {
      setLoading(true);
      setEditTrainerError(null);
      
      const formData = new FormData();
      formData.append('name', editTrainerName);
      if (editTrainerAvatar) {
        formData.append('avatar', editTrainerAvatar);
      }
      
      // Update trainer
      await api.put(`/trainers/${selectedTrainer.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Refresh trainers list
      await fetchTrainers();
      
      // Reset form and close modal
      setSelectedTrainer(null);
      setEditTrainerName('');
      setEditTrainerAvatar(null);
      setEditTrainerAvatarPreview('');
      setIsEditTrainerModalOpen(false);
      
    } catch (err) {
      console.error('Error updating trainer:', err);
      setEditTrainerError(err.response?.data?.message || 'Failed to update trainer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrainer = async () => {
    try {
      setLoading(true);
      setDeleteTrainerError(null);
      
      // Delete trainer
      await api.delete(`/trainers/${selectedTrainer.id}`);
      
      // Refresh trainers list
      await fetchTrainers();
      
      // Reset form and close modal
      setSelectedTrainer(null);
      setIsDeleteTrainerModalOpen(false);
      
    } catch (err) {
      console.error('Error deleting trainer:', err);
      setDeleteTrainerError(err.response?.data?.message || 'Failed to delete trainer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openEditTrainerModal = (trainer) => {
    setSelectedTrainer(trainer);
    setEditTrainerName(trainer.name);
    setEditTrainerAvatarPreview(trainer.avatar_url || '');
    setIsEditTrainerModalOpen(true);
  };

  const openDeleteTrainerModal = (trainer) => {
    setSelectedTrainer(trainer);
    setIsDeleteTrainerModalOpen(true);
  };

  // Fallback data for development
  const fallbackTrainers = [
    {
      id: 1,
      name: 'Ash Ketchum',
      avatar_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Ash',
      level: 25,
      monsters_count: 42,
      badges_count: 8,
      join_date: '2023-01-15T00:00:00Z'
    },
    {
      id: 2,
      name: 'Misty',
      avatar_url: 'https://via.placeholder.com/100/1e2532/d6a339?text=Misty',
      level: 22,
      monsters_count: 35,
      badges_count: 6,
      join_date: '2023-02-10T00:00:00Z'
    }
  ];

  const displayTrainers = trainers.length > 0 ? trainers : fallbackTrainers;

  if (loading && !isNewTrainerModalOpen && !isEditTrainerModalOpen && !isDeleteTrainerModalOpen) {
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
    <div className="trainer-settings">
      <div className="settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Your Trainers</h2>
          <button 
            className="form-button primary"
            onClick={() => setIsNewTrainerModalOpen(true)}
          >
            <i className="fas fa-plus"></i> New Trainer
          </button>
        </div>
        <p className="settings-description">
          Manage your trainers and their profiles. You can create up to 5 trainers per account.
        </p>
        
        <div className="trainer-cards">
          {displayTrainers.map(trainer => (
            <div className="trainer-card" key={trainer.id}>
              <div className="trainer-card-header">
                <div className="trainer-avatar">
                  <img 
                    src={trainer.avatar_url || "https://via.placeholder.com/100/1e2532/d6a339?text=Trainer"} 
                    alt={trainer.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/default_avatar.png';
                    }}
                  />
                </div>
                <div className="trainer-info">
                  <h3 className="trainer-name">{trainer.name}</h3>
                  <div className="trainer-level">
                    <span className="level-badge">Lv. {trainer.level}</span>
                    <span>Since {new Date(trainer.join_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="trainer-card-content">
                <div className="trainer-stats">
                  <div className="trainer-stat">
                    <span className="trainer-stat-label">Monsters</span>
                    <span className="trainer-stat-value">{trainer.monsters_count}</span>
                  </div>
                  <div className="trainer-stat">
                    <span className="trainer-stat-label">Badges</span>
                    <span className="trainer-stat-value">{trainer.badges_count}</span>
                  </div>
                </div>
                <div className="trainer-card-actions">
                  <Link to={`/trainers/${trainer.id}`} className="trainer-action-button">
                    <i className="fas fa-eye"></i> View
                  </Link>
                  <button 
                    className="trainer-action-button secondary"
                    onClick={() => openEditTrainerModal(trainer)}
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button
                    className="trainer-action-button secondary danger"
                    onClick={() => openDeleteTrainerModal(trainer)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Trainer Modal */}
      <Modal
        isOpen={isNewTrainerModalOpen}
        onClose={() => setIsNewTrainerModalOpen(false)}
        title="Create New Trainer"
      >
        <div className="new-trainer-modal">
          <div className="avatar-upload">
            <div className="current-avatar">
              <img 
                src={newTrainerAvatarPreview || "https://via.placeholder.com/100/1e2532/d6a339?text=Trainer"} 
                alt="New Trainer" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/default_avatar.png';
                }}
              />
            </div>
            <div className="avatar-upload-controls">
              <label className="avatar-upload-button">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewTrainerAvatarChange}
                  className="hidden"
                />
                Choose Avatar
              </label>
              <p className="avatar-upload-info">
                JPG, PNG or GIF. Max size of 2MB.
              </p>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Trainer Name</label>
            <input
              type="text"
              className="form-input"
              value={newTrainerName}
              onChange={(e) => setNewTrainerName(e.target.value)}
              placeholder="Enter trainer name"
              required
            />
          </div>
          
          {newTrainerError && (
            <div className="form-error mb-1">
              <i className="fas fa-exclamation-circle"></i> {newTrainerError}
            </div>
          )}
          
          <div className="modal-actions">
            <button 
              className="button secondary"
              onClick={() => setIsNewTrainerModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="button primary"
              onClick={handleCreateTrainer}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creating...
                </>
              ) : (
                'Create Trainer'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Trainer Modal */}
      <Modal
        isOpen={isEditTrainerModalOpen}
        onClose={() => setIsEditTrainerModalOpen(false)}
        title="Edit Trainer"
      >
        {selectedTrainer && (
          <div className="edit-trainer-modal">
            <div className="avatar-upload">
              <div className="current-avatar">
                <img 
                  src={editTrainerAvatarPreview || "https://via.placeholder.com/100/1e2532/d6a339?text=Trainer"} 
                  alt={editTrainerName} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/default_avatar.png';
                  }}
                />
              </div>
              <div className="avatar-upload-controls">
                <label className="avatar-upload-button">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditTrainerAvatarChange}
                    className="hidden"
                  />
                  Change Avatar
                </label>
                <p className="avatar-upload-info">
                  JPG, PNG or GIF. Max size of 2MB.
                </p>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Trainer Name</label>
              <input
                type="text"
                className="form-input"
                value={editTrainerName}
                onChange={(e) => setEditTrainerName(e.target.value)}
                placeholder="Enter trainer name"
                required
              />
            </div>
            
            {editTrainerError && (
              <div className="form-error mb-1">
                <i className="fas fa-exclamation-circle"></i> {editTrainerError}
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className="button secondary"
                onClick={() => setIsEditTrainerModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="button primary"
                onClick={handleEditTrainer}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Trainer Modal */}
      <Modal
        isOpen={isDeleteTrainerModalOpen}
        onClose={() => setIsDeleteTrainerModalOpen(false)}
        title="Delete Trainer"
      >
        {selectedTrainer && (
          <div className="delete-trainer-modal">
            <p>
              Are you sure you want to delete the trainer <strong>{selectedTrainer.name}</strong>?
              This will permanently remove the trainer and all associated data.
              This action cannot be undone.
            </p>
            
            {deleteTrainerError && (
              <div className="form-error mt-1">
                <i className="fas fa-exclamation-circle"></i> {deleteTrainerError}
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className="button secondary"
                onClick={() => setIsDeleteTrainerModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="button danger"
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

export default TrainerSettings;
