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
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-6">
              Loading starter monsters...
            </h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
          </div>
        );
      }

      return (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Set {currentStep + 1}: Choose your {getOrdinal(currentStep + 1)} starter
          </h2>

          <div className="starter-cards-grid">
            {currentSet.monsters.map((monster, index) => (
              <div
                key={`${currentSet.setId}-${index}`}
                className={`starter-card cursor-pointer ${
                  selectedStarters[currentStep] === monster
                    ? 'selected shadow-lg'
                    : 'hover:shadow-md'
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
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-6">Please select all three starters first</h2>
            <div className="flex justify-center mt-4">
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-md transition-all duration-200"
                onClick={() => setCurrentStep(0)}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Go back to selection
              </button>
            </div>
          </div>
        );
      }

      return (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-center">Review Your Selected Starters</h2>

          <div className="starter-cards-grid">
            {selectedStarters.map((monster, index) => (
              <div key={index} className="border rounded-lg shadow-md overflow-hidden bg-white transition-all duration-300 hover:shadow-lg">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <StarterMonsterCard monster={monster} />
                </div>

                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name for {getOrdinal(index + 1)} starter:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="name-input w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
    <div className="flex justify-between my-4">
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
          className="nav-button btn px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-md"
          onClick={rollStarters}
        >
          <i className="fas fa-redo mr-2"></i>
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
        <h1 className="text-2xl font-bold mb-4">Admin Starter Roller</h1>
        <LoadingSpinner />
      </div>
    );
  }

  // Render roller interface
  return (
    <div className="starter-selection-container container mx-auto p-4 max-w-6xl">
      <div className="admin-starter-header-inline">
        <h1 className="text-3xl font-bold mb-2 text-center">Admin Starter Roller</h1>
        <button
          className="reroll-header-btn"
          onClick={rollStarters}
          disabled={loading}
        >
          <i className="fas fa-redo"></i> New Roll
        </button>
      </div>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between">
          {['First Starter', 'Second Starter', 'Third Starter', 'Review'].map((step, index) => (
            <div
              key={index}
              className={`text-center ${currentStep >= index ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
          <div
            className="progress-bar bg-blue-600 h-2 rounded-full"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Top navigation buttons */}
      <NavigationButtons />

      {/* Card container */}
      <div className="card-container bg-white rounded-lg shadow-lg p-6 mb-6">
        {renderCurrentStep()}
      </div>

      {/* Bottom navigation buttons */}
      <NavigationButtons />
    </div>
  );
};

export default AdminStarterRoller;
