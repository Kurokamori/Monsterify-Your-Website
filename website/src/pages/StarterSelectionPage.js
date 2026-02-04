import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_URL } from '../config';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StarterMonsterCard from '../components/monsters/StarterMonsterCard';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const StarterSelectionPage = () => {
  useDocumentTitle('Starter Selection');

  const { trainerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [starterSets, setStarterSets] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedStarters, setSelectedStarters] = useState([]);
  const [starterNames, setStarterNames] = useState(['', '', '']);

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: location } });
    }
  }, [isAuthenticated, navigate, location]);

  // Fetch starter sets on component mount
  useEffect(() => {
    const fetchStarterSets = async () => {
      try {
        // Only fetch if authenticated
        if (!isAuthenticated) {
          return;
        }

        setLoading(true);
        console.log('Fetching starter sets from:', `${API_URL}/starter-roller/roll`);

        const response = await api.post('/starter-roller/roll', {});

        console.log('Starter sets response:', response.data);

        if (response.data.success) {
          setStarterSets(response.data.data);
        } else {
          toast.error('Failed to load starter monsters');
        }
      } catch (error) {
        console.error('Error fetching starter sets:', error);

        if (error.response?.status === 401) {
          // If unauthorized, redirect to login
          toast.error('Please log in to continue');
          navigate('/login', { state: { from: location } });
        } else {
          toast.error(`Error loading starter monsters: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStarterSets();
  }, [isAuthenticated, navigate, location]);

  // Handle monster selection
  const handleSelectMonster = (setIndex, monster) => {
    // Create a copy of the current selections
    const newSelectedStarters = [...selectedStarters];

    // Update the selection for the current set
    newSelectedStarters[setIndex] = monster;

    // Update state
    setSelectedStarters(newSelectedStarters);

    // Move to the next step after a short delay
    setTimeout(() => {
      if (setIndex < 2) {
        setCurrentStep(setIndex + 1);
      } else if (setIndex === 2) {
        // Auto-advance to name your starters page when third starter is selected
        setCurrentStep(3);
      }
    }, 500);
  };

  // Handle name change
  const handleNameChange = (index, name) => {
    const newNames = [...starterNames];
    newNames[index] = name;
    setStarterNames(newNames);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate that all starters are selected
    if (selectedStarters.length !== 3 || selectedStarters.some(starter => !starter)) {
      toast.error('Please select one starter from each set');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare data for submission
      const starterData = selectedStarters.map((monster, index) => ({
        monster,
        name: starterNames[index] || monster.name || `New Monster ${index + 1}`
      }));

      console.log('Submitting starter selection:', {
        trainerId,
        selectedStarters: starterData
      });

      // Submit selected starters
      const response = await api.post('/starter-roller/select', {
        trainerId,
        selectedStarters: starterData
      });

      console.log('Starter selection response:', response.data);

      if (response.data.success) {
        toast.success('Starter monsters added successfully!');
        // Redirect to trainer detail page
        navigate(`/trainers/${trainerId}`);
      } else {
        toast.error(response.data.message || 'Failed to add starter monsters');
      }
    } catch (error) {
      console.error('Error submitting starter selection:', error);
      toast.error(`Error adding starter monsters: ${error.message}`);

      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(`Server error: ${error.response.data.message || 'Unknown server error'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="starter-loading-container">
        <h1 className="starter-loading-title">Choose Your Starter Monsters</h1>
        <LoadingSpinner />
      </div>
    );
  }

  // Render current step
  const renderCurrentStep = () => {
    if (currentStep < 3) {
      // Selection steps
      const currentSet = starterSets[currentStep];

      // Check if currentSet exists and has monsters
      if (!currentSet || !currentSet.monsters) {
        return (
          <div className="starter-empty-state">
            <h2>Loading starter monsters...</h2>
            <div className="starter-spinner-container">
              <div className="starter-spinner"></div>
            </div>
          </div>
        );
      }

      return (
        <div>
          <h2 className="starter-step-title">
            Set {currentStep + 1}: Choose your {getOrdinal(currentStep + 1)} starter
          </h2>

          <div className="starter-cards-grid">
            {currentSet.monsters.map((monster, index) => (
              <div
                key={`${currentSet.setId}-${index}`}
                className={`starter-card ${
                  selectedStarters[currentStep] === monster
                    ? 'selected'
                    : ''
                }`}
                onClick={() => handleSelectMonster(currentStep, monster)}
              >
                <StarterMonsterCard monster={monster} />
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      // Review and name step
      // Check if we have selected starters
      if (selectedStarters.length < 3 || selectedStarters.some(starter => !starter)) {
        return (
          <div className="starter-empty-state">
            <h2>Please select all three starters first</h2>
            <div className="starter-spinner-container">
              <button
                className="starter-back-button"
                onClick={() => setCurrentStep(0)}
              >
                <i className="fas fa-arrow-left"></i>
                Go back to selection
              </button>
            </div>
          </div>
        );
      }

      return (
        <div>
          <h2 className="starter-step-title">Name Your Starter Monsters</h2>

          <div className="starter-cards-grid">
            {selectedStarters.map((monster, index) => (
              <div key={index} className="starter-review-card">
                <div className="starter-review-card-header">
                  <StarterMonsterCard monster={monster} />
                </div>

                <div className="starter-review-card-body">
                  <label className="starter-name-label">
                    Name your {getOrdinal(index + 1)} starter:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="starter-name-input"
                      placeholder={monster.name || `New Monster ${index + 1}`}
                      value={starterNames[index]}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                    />
                    {starterNames[index] && (
                      <button
                        className="clear-button"
                        onClick={() => handleNameChange(index, '')}
                        type="button"
                        aria-label="Clear name"
                      >
                        <i className="fas fa-times-circle"></i>
                      </button>
                    )}
                  </div>
                  <button
                    className="starter-return-button"
                    onClick={() => setCurrentStep(index)}
                    type="button"
                  >
                    <i className="fas fa-arrow-left"></i>
                    Return to roll
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  // Helper function to get ordinal suffix
  const getOrdinal = (num) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  // Navigation buttons component for reuse
  const NavigationButtons = () => (
    <div className="starter-nav-buttons">
      <button
        className="nav-button nav-button-secondary btn"
        onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
        disabled={currentStep === 0 || submitting}
      >
        <i className="fas fa-arrow-left mr-2"></i>
        Back
      </button>

      {currentStep < 3 && selectedStarters[currentStep] && (
        <button
          className="nav-button nav-button-primary btn"
          onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
          disabled={submitting}
        >
          Next
          <i className="fas fa-arrow-right ml-2"></i>
        </button>
      )}

      {currentStep === 3 && (
        <button
          className="nav-button nav-button-success btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Adding Starters...
            </>
          ) : (
            <>
              <i className="fas fa-check"></i>
              Add Starters to Your Team
            </>
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="starter-selection-container">
      <h1 className="starter-page-title">Choose Your Starter Monsters</h1>

      {/* Progress tabs */}
      <div className="starter-progress">
        <div className="starter-progress-tabs">
          {[
            { label: 'First Starter', short: '1st', icon: 'fa-1' },
            { label: 'Second Starter', short: '2nd', icon: 'fa-2' },
            { label: 'Third Starter', short: '3rd', icon: 'fa-3' },
            { label: 'Review & Name', short: 'Review', icon: 'fa-check' }
          ].map((step, index) => {
            const isReviewTab = index === 3;
            const allSelected = selectedStarters.length === 3 && selectedStarters.every(s => s);
            const isDisabled = isReviewTab && !allSelected;
            const hasSelection = index < 3 && selectedStarters[index];
            const isCompleted = index < currentStep && hasSelection;

            return (
              <button
                key={index}
                className={`starter-progress-tab ${currentStep === index ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => setCurrentStep(index)}
                disabled={isDisabled || submitting}
              >
                {isCompleted && (
                  <i className="fas fa-check tab-icon"></i>
                )}
                <span className="tab-label">{step.label}</span>
                <span className="tab-label-short">{step.short}</span>
              </button>
            );
          })}
        </div>
        <div className="starter-progress-track">
          <div
            className="progress-bar"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Top navigation buttons */}
      <NavigationButtons />

      {/* Card container */}
      <div className="card-container">
        {/* Current step content */}
        {renderCurrentStep()}
      </div>

      {/* Bottom navigation buttons */}
      <NavigationButtons />
    </div>
  );
};

export default StarterSelectionPage;
