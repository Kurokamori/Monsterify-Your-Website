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
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Choose Your Starter Monsters</h1>
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
      // Review and name step
      // Check if we have selected starters
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
          <h2 className="text-2xl font-semibold mb-6 text-center">Name Your Starter Monsters</h2>

          <div className="starter-cards-grid">
            {selectedStarters.map((monster, index) => (
              <div key={index} className="border rounded-lg shadow-md overflow-hidden bg-white transition-all duration-300 hover:shadow-lg">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <StarterMonsterCard monster={monster} />
                </div>

                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name your {getOrdinal(index + 1)} starter:
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
    <div className="flex justify-between my-4">
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
          className="nav-button btn px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 shadow-md"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Adding Starters...
            </>
          ) : (
            <>
              <i className="fas fa-check mr-2"></i>
              Add Starters to Your Team
            </>
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="starter-selection-container container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-4 text-center">Choose Your Starter Monsters</h1>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between">
          {['First Starter', 'Second Starter', 'Third Starter', 'Review & Name'].map((step, index) => (
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

      {/* Card container with shadow and rounded corners */}
      <div className="card-container bg-white rounded-lg shadow-lg p-6 mb-6">
        {/* Current step content */}
        {renderCurrentStep()}
      </div>

      {/* Bottom navigation buttons */}
      <NavigationButtons />
    </div>
  );
};

export default StarterSelectionPage;
