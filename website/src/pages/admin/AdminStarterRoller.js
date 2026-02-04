import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { API_URL } from '../../config';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StarterMonsterCard from '../../components/monsters/StarterMonsterCard';
import api from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';

/**
 * AdminStarterRoller - Admin version of the starter roller
 * Uses the exact same UI and roller logic as StarterSelectionPage
 * but allows rolling without creating a trainer
 */
const AdminStarterRoller = () => {
  useDocumentTitle('Admin Starter Roller');

  const [loading, setLoading] = useState(false);
  const [starterSets, setStarterSets] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedStarters, setSelectedStarters] = useState([]);
  const [starterNames, setStarterNames] = useState(['', '', '']);
  const [hasRolled, setHasRolled] = useState(false);

  // Roll starter sets
  const rollStarters = async () => {
    try {
      setLoading(true);
      setSelectedStarters([]);
      setStarterNames(['', '', '']);
      setCurrentStep(0);

      console.log('Fetching starter sets from:', `${API_URL}/starter-roller/roll`);

      const response = await api.post('/starter-roller/roll', {});

      console.log('Starter sets response:', response.data);

      if (response.data.success) {
        setStarterSets(response.data.data);
        setHasRolled(true);
        toast.success('Starters rolled successfully!');
      } else {
        toast.error('Failed to load starter monsters');
      }
    } catch (error) {
      console.error('Error fetching starter sets:', error);
      toast.error(`Error loading starter monsters: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle monster selection
  const handleSelectMonster = (setIndex, monster) => {
    const newSelectedStarters = [...selectedStarters];
    newSelectedStarters[setIndex] = monster;
    setSelectedStarters(newSelectedStarters);

    setTimeout(() => {
      if (setIndex < 2) {
        setCurrentStep(setIndex + 1);
      } else if (setIndex === 2) {
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

  // Helper function to get ordinal suffix
  const getOrdinal = (num) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  // Render current step
  const renderCurrentStep = () => {
    if (currentStep < 3) {
      const currentSet = starterSets[currentStep];

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
      // Review step
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
          <h2 className="starter-step-title">Review Your Selected Starters</h2>

          <div className="starter-cards-grid">
            {selectedStarters.map((monster, index) => (
              <div key={index} className="starter-review-card">
                <div className="starter-review-card-header">
                  <StarterMonsterCard monster={monster} />
                </div>

                <div className="starter-review-card-body">
                  <label className="starter-name-label">
                    Name for {getOrdinal(index + 1)} starter:
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

          <div className="admin-starter-note">
            <i className="fas fa-info-circle"></i>
            <p>This is a preview mode. To add these starters to a trainer, use the regular trainer creation flow.</p>
          </div>
        </div>
      );
    }
  };

  // Navigation buttons component
  const NavigationButtons = () => (
    <div className="starter-nav-buttons">
      <button
        className="nav-button nav-button-secondary btn"
        onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
        disabled={currentStep === 0}
      >
        <i className="fas fa-arrow-left mr-2"></i>
        Back
      </button>

      {currentStep < 3 && selectedStarters[currentStep] && (
        <button
          className="nav-button nav-button-primary btn"
          onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
        >
          Next
          <i className="fas fa-arrow-right ml-2"></i>
        </button>
      )}

      {currentStep === 3 && (
        <button
          className="nav-button nav-button-success btn"
          onClick={rollStarters}
        >
          <i className="fas fa-redo"></i>
          Roll Again
        </button>
      )}
    </div>
  );

  // Render initial state (before rolling)
  if (!hasRolled) {
    return (
      <div className="admin-starter-roller">
        <div className="admin-starter-header">
          <h1>Admin Starter Roller</h1>
          <p>Preview the starter roller without creating a trainer. This uses the exact same roller system as the actual trainer creation flow.</p>
        </div>

        <div className="admin-starter-roll-section">
          <div className="roll-card">
            <div className="roll-icon">
              <i className="fas fa-egg"></i>
            </div>
            <h2>Roll Starter Monsters</h2>
            <p>Click the button below to roll a set of starter monsters. You'll get 3 sets of 3 monsters to choose from.</p>
            <button
              className="roll-button"
              onClick={rollStarters}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Rolling...
                </>
              ) : (
                <>
                  <i className="fas fa-dice"></i> Roll Starters
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render loading state
  if (loading) {
    return (
      <div className="admin-starter-roller">
        <h1 className="starter-loading-title">Admin Starter Roller</h1>
        <LoadingSpinner />
      </div>
    );
  }

  // Render roller interface
  return (
    <div className="starter-selection-container">
      <div className="admin-starter-header-inline">
        <h1 className="starter-page-title">Admin Starter Roller</h1>
        <button
          className="reroll-header-btn"
          onClick={rollStarters}
          disabled={loading}
        >
          <i className="fas fa-redo"></i> New Roll
        </button>
      </div>

      {/* Progress tabs */}
      <div className="starter-progress">
        <div className="starter-progress-tabs">
          {[
            { label: 'First Starter', short: '1st' },
            { label: 'Second Starter', short: '2nd' },
            { label: 'Third Starter', short: '3rd' },
            { label: 'Review', short: 'Review' }
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
                disabled={isDisabled}
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
        {renderCurrentStep()}
      </div>

      {/* Bottom navigation buttons */}
      <NavigationButtons />
    </div>
  );
};

export default AdminStarterRoller;
