import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import trainerService from '../../../services/trainerService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import TrainerSelector from '../../../components/common/TrainerSelector';
import MonsterRewardCard from '../../../components/town/activities/MonsterRewardCard';

// Helper function to create YouTube embed URL with proper parameters
const createYouTubeEmbedUrl = (videoId) => {
  const params = new URLSearchParams({
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    rel: '0',
    modestbranding: '1',
    fs: '1',
    cc_load_policy: '0',
    iv_load_policy: '3',
    autohide: '1'
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const defaultVideos = [
  { id: 'lofi1', title: 'Lofi Pokemon Mix', videoId: '2DVpys50LVE', url: createYouTubeEmbedUrl('2DVpys50LVE') },
  { id: 'lofi2', title: 'Lofi Digimon Mix', videoId: 'k6qtIhpJOf8', url: createYouTubeEmbedUrl('k6qtIhpJOf8') },
  { id: 'lofi3', title: 'Relaxing Pokemon Music', videoId: 'UyOnnLZTbhc', url: createYouTubeEmbedUrl('UyOnnLZTbhc') },
  { id: 'lofi4', title: 'Lofi Yokai Mix', videoId: 'VeAWlajUUy8', url: createYouTubeEmbedUrl('VeAWlajUUy8') },
  { id: 'lofi5', title: 'Lofi Palmon Mix', videoId: 'Ok61eoA1QaU', url: createYouTubeEmbedUrl('Ok61eoA1QaU') }
];

const GameCorner = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(defaultVideos[0]);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);

  // Timer states
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionLength, setSessionLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [longBreakLength, setLongBreakLength] = useState(15);
  const [sessionCount, setSessionCount] = useState(4);
  const [currentSession, setCurrentSession] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [totalTimerDuration, setTotalTimerDuration] = useState(0);

  // Rewards states
  const [showRewards, setShowRewards] = useState(false);
  const [rewards, setRewards] = useState(null);
  const [productivityRating, setProductivityRating] = useState(0);
  const [showProductivityRating, setShowProductivityRating] = useState(false);
  const [selectedTrainers, setSelectedTrainers] = useState({});
  const [forceMonsterRoll, setForceMonsterRoll] = useState(false);
  const [monsterNames, setMonsterNames] = useState({});
  const [speciesImages, setSpeciesImages] = useState({});

  // Audio notification states
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioFiles] = useState({
    breakStart: '/audio/break-start.mp3',
    breakEnd: '/audio/break-end.mp3', 
    sessionComplete: '/audio/session-complete.mp3'
  });

  const circleRef = useRef(null);

  // Helper function to determine if break should be long (every 4 sessions)
  const shouldUseLongBreak = (completedSessionCount) => {
    return completedSessionCount > 0 && completedSessionCount % 4 === 0;
  };

  // Play audio notification
  const playAudioNotification = (type) => {
    if (!audioEnabled) return;
    
    try {
      const audio = new Audio(audioFiles[type]);
      audio.volume = 0.5; // Set volume to 50%
      audio.play().catch(err => {
        console.log('Audio play failed:', err);
      });
    } catch (err) {
      console.log('Audio creation failed:', err);
    }
  };

  // Fetch trainers on component mount
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        setLoading(true);
        console.log('Fetching trainers...');
        const userId = currentUser?.discord_id;
        const response = await trainerService.getUserTrainers(userId);
        setTrainers(response.trainers || []);
      } catch (err) {
        console.error('Error fetching trainers:', err);
        setError('Failed to load trainers. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTrainers();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, trainerService]);

  // Timer effect - using Page Visibility API to handle background tab throttling
  useEffect(() => {
    if (timerActive && timerStartTime) {
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - timerStartTime) / 1000);
        const remaining = Math.max(0, totalTimerDuration - elapsed);
        
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          handleTimerComplete();
        }
      };

      // Update immediately
      updateTimer();

      // Set up interval for regular updates
      const timer = setInterval(updateTimer, 100);

      // Handle visibility changes to update timer when tab becomes active
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          updateTimer();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(timer);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [timerActive, timerStartTime, totalTimerDuration]);

  // Update circle whenever timeRemaining changes
  useEffect(() => {
    updateCircleProgress();
  }, [timeRemaining, totalTimerDuration, isBreak, completedSessions, sessionCount]);

  // Update circle progress
  const updateCircleProgress = () => {
    if (circleRef.current) {
      let totalTime;
      
      if (totalTimerDuration > 0) {
        totalTime = totalTimerDuration;
      } else {
        // Fallback for when timer is not active
        totalTime = isBreak
          ? (shouldUseLongBreak(completedSessions) ? longBreakLength : breakLength) * 60
          : sessionLength * 60;
      }
      
      // Calculate remaining progress (full circle = 0 offset, empty circle = 283 offset)
      const remainingRatio = timeRemaining / totalTime;
      const dashOffset = 283 * (1 - remainingRatio);
      circleRef.current.style.strokeDashoffset = dashOffset;
    }
  };

  // Start timer
  const startTimer = () => {
    // Don't start if we've already completed all sessions
    if (completedSessions >= sessionCount) {
      setShowProductivityRating(true);
      return;
    }

    if (!timerActive) {
      const now = Date.now();
      
      if (timeRemaining === 0) {
        // Start a new session or break
        const newTime = isBreak
          ? (shouldUseLongBreak(completedSessions) ? longBreakLength : breakLength) * 60
          : sessionLength * 60;
        setTimeRemaining(newTime);
        setTotalTimerDuration(newTime);
        setTimerStartTime(now);
      } else {
        // Resume from pause - calculate new start time based on remaining time
        setTotalTimerDuration(timeRemaining);
        setTimerStartTime(now);
      }
      
      setTimerActive(true);
    }
  };

  // Pause timer
  const pauseTimer = () => {
    setTimerActive(false);
  };

  // Reset timer
  const resetTimer = () => {
    setTimerActive(false);
    setTimeRemaining(sessionLength * 60);
    setIsBreak(false);
    setCurrentSession(0);
    setCompletedSessions(0);
    setTotalFocusMinutes(0);
    setTimerStartTime(null);
    setTotalTimerDuration(0);
    updateCircleProgress();
  };

  // Handle timer completion
  const handleTimerComplete = () => {
    setTimerActive(false);
    setTimerStartTime(null);

    if (!isBreak) {
      // Session completed
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      setTotalFocusMinutes(prev => prev + sessionLength);

      // Check if we've completed all sessions
      if (newCompletedSessions >= sessionCount) {
        // All sessions completed, play completion sound and show productivity rating
        playAudioNotification('sessionComplete');
        setShowProductivityRating(true);
        return;
      }

      // Not all sessions completed, start a break
      playAudioNotification('breakStart');
      setIsBreak(true);
      const breakTime = (shouldUseLongBreak(newCompletedSessions) ? longBreakLength : breakLength) * 60;
      setTimeRemaining(breakTime);
      setTotalTimerDuration(breakTime);
      setTimerStartTime(Date.now());
      setTimerActive(true);
    } else {
      // Break completed
      setIsBreak(false);
      setCurrentSession(prev => prev + 1);

      // Check if we've completed all sessions after incrementing currentSession
      if (currentSession + 1 >= sessionCount) {
        // All sessions completed, play completion sound and show productivity rating
        playAudioNotification('sessionComplete');
        setShowProductivityRating(true);
        return;
      }

      // Start next focus session
      playAudioNotification('breakEnd');
      const sessionTime = sessionLength * 60;
      setTimeRemaining(sessionTime);
      setTotalTimerDuration(sessionTime);
      setTimerStartTime(Date.now());
      setTimerActive(true);
    }
  };

  // Handle productivity rating
  const handleProductivityRating = (rating) => {
    setProductivityRating(rating);
    setShowProductivityRating(false);
    generateRewards(rating);
  };

  // Generate rewards
  const generateRewards = async (productivityScore) => {
    try {
      setLoading(true);
      const response = await api.post('/town/game-corner/rewards', {
        completedSessions,
        totalFocusMinutes,
        productivityScore,
        forceMonsterRoll
      });

      // Backend automatically assigns and claims all rewards
      setRewards(response.data);
      
      // Update trainers with fresh data from backend (fixes "Unknown" trainer names)
      if (response.data.trainers) {
        setTrainers(response.data.trainers);
        console.log('Updated trainers from Game Corner response:', response.data.trainers);
      }
      
      // Fetch species images for monster rewards
      await fetchSpeciesImages(response.data.rewards);

      setShowRewards(true);
    } catch (err) {
      console.error('Error generating rewards:', err);
      setError('Failed to generate rewards. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Claim a reward
  const claimReward = async (rewardOrId, trainerId = null) => {
    try {
      // Handle both old format (reward object) and new format (rewardId, trainerId)
      let reward, finalTrainerId;

      if (typeof rewardOrId === 'string') {
        // New format: claimReward(rewardId, trainerId)
        const rewardId = rewardOrId;
        finalTrainerId = trainerId;
        reward = rewards.rewards.find(r => r.id === rewardId);

        if (!reward) {
          setError('Reward not found.');
          return;
        }
      } else {
        // Old format: claimReward(reward)
        reward = rewardOrId;
        finalTrainerId = reward.assigned_to;
      }

      // Debug logging
      console.log('Claiming reward:', {
        rewardId: reward.id,
        rewardType: reward.type,
        rewardAssignedTo: reward.assigned_to,
        finalTrainerId: finalTrainerId,
        selectedTrainers: selectedTrainers
      });

      // Check if we have a valid trainer assignment
      if (!finalTrainerId) {
        setError('This reward is not assigned to any trainer. Please assign it first.');
        return;
      }

      setLoading(true);

      // Prepare the request data
      const requestData = {
        rewardId: reward.id,
        trainerId: finalTrainerId,
        rewardData: reward
      };

      // Add monster name if it's a monster reward
      if (reward.type === 'monster' && monsterNames[reward.id]) {
        requestData.monsterName = monsterNames[reward.id];
      }

      const response = await api.post('/town/game-corner/claim', requestData);

      if (response.data.success) {
        // Update the rewards list
        setRewards(prev => ({
          ...prev,
          rewards: prev.rewards.map(r =>
            r.id === reward.id ? response.data.reward : r
          )
        }));
      } else {
        setError(response.data.message || 'Failed to claim reward');
      }
    } catch (err) {
      console.error('Error claiming reward:', err);
      setError('Failed to claim reward. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle custom video submission
  const handleVideoSubmit = (e) => {
    e.preventDefault();
    if (customVideoUrl) {
      // Extract video ID from YouTube URL
      let videoId = customVideoUrl;
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = customVideoUrl.match(youtubeRegex);

      if (match && match[1]) {
        videoId = match[1];
        const newVideo = {
          id: `custom-${Date.now()}`,
          title: 'Custom Video',
          url: createYouTubeEmbedUrl(videoId),
          videoId: videoId
        };

        setSelectedVideo(newVideo);
        setCustomVideoUrl('');
        setShowVideoForm(false);
        setVideoError(false);
        setVideoLoading(true);
      } else {
        setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
      }
    }
  };

  // Handle video load success
  const handleVideoLoad = () => {
    setVideoLoading(false);
    setVideoError(false);
  };

  // Handle video load error
  const handleVideoError = () => {
    setVideoLoading(false);
    setVideoError(true);
  };

  // Reset video states when selecting a new video
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setVideoError(false);
    setVideoLoading(true);
  };

  // Handle monster name change
  const handleMonsterNameChange = (rewardId, name) => {
    setMonsterNames(prev => ({
      ...prev,
      [rewardId]: name
    }));
  };

  // Handle trainer selection for rewards
  const handleTrainerSelect = (rewardId, trainerId) => {
    setSelectedTrainers(prev => ({
      ...prev,
      [rewardId]: trainerId
    }));
  };

  // Fetch species images when rewards are generated
  const fetchSpeciesImages = async (rewards) => {
    const speciesSet = new Set();

    // Collect all species from monster rewards
    rewards.forEach(reward => {
      if (reward.type === 'monster' && reward.reward_data) {
        if (reward.reward_data.species1) speciesSet.add(reward.reward_data.species1);
        if (reward.reward_data.species2) speciesSet.add(reward.reward_data.species2);
        if (reward.reward_data.species3) speciesSet.add(reward.reward_data.species3);
      }
    });

    if (speciesSet.size > 0) {
      try {
        const speciesArray = Array.from(speciesSet);
        // Use the bulk species images endpoint like garden harvest does
        const response = await api.get(`/species/images?species=${speciesArray.join(',')}`);

        if (response.data && response.data.success && response.data.images) {
          const imageMap = {};
          response.data.images.forEach(img => {
            imageMap[img.species] = {
              image_url: img.url,
              species: img.species
            };
          });
          setSpeciesImages(imageMap);
        }
      } catch (error) {
        console.error('Error fetching species images:', error);
        // Fallback to empty object
        setSpeciesImages({});
      }
    }
  };

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && !rewards) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bazar-container">
      <div className="adopt-card">
        <Link to="/town" className="button secondary">
          <i className="fas fa-arrow-left mr-2"></i> Back to Town
        </Link>
        <h1>Game Corner</h1>
      </div>

      <div className="game-corner-content">
        <div className="video-section">
          <div className="video-header">
            <h2>Pomodoro Videos</h2>
            <button
              className="button secondary"
              onClick={() => setShowVideoForm(!showVideoForm)}
            >
              {showVideoForm ? 'Cancel' : 'Add Custom Video'}
            </button>
          </div>

          {showVideoForm && (
            <form className="video-form" onSubmit={handleVideoSubmit}>
              <input
                type="text"
                placeholder="Enter YouTube URL"
                value={customVideoUrl}
                onChange={(e) => setCustomVideoUrl(e.target.value)}
                className="form-input"
              />
              <button type="submit" className="button primary">Add Video</button>
            </form>
          )}

          <div className="video-player">
            {videoLoading && !videoError && (
              <div className="video-loading">
                <LoadingSpinner />
                <p>Loading video...</p>
              </div>
            )}
            
            {videoError ? (
              <div className="video-error">
                <div className="error-content">
                  <i className="fas fa-exclamation-triangle"></i>
                  <h3>Video Unavailable</h3>
                  <p>This video cannot be played due to restrictions or connectivity issues.</p>
                  <div className="stat-group">
                    <button 
                      className="button secondary"
                      onClick={() => handleVideoSelect(selectedVideo)}
                    >
                      <i className="fas fa-redo mr-2"></i>Try Again
                    </button>
                    <a 
                      href={`https://youtube.com/watch?v=${selectedVideo.videoId || selectedVideo.url.split('/').pop().split('?')[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button primary"
                    >
                      <i className="fas fa-external-link-alt mr-2"></i>Watch on YouTube
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                src={selectedVideo.url}
                title={selectedVideo.title}
                style={{ border: 0, display: videoLoading ? 'none' : 'block' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation"
                onLoad={handleVideoLoad}
                onError={handleVideoError}
              ></iframe>
            )}
          </div>

          <div className="video-list">
            {defaultVideos.map(video => (
              <button
                key={video.id}
                className={`video-item${selectedVideo.id === video.id ? 'active' : ''}`}
                onClick={() => handleVideoSelect(video)}
              >
                {video.title}
              </button>
            ))}
          </div>
        </div>

        <div className="timer-section">
          <div className="timer-display">
            <svg viewBox="0 0 100 100">
              <circle
                className="timer-background"
                cx="50"
                cy="50"
                r="45"
              />
              <circle
                className="timer-progress"
                ref={circleRef}
                cx="50"
                cy="50"
                r="45"
                strokeDasharray="283"
                strokeDashoffset="0"
              />
            </svg>
            <div className="timer-text">
              <div className="timer-time">{formatTime(timeRemaining)}</div>
              <div className="timer-label">{isBreak ? 'Break' : 'Focus'}</div>
              <div className="timer-session">
                {isBreak ? `${completedSessions}/${sessionCount} (Break)` : `${completedSessions + 1}/${sessionCount}`}
              </div>
            </div>
          </div>

          <div className="timer-controls">
            <div className="timer-buttons">
              {!timerActive ? (
                <button className="button primary" onClick={startTimer}>
                  <i className="fas fa-play mr-2"></i> Start
                </button>
              ) : (
                <button className="button secondary" onClick={pauseTimer}>
                  <i className="fas fa-pause mr-2"></i> Pause
                </button>
              )}
              <button className="button danger" onClick={resetTimer}>
                <i className="fas fa-redo mr-2"></i> Reset
              </button>
            </div>

            <div className="timer-settings">
              <div className="set-item">
                <label>Session Length (min)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={sessionLength}
                  onChange={(e) => setSessionLength(parseInt(e.target.value))}
                  disabled={timerActive}
                />
              </div>

              <div className="set-item">
                <label>Break Length (min)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={breakLength}
                  onChange={(e) => setBreakLength(parseInt(e.target.value))}
                  disabled={timerActive}
                />
              </div>

              <div className="set-item">
                <label>Long Break Length (min)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreakLength}
                  onChange={(e) => setLongBreakLength(parseInt(e.target.value))}
                  disabled={timerActive}
                />
              </div>

              <div className="set-item">
                <label>Number of Sessions</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sessionCount}
                  onChange={(e) => setSessionCount(parseInt(e.target.value))}
                  disabled={timerActive}
                />
              </div>

            </div>
            
            <div className="audio-setting" style={{ paddingTop: '12px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={audioEnabled}
                  onChange={(e) => setAudioEnabled(e.target.checked)}
                  className="mr-2"
                />
                Audio Notifications
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Productivity Rating Modal */}
      {showProductivityRating && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>How productive were you?</h2>
            <p>Rate your productivity during this pomodoro session:</p>

            <div className="productivity-ratings">
              {[0, 20, 40, 60, 80, 100].map(rating => (
                <button
                  key={rating}
                  className="button secondary"
                  onClick={() => handleProductivityRating(rating)}
                >
                  {rating}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rewards Modal */}
      {showRewards && rewards && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Your Rewards</h2>
            <div className="rewards-summary">
              <div className="reward-stat">
                <span>Completed Sessions:</span>
                <span>{completedSessions}</span>
              </div>
              <div className="reward-stat">
                <span>Total Focus Minutes:</span>
                <span>{totalFocusMinutes}</span>
              </div>
              <div className="reward-stat">
                <span>Productivity Score:</span>
                <span>{productivityRating}%</span>
              </div>
            </div>

            {/* Monster Rewards - Separate Grid */}
            {rewards.rewards && rewards.rewards.filter(reward => reward.type === 'monster').length > 0 && (
              <div className="other-rewards-section">
                <h3>Monster Rewards</h3>
                <div className="button">
                  {rewards.rewards.filter(reward => reward.type === 'monster').map((reward, index) => (
                    <MonsterRewardCard
                      key={reward.id || index}
                      reward={reward}
                      trainers={trainers}
                      selectedTrainerId={(() => {
                        const trainerId = selectedTrainers[reward.id] || reward.assigned_to;
                        console.log(`MonsterRewardCard for ${reward.id}: selectedTrainerId=${trainerId}, reward.assigned_to=${reward.assigned_to}, selectedTrainers[${reward.id}]=${selectedTrainers[reward.id]}`);
                        return trainerId;
                      })()}
                      onTrainerSelect={handleTrainerSelect}
                      onNameChange={handleMonsterNameChange}
                      onClaim={claimReward}
                      isClaiming={loading}
                      isClaimedBy={reward.claimed_by}
                      speciesImages={speciesImages}
                      monsterName={monsterNames[reward.id] || ''}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Rewards - Separate Grid */}
            {rewards.rewards && rewards.rewards.filter(reward => reward.type !== 'monster').length > 0 && (
              <div className="other-rewards-section">
                <h3>Other Rewards</h3>
                <div className="rewards-list">
                  {rewards.rewards.filter(reward => reward.type !== 'monster').map((reward, index) => (
                    <div key={index} className="area-card claimed">
                    <div className={`reward-icon${reward.type}`}>
                      <i className={
                        reward.type === 'coin' ? 'fas fa-coins' :
                        reward.type === 'item' ? 'fas fa-box' :
                        reward.type === 'level' ? 'fas fa-level-up-alt' :
                        'fas fa-gift'
                      }></i>
                    </div>
                    <div className="reward-title">
                      {reward.reward_data.title ||
                       (reward.type === 'coin' ? `${reward.reward_data.amount} Coins` :
                        reward.type === 'item' ? reward.reward_data.name :
                        reward.type === 'level' ? `${reward.reward_data.levels} Level${reward.reward_data.levels > 1 ? 's' : ''}` :
                        'Mystery Reward')}
                    </div>
                    <div className="reward-description">
                      {reward.type === 'coin' ? `${reward.reward_data.amount} coins` :
                       reward.type === 'item' ? `${reward.reward_data.quantity} ${reward.reward_data.name}` :
                       reward.type === 'level' ? `${reward.reward_data.levels} level${reward.reward_data.levels > 1 ? 's' : ''}` :
                       'Mystery reward'}
                    </div>
                    <div className={`reward-rarity${reward.rarity}`}>
                      {reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1)}
                    </div>
                    <div className="reward-assigned">
                      <div className="claimed-badge">
                        <i className="fas fa-check-circle mr-2"></i>
                        Claimed by: {
                          (() => {
                            console.log(`Looking for trainer with ID: "${reward.claimed_by}" (type: ${typeof reward.claimed_by})`);
                            console.log('Available trainers:', trainers.map(t => ({ id: t.id, name: t.name, type: typeof t.id })));
                            const trainer = trainers.find(t => t.id === reward.claimed_by);
                            console.log('Found trainer:', trainer);
                            
                            if (reward.claimed_by_type === 'monster' && reward.claimed_by_monster_name) {
                              return `${trainer?.name || 'Unknown'}'s ${reward.claimed_by_monster_name}`;
                            } else {
                              return trainer?.name || 'Unknown';
                            }
                          })()
                        }
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              </div>
            )}

            <button
              className="button primary"
              onClick={() => {
                setShowRewards(false);
                resetTimer();
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} />}
    </div>
  );
};

export default GameCorner;
