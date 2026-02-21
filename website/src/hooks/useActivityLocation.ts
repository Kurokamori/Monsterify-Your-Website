import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@contexts/useAuth';
import townService from '@services/townService';
import type { ActivitySession, ActivityPrompt, ActivityFlavor } from '@components/town';
import type { ActivityCooldown } from '@services/townService';
import { extractErrorMessage } from '../utils/errorUtils';

interface ActiveSessionRef {
  session_id: string;
  activity: string;
}

interface UseActivityLocationReturn {
  loading: boolean;
  error: string | null;
  activeSession: ActiveSessionRef | null;
  cooldown: Record<string, ActivityCooldown>;
  showSession: boolean;
  sessionData: ActivitySession | null;
  promptData: ActivityPrompt | null;
  flavorData: ActivityFlavor | null;
  sessionLoading: boolean;
  startActivity: (activity: string) => Promise<void>;
  continueSession: () => Promise<void>;
  handleSessionComplete: () => void;
  returnToActivity: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  setError: (error: string | null) => void;
}

/**
 * Shared hook for activity location pages (Garden, Pirate's Dock, etc.)
 * Encapsulates the common pattern: fetch status → start activity → show session → complete → rewards
 */
export function useActivityLocation(location: string): UseActivityLocationReturn {
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSessionRef | null>(null);
  const [cooldown, setCooldown] = useState<Record<string, ActivityCooldown>>({});

  const [showSession, setShowSession] = useState(false);
  const [sessionData, setSessionData] = useState<ActivitySession | null>(null);
  const [promptData, setPromptData] = useState<ActivityPrompt | null>(null);
  const [flavorData, setFlavorData] = useState<ActivityFlavor | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await townService.getLocationStatus(location);

      setActiveSession(response.active_session ?? null);

      if (response.cooldown) {
        // Normalize cooldown — the API returns either a single cooldown object
        // (Garden: { active, time_remaining }) or per-activity cooldowns
        // (PiratesDock: { swab: { active, ... }, fishing: { active, ... } })
        const cd = response.cooldown;
        if ('active' in cd && typeof cd.active === 'boolean') {
          // Single cooldown — wrap under the location key
          setCooldown({ [location]: cd as ActivityCooldown });
        } else {
          setCooldown(cd as Record<string, ActivityCooldown>);
        }
      }
    } catch (err) {
      setError(extractErrorMessage(err, `Failed to load ${location.replace(/[-_]/g, ' ')} status. Please try again later.`));
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchStatus]);

  const startActivity = useCallback(async (activity: string) => {
    try {
      setSessionLoading(true);
      setError(null);
      const response = await townService.startActivity(location, activity);

      if (response.success && response.session_id) {
        const sessionResponse = await townService.getActivitySession(response.session_id);

        if (sessionResponse.success && sessionResponse.session && sessionResponse.prompt && sessionResponse.flavor) {
          setSessionData({
            session_id: sessionResponse.session.session_id,
            location: sessionResponse.session.location,
            activity: sessionResponse.session.activity,
            created_at: sessionResponse.session.created_at,
          });
          setPromptData({
            id: sessionResponse.prompt.prompt_id,
            prompt_text: sessionResponse.prompt.prompt_text,
          });
          setFlavorData({
            id: sessionResponse.flavor.flavor_id,
            flavor_text: sessionResponse.flavor.flavor_text,
            image_url: sessionResponse.flavor.image_url,
          });
          setShowSession(true);
          setActiveSession({
            session_id: sessionResponse.session.session_id,
            activity: sessionResponse.session.activity,
          });
        } else {
          setError(sessionResponse.message || 'Failed to load session details');
        }
      } else {
        setError(response.message || 'Failed to start activity. Please try again.');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to start activity. Please try again later.'));
    } finally {
      setSessionLoading(false);
      setLoading(false);
    }
  }, [location]);

  const continueSession = useCallback(async () => {
    if (!activeSession) return;
    try {
      setSessionLoading(true);
      setError(null);
      const sessionResponse = await townService.getActivitySession(activeSession.session_id);

      if (sessionResponse.success && sessionResponse.session && sessionResponse.prompt && sessionResponse.flavor) {
        setSessionData({
          session_id: sessionResponse.session.session_id,
          location: sessionResponse.session.location,
          activity: sessionResponse.session.activity,
          created_at: sessionResponse.session.created_at,
        });
        setPromptData({
          id: sessionResponse.prompt.prompt_id,
          prompt_text: sessionResponse.prompt.prompt_text,
        });
        setFlavorData({
          id: sessionResponse.flavor.flavor_id,
          flavor_text: sessionResponse.flavor.flavor_text,
          image_url: sessionResponse.flavor.image_url,
        });
        setShowSession(true);
      } else {
        setError(sessionResponse.message || 'Failed to load session details');
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load session details. Please try again later.'));
    } finally {
      setSessionLoading(false);
    }
  }, [activeSession]);

  const handleSessionComplete = useCallback(() => {
    setActiveSession(null);
    fetchStatus();
  }, [fetchStatus]);

  const returnToActivity = useCallback(async () => {
    setShowSession(false);
    setSessionData(null);
    setPromptData(null);
    setFlavorData(null);
    setActiveSession(null);

    try {
      await townService.clearActivitySession(location);
    } catch {
      // Silently handle — we still want to refresh status
    }

    fetchStatus();
  }, [location, fetchStatus]);

  return {
    loading,
    error,
    activeSession,
    cooldown,
    showSession,
    sessionData,
    promptData,
    flavorData,
    sessionLoading,
    startActivity,
    continueSession,
    handleSessionComplete,
    returnToActivity,
    refreshStatus: fetchStatus,
    setError,
  };
}
