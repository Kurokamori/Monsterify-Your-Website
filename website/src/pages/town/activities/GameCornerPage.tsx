import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import townService from '@services/townService';
import type { GameCornerRewardData, GameCornerTrainer } from '@services/townService';
import trainerService from '@services/trainerService';
import speciesService from '@services/speciesService';
import type { SpeciesImageMap } from '@services/speciesService';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import { Modal } from '@components/common/Modal';
import { ActivityRewardGrid } from '@components/town/ActivityRewardGrid';
import { extractErrorMessage } from '@utils/errorUtils';
import type { ActivityReward } from '@components/town';
import '@styles/town/activities.css';
import '@styles/town/game-corner.css';

// ============================================================================
// Constants
// ============================================================================

type VideoEntry = {
  id: string;
  title: string;
  videoId: string;
  url: string;
};

const createYouTubeEmbedUrl = (videoId: string): string => {
  const params = new URLSearchParams({
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    rel: '0',
    modestbranding: '1',
    fs: '1',
    cc_load_policy: '0',
    iv_load_policy: '3',
    autohide: '1',
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

const DEFAULT_VIDEOS: VideoEntry[] = [
  { id: 'lofi1', title: 'Lofi Pokemon Mix', videoId: '2DVpys50LVE', url: createYouTubeEmbedUrl('2DVpys50LVE') },
  { id: 'lofi2', title: 'Lofi Digimon Mix', videoId: 'k6qtIhpJOf8', url: createYouTubeEmbedUrl('k6qtIhpJOf8') },
  { id: 'lofi3', title: 'Relaxing Pokemon Music', videoId: 'UyOnnLZTbhc', url: createYouTubeEmbedUrl('UyOnnLZTbhc') },
  { id: 'lofi4', title: 'Lofi Yokai Mix', videoId: 'VeAWlajUUy8', url: createYouTubeEmbedUrl('VeAWlajUUy8') },
  { id: 'lofi5', title: 'Lofi Palmon Mix', videoId: 'Ok61eoA1QaU', url: createYouTubeEmbedUrl('Ok61eoA1QaU') },
  { id: 'lofi6', title: 'Lofi Final Fantasy Mix', videoId: 'WFRzzhpvlqs?si=0_APZHiWeIMBcGlz', url: createYouTubeEmbedUrl('WFRzzhpvlqs?si=0_APZHiWeIMBcGlz') },
  { id: 'lofi7', title: 'Lofi Monster Hunter Mix', videoId: '6-5F85HpXkQ?si=qU979KmQFX7Ht_td', url: createYouTubeEmbedUrl('6-5F85HpXkQ?si=qU979KmQFX7Ht_td') },
];

const AUDIO_FILES = {
  breakStart: '/audio/break-start.mp3',
  breakEnd: '/audio/break-end.mp3',
  sessionComplete: '/audio/session-complete.mp3',
} as const;

const YOUTUBE_URL_REGEX = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;

const PRODUCTIVITY_RATINGS = [0, 20, 40, 60, 80, 100] as const;

// ============================================================================
// Helpers
// ============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function shouldUseLongBreak(completedSessionCount: number): boolean {
  return completedSessionCount > 0 && completedSessionCount % 4 === 0;
}

function playAudioNotification(type: keyof typeof AUDIO_FILES, enabled: boolean): void {
  if (!enabled) return;
  try {
    const audio = new Audio(AUDIO_FILES[type]);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    // Audio not available
  }
}


// ============================================================================
// Component
// ============================================================================

export default function GameCornerPage() {
  useDocumentTitle('Game Corner');

  const { currentUser, isAuthenticated } = useAuth();

  // --- Data state ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainers, setTrainers] = useState<GameCornerTrainer[]>([]);

  // --- Video state ---
  const [selectedVideo, setSelectedVideo] = useState<VideoEntry>(DEFAULT_VIDEOS[0]);
  const [customVideoUrl, setCustomVideoUrl] = useState('');
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);

  // --- Timer state ---
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionLength, setSessionLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [longBreakLength, setLongBreakLength] = useState(15);
  const [sessionCount, setSessionCount] = useState(4);
  const [, setCurrentSession] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [totalTimerDuration, setTotalTimerDuration] = useState(0);

  // --- Rewards state ---
  const [showProductivityRating, setShowProductivityRating] = useState(false);
  const [productivityRating, setProductivityRating] = useState(0);
  const [showRewards, setShowRewards] = useState(false);
  const [rewards, setRewards] = useState<GameCornerRewardData[] | null>(null);
  const [rewardStats, setRewardStats] = useState<{
    completedSessions: number;
    totalFocusMinutes: number;
    productivityScore: number;
  } | null>(null);
  const [selectedTrainers, setSelectedTrainers] = useState<Record<string, number>>({});
  const [monsterNames, setMonsterNames] = useState<Record<string, string>>({});
  const [speciesImages, setSpeciesImages] = useState<SpeciesImageMap>({});
  const [claimingReward, setClaimingReward] = useState<string | null>(null);

  // --- Audio state ---
  const [audioEnabled, setAudioEnabled] = useState(false);

  // --- Refs ---
  const circleRef = useRef<SVGCircleElement>(null);

  // ==========================================================================
  // Fetch trainers on mount
  // ==========================================================================

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchTrainers = async () => {
      try {
        setLoading(true);
        const userId = currentUser?.discord_id;
        const response = await trainerService.getUserTrainers(userId);
        setTrainers(
          (response.trainers || []).map(t => ({
            id: typeof t.id === 'string' ? parseInt(t.id, 10) : t.id as number,
            name: t.name,
            level: t.level as number | undefined,
          })),
        );
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load trainers. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, [isAuthenticated, currentUser?.discord_id]);

  // ==========================================================================
  // Timer Effect — uses Date.now() to survive background tab throttling
  // ==========================================================================

  const handleTimerComplete = useCallback(() => {
    setTimerActive(false);
    setTimerStartTime(null);

    if (!isBreak) {
      // Focus session completed
      setCompletedSessions(prev => {
        const newCompleted = prev + 1;

        if (newCompleted >= sessionCount) {
          playAudioNotification('sessionComplete', audioEnabled);
          setShowProductivityRating(true);
          return newCompleted;
        }

        // Start a break
        playAudioNotification('breakStart', audioEnabled);
        setIsBreak(true);
        const breakTime = (shouldUseLongBreak(newCompleted) ? longBreakLength : breakLength) * 60;
        setTimeRemaining(breakTime);
        setTotalTimerDuration(breakTime);
        setTimerStartTime(Date.now());
        setTimerActive(true);

        return newCompleted;
      });
      setTotalFocusMinutes(prev => prev + sessionLength);
    } else {
      // Break completed
      setIsBreak(false);
      setCurrentSession(prev => {
        const next = prev + 1;

        if (next >= sessionCount) {
          playAudioNotification('sessionComplete', audioEnabled);
          setShowProductivityRating(true);
          return next;
        }

        // Start next focus session
        playAudioNotification('breakEnd', audioEnabled);
        const sessionTime = sessionLength * 60;
        setTimeRemaining(sessionTime);
        setTotalTimerDuration(sessionTime);
        setTimerStartTime(Date.now());
        setTimerActive(true);

        return next;
      });
    }
  }, [isBreak, sessionCount, sessionLength, breakLength, longBreakLength, audioEnabled]);

  useEffect(() => {
    if (!timerActive || !timerStartTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - timerStartTime) / 1000);
      const remaining = Math.max(0, totalTimerDuration - elapsed);

      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleTimerComplete();
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 100);

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
  }, [timerActive, timerStartTime, totalTimerDuration, handleTimerComplete]);

  // ==========================================================================
  // Circle progress update
  // ==========================================================================

  useEffect(() => {
    if (!circleRef.current) return;

    let total: number;
    if (totalTimerDuration > 0) {
      total = totalTimerDuration;
    } else {
      total = isBreak
        ? (shouldUseLongBreak(completedSessions) ? longBreakLength : breakLength) * 60
        : sessionLength * 60;
    }

    const ratio = timeRemaining / total;
    const dashOffset = 283 * (1 - ratio);
    circleRef.current.style.strokeDashoffset = String(dashOffset);
  }, [timeRemaining, totalTimerDuration, isBreak, completedSessions, sessionLength, breakLength, longBreakLength]);

  // ==========================================================================
  // Timer controls
  // ==========================================================================

  const startTimer = () => {
    if (completedSessions >= sessionCount) {
      setShowProductivityRating(true);
      return;
    }

    if (!timerActive) {
      const now = Date.now();

      if (timeRemaining === 0) {
        const newTime = isBreak
          ? (shouldUseLongBreak(completedSessions) ? longBreakLength : breakLength) * 60
          : sessionLength * 60;
        setTimeRemaining(newTime);
        setTotalTimerDuration(newTime);
        setTimerStartTime(now);
      } else {
        // Resume from pause
        setTotalTimerDuration(timeRemaining);
        setTimerStartTime(now);
      }

      setTimerActive(true);
    }
  };

  const pauseTimer = () => {
    setTimerActive(false);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimeRemaining(sessionLength * 60);
    setIsBreak(false);
    setCurrentSession(0);
    setCompletedSessions(0);
    setTotalFocusMinutes(0);
    setTimerStartTime(null);
    setTotalTimerDuration(0);
  };

  // ==========================================================================
  // Video handlers
  // ==========================================================================

  const handleVideoSelect = (video: VideoEntry) => {
    setSelectedVideo(video);
    setVideoError(false);
    setVideoLoading(true);
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVideoUrl) return;

    const match = customVideoUrl.match(YOUTUBE_URL_REGEX);
    if (match?.[1]) {
      const videoId = match[1];
      handleVideoSelect({
        id: `custom-${Date.now()}`,
        title: 'Custom Video',
        videoId,
        url: createYouTubeEmbedUrl(videoId),
      });
      setCustomVideoUrl('');
      setShowVideoForm(false);
    } else {
      setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
    }
  };

  // ==========================================================================
  // Productivity rating → generate rewards
  // ==========================================================================

  const handleProductivityRating = async (rating: number) => {
    setProductivityRating(rating);
    setShowProductivityRating(false);

    try {
      setLoading(true);
      setError(null);

      const result = await townService.generateGameCornerRewards({
        completedSessions,
        totalFocusMinutes,
        productivityScore: rating,
      });

      setRewards(result.rewards);
      setRewardStats(result.stats);

      // Update trainers from response (gets fresh names/data)
      if (result.trainers?.length) {
        setTrainers(result.trainers);
      }

      // Fetch species images for monster rewards
      const allSpecies = new Set<string>();
      for (const reward of result.rewards) {
        if (reward.type === 'monster') {
          const rd = reward.reward_data;
          if (rd.species1) allSpecies.add(rd.species1 as string);
          if (rd.species2) allSpecies.add(rd.species2 as string);
          if (rd.species3) allSpecies.add(rd.species3 as string);
        }
      }
      if (allSpecies.size > 0) {
        try {
          const images = await speciesService.getSpeciesImages(Array.from(allSpecies));
          setSpeciesImages(images);
        } catch {
          setSpeciesImages({});
        }
      }

      setShowRewards(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to generate rewards. Please try again later.'));
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // Claim reward (manual, for monster rewards that need naming)
  // ==========================================================================

  const claimReward = async (reward: GameCornerRewardData) => {
    const trainerId = selectedTrainers[reward.id] || reward.assigned_to;
    if (!trainerId) {
      setError('Please select a trainer for this reward.');
      return;
    }

    try {
      setClaimingReward(reward.id);
      setError(null);

      const requestData = { ...reward };
      if (reward.type === 'monster' && monsterNames[reward.id]) {
        (requestData.reward_data as Record<string, unknown>).monsterName = monsterNames[reward.id];
      }

      const response = await townService.claimGameCornerReward(
        reward.id,
        trainerId,
        requestData,
        reward.type === 'monster' ? monsterNames[reward.id] : undefined,
      );

      if (response.success && response.reward) {
        setRewards(prev =>
          prev?.map(r => r.id === reward.id ? { ...r, ...response.reward! } : r) ?? null,
        );
      } else {
        setError(response.message || 'Failed to claim reward.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to claim reward. Please try again.'));
    } finally {
      setClaimingReward(null);
    }
  };

  const forfeitReward = async (rewardId: string | number) => {
    const reward = rewards?.find(r => r.id === String(rewardId));
    if (!reward || reward.type !== 'monster') {
      setError('Only monster rewards can be forfeited.');
      return;
    }

    try {
      setClaimingReward(reward.id);
      setError(null);

      const response = await townService.forfeitGameCornerReward(
        reward,
        monsterNames[reward.id],
      );

      if (response.success) {
        setRewards(prev =>
          prev?.map(r => r.id === reward.id
            ? { ...r, claimed: true, claimed_by: -1, claimed_at: new Date().toISOString() }
            : r
          ) ?? null,
        );
      } else {
        setError(response.message || 'Failed to forfeit reward.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to forfeit reward. Please try again.'));
    } finally {
      setClaimingReward(null);
    }
  };

  const handleCloseRewards = () => {
    setShowRewards(false);
    setRewards(null);
    setRewardStats(null);
    setSelectedTrainers({});
    setMonsterNames({});
    setSpeciesImages({});
    resetTimer();
  };

  // ==========================================================================
  // Render helpers
  // ==========================================================================

  // Map GameCornerRewardData to ActivityReward for the shared grid
  const rewardsList = rewards ?? [];
  const mappedRewards: ActivityReward[] = rewardsList.map(r => ({
    id: r.id as unknown as number,
    type: r.type as ActivityReward['type'],
    rarity: r.rarity as ActivityReward['rarity'],
    claimed: r.claimed,
    claimed_by: r.claimed_by ?? undefined,
    claimed_at: r.claimed_at ?? undefined,
    assigned_to: r.assigned_to ?? undefined,
    reward_data: (r.reward_data ?? {}) as never,
  }));

  // Build extras map for claimed_by_monster_name display
  const rewardExtras: Record<string, { claimed_by_monster_name?: string; claimed_by_type?: string }> = {};
  for (const r of rewardsList) {
    if (r.claimed_by_monster_name || r.claimed_by_type) {
      rewardExtras[r.id] = {
        claimed_by_monster_name: r.claimed_by_monster_name,
        claimed_by_type: r.claimed_by_type,
      };
    }
  }

  // ==========================================================================
  // Loading state
  // ==========================================================================

  if (loading && !rewards) {
    return (
      <div className="activity-page">
        <LoadingSpinner message="Loading Game Corner..." />
      </div>
    );
  }

  // ==========================================================================
  // Auth guard
  // ==========================================================================

  if (!isAuthenticated) {
    return (
      <div className="activity-page">
        <div className="activity-page__breadcrumb">
          <Link to="/town" className="breadcrumb-link">
            <i className="fas fa-arrow-left"></i> Back to Town
          </Link>
        </div>
        <div className="activity-page__header">
          <div className="activity-page__icon">
            <i className="fas fa-dice"></i>
          </div>
          <div>
            <h1>Game Corner</h1>
          </div>
        </div>
        <div className="activity-page__auth">
          <p>Please log in to access the Game Corner.</p>
          <Link to="/login" className="button primary">Log In</Link>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Main render
  // ==========================================================================

  return (
    <div className="activity-page">
      <div className="activity-page__breadcrumb">
        <Link to="/town" className="breadcrumb-link">
          <i className="fas fa-arrow-left"></i> Back to Town
        </Link>
      </div>

      <div className="activity-page__header">
        <div className="activity-page__icon">
          <i className="fas fa-dice"></i>
        </div>
        <div>
          <h1>Game Corner</h1>
          <p className="activity-page__description">
            Focus, relax, and earn rewards with the Pomodoro timer
          </p>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Main Layout: Video + Timer                                       */}
      {/* ================================================================ */}

      <div className="game-corner__layout">
        {/* Video Section */}
        <div className="game-corner__video-section">
          <div className="game-corner__video-header">
            <h2>Pomodoro Videos</h2>
            <button
              className="button secondary sm"
              onClick={() => setShowVideoForm(prev => !prev)}
            >
              {showVideoForm ? 'Cancel' : 'Add Custom Video'}
            </button>
          </div>

          {showVideoForm && (
            <form className="game-corner__video-form" onSubmit={handleVideoSubmit}>
              <input
                type="text"
                placeholder="Enter YouTube URL"
                value={customVideoUrl}
                onChange={e => setCustomVideoUrl(e.target.value)}
              />
              <button type="submit" className="button primary sm">Add</button>
            </form>
          )}

          <div className="game-corner__video-player">
            {videoLoading && !videoError && (
              <div className="game-corner__video-loading">
                <LoadingSpinner />
                <p>Loading video...</p>
              </div>
            )}

            {videoError ? (
              <div className="game-corner__video-error">
                <div className="game-corner__video-error-content">
                  <i className="fas fa-exclamation-triangle"></i>
                  <h3>Video Unavailable</h3>
                  <p>This video cannot be played due to restrictions or connectivity issues.</p>
                  <div className="game-corner__video-error-actions">
                    <button
                      className="button secondary sm"
                      onClick={() => handleVideoSelect(selectedVideo)}
                    >
                      <i className="fas fa-redo"></i> Try Again
                    </button>
                    <a
                      href={`https://youtube.com/watch?v=${selectedVideo.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button primary sm"
                    >
                      <i className="fas fa-external-link-alt"></i> Watch on YouTube
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
                onLoad={() => { setVideoLoading(false); setVideoError(false); }}
                onError={() => { setVideoLoading(false); setVideoError(true); }}
              />
            )}
          </div>

          <div className="game-corner__video-list">
            {DEFAULT_VIDEOS.map(video => (
              <button
                key={video.id}
                className={`game-corner__video-item${selectedVideo.id === video.id ? ' game-corner__video-item--active' : ''}`}
                onClick={() => handleVideoSelect(video)}
              >
                {video.title}
              </button>
            ))}
          </div>
        </div>

        {/* Timer Section */}
        <div className="game-corner__timer-section">
          <div className="game-corner__timer-display">
            <svg viewBox="0 0 100 100">
              <circle
                className="game-corner__timer-bg"
                cx="50"
                cy="50"
                r="45"
              />
              <circle
                className={`game-corner__timer-progress${isBreak ? ' game-corner__timer-progress--break' : ''}`}
                ref={circleRef}
                cx="50"
                cy="50"
                r="45"
                strokeDasharray="283"
                strokeDashoffset="0"
              />
            </svg>
            <div className="game-corner__timer-text">
              <div className="game-corner__timer-time">{formatTime(timeRemaining)}</div>
              <div className="game-corner__timer-label">{isBreak ? 'Break' : 'Focus'}</div>
              <div className="game-corner__timer-session">
                {isBreak
                  ? `${completedSessions}/${sessionCount} (Break)`
                  : `${completedSessions + 1}/${sessionCount}`}
              </div>
            </div>
          </div>

          <div className="game-corner__timer-controls">
            <div className="game-corner__timer-buttons">
              {!timerActive ? (
                <button className="button primary sm" onClick={startTimer}>
                  <i className="fas fa-play"></i> Start
                </button>
              ) : (
                <button className="button secondary sm" onClick={pauseTimer}>
                  <i className="fas fa-pause"></i> Pause
                </button>
              )}
              <button className="button danger sm" onClick={resetTimer}>
                <i className="fas fa-redo"></i> Reset
              </button>
            </div>

            <div className="game-corner__timer-settings">
              <div className="game-corner__setting">
                <label>Session Length (min)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={sessionLength}
                  onChange={e => setSessionLength(parseInt(e.target.value) || 25)}
                  disabled={timerActive}
                />
              </div>

              <div className="game-corner__setting">
                <label>Break Length (min)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={breakLength}
                  onChange={e => setBreakLength(parseInt(e.target.value) || 5)}
                  disabled={timerActive}
                />
              </div>

              <div className="game-corner__setting">
                <label>Long Break Length (min)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreakLength}
                  onChange={e => setLongBreakLength(parseInt(e.target.value) || 15)}
                  disabled={timerActive}
                />
              </div>

              <div className="game-corner__setting">
                <label>Number of Sessions</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sessionCount}
                  onChange={e => setSessionCount(parseInt(e.target.value) || 4)}
                  disabled={timerActive}
                />
              </div>
            </div>

            <label className="game-corner__audio-toggle">
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={e => setAudioEnabled(e.target.checked)}
              />
              Audio Notifications
            </label>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* Productivity Rating Modal                                        */}
      {/* ================================================================ */}

      <Modal
        isOpen={showProductivityRating}
        onClose={() => setShowProductivityRating(false)}
        title="How productive were you?"
        size="small"
        closeOnOverlayClick={false}
      >
        <p>Rate your productivity during this pomodoro session:</p>
        <div className="game-corner__productivity-grid">
          {PRODUCTIVITY_RATINGS.map(rating => (
            <button
              key={rating}
              className="button secondary"
              onClick={() => handleProductivityRating(rating)}
            >
              {rating}%
            </button>
          ))}
        </div>
      </Modal>

      {/* ================================================================ */}
      {/* Rewards Modal                                                    */}
      {/* ================================================================ */}

      <Modal
        isOpen={showRewards && rewards != null}
        onClose={handleCloseRewards}
        title="Your Rewards"
        size="large"
        footer={
          <button className="button primary" onClick={handleCloseRewards}>
            Close
          </button>
        }
      >
        {/* Stats Summary */}
        {rewardStats && (
          <div className="game-corner__rewards-stats">
            <div className="game-corner__stat">
              <span className="game-corner__stat-label">Completed Sessions</span>
              <span className="game-corner__stat-value">{rewardStats.completedSessions}</span>
            </div>
            <div className="game-corner__stat">
              <span className="game-corner__stat-label">Focus Minutes</span>
              <span className="game-corner__stat-value">{rewardStats.totalFocusMinutes}</span>
            </div>
            <div className="game-corner__stat">
              <span className="game-corner__stat-label">Productivity</span>
              <span className="game-corner__stat-value">{productivityRating}%</span>
            </div>
          </div>
        )}

        <ActivityRewardGrid
          rewards={mappedRewards}
          trainers={trainers}
          selectedTrainers={selectedTrainers}
          onTrainerSelect={(rewardId, trainerId) => {
            if (trainerId != null) {
              setSelectedTrainers(prev => ({ ...prev, [String(rewardId)]: Number(trainerId) }));
            }
          }}
          onClaim={(rewardId) => {
            const reward = rewards?.find(r => r.id === String(rewardId));
            if (reward) claimReward(reward);
          }}
          onForfeit={forfeitReward}
          claimingReward={claimingReward}
          speciesImages={speciesImages}
          monsterNames={monsterNames}
          onMonsterNameChange={(rewardId, name) => {
            setMonsterNames(prev => ({ ...prev, [String(rewardId)]: name }));
          }}
          rewardExtras={rewardExtras}
        />
      </Modal>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
    </div>
  );
}
