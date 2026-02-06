import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdventureList from '../../components/adventures/AdventureList';
import AdventureDetail from '../../components/adventures/AdventureDetail';
import AdventureCreationForm from '../../components/adventures/AdventureCreationForm';
import Modal from '../../components/common/Modal';


const AdventurePage = () => {
  const { adventureId } = useParams();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Open create modal
  const openCreateModal = () => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login?redirect=/adventures');
      return;
    }

    setIsCreateModalOpen(true);
  };

  // Close create modal
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Handle adventure created
  const handleAdventureCreated = (adventure) => {
    setIsCreateModalOpen(false);
    navigate(`/adventures/${adventure.id}`);
  };

  // If viewing a specific adventure
  if (adventureId) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-title">
            <h1>Adventure Details</h1>
          </div>

          <div className="page-actions">
            <button
              className="button secondary"
              onClick={() => navigate('/adventures')}
            >
              <i className="fas fa-arrow-left"></i> Back to Adventures
            </button>
          </div>
        </div>

        <AdventureDetail adventureId={adventureId} />
      </div>
    );
  }

  // Main adventures page
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h1>Adventures</h1>
          <p>Embark on exciting journeys with your monsters</p>
        </div>

        <div className="page-actions">
          <button
            className="button primary"
            onClick={openCreateModal}
          >
            <i className="fas fa-plus"></i> Create Adventure
          </button>
        </div>
      </div>

      <div className="adventure-content">
        <div className="my-adventures-section">
          <h2>Your Adventures</h2>
          <AdventureList
            status="all"
            showFilters={false}
            trainerId={currentUser?.id}
            simplified={true}
          />
        </div>
      </div>

      {/* Adventure Creation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create New Adventure"
        size="large"
      >
        <AdventureCreationForm onAdventureCreated={handleAdventureCreated} />
      </Modal>


    </div>
  );
};

export default AdventurePage;
