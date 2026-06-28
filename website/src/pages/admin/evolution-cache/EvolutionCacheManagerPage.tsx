import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ConfirmModal } from '@components/common/ConfirmModal';
import evolutionService, { type EvolutionCacheVersion } from '@services/evolutionService';
import evolutionCacheService from '@services/evolutionCacheService';
import '@styles/admin/evolution-cache.css';

function EvolutionCacheManagerContent() {
  useDocumentTitle('Evolution Cache Manager');

  const [cacheVersion, setCacheVersion] = useState<EvolutionCacheVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [busting, setBusting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadVersion = useCallback(async () => {
    setLoading(true);
    const version = await evolutionService.getCacheVersion();
    setCacheVersion(version);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVersion();
  }, [loadVersion]);

  const handleBust = useCallback(async () => {
    setShowConfirm(false);
    setBusting(true);
    setMessage(null);
    try {
      const updated = await evolutionService.bumpCacheVersion();
      setCacheVersion(updated);
      // Clear this browser's cache immediately and record the new version so it
      // doesn't get cleared again on the next sync.
      evolutionCacheService.clearEvolutionCache();
      evolutionCacheService.clearReverseEvolutionCache();
      evolutionCacheService.clearSearchCache();
      evolutionCacheService.syncVersion(updated.version);
      setMessage({
        type: 'success',
        text: `Cache cleared. New version is ${updated.version}. All users will get fresh evolution data on their next visit.`,
      });
    } catch (err) {
      const text = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to clear cache')
        : err instanceof Error ? err.message : 'Failed to clear cache';
      setMessage({ type: 'error', text });
    } finally {
      setBusting(false);
    }
  }, []);

  return (
    <div className="evolution-cache">
      <div className="evolution-cache__header">
        <h1><i className="fas fa-sync-alt"></i> Evolution Cache Manager</h1>
        <p>
          The Evolution Explorer caches evolution data in each visitor&apos;s browser.
          If the data was wrong (for example a bad cross-franchise link), clear the
          cache here to force every user to reload fresh data on their next visit.
        </p>
      </div>

      <div className="evolution-cache__panel">
        {loading ? (
          <LoadingSpinner message="Loading cache status..." />
        ) : (
          <>
            <div className="evolution-cache__status">
              <span className="evolution-cache__status-label">Current cache version</span>
              <span className="evolution-cache__status-value">
                {cacheVersion ? cacheVersion.version : 'Unavailable'}
              </span>
              {cacheVersion && (
                <span className="evolution-cache__status-meta">
                  Last cleared: {new Date(cacheVersion.updatedAt).toLocaleString()}
                </span>
              )}
            </div>

            <button
              className="button danger"
              onClick={() => setShowConfirm(true)}
              disabled={busting || !cacheVersion}
            >
              <i className="fas fa-trash-alt"></i>
              {busting ? 'Clearing...' : 'Clear Evolution Explorer Cache'}
            </button>

            {message && (
              <div className={`evolution-cache__message evolution-cache__message--${message.type}`}>
                {message.text}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleBust}
        title="Clear Evolution Explorer Cache"
        message="This invalidates the Evolution Explorer cache for every user."
        warning="Users will reload evolution data fresh on their next visit. This cannot be undone."
        confirmText="Clear Cache"
        variant="warning"
        confirmIcon="fas fa-trash-alt"
      />
    </div>
  );
}

export default function EvolutionCacheManagerPage() {
  return (
    <AdminRoute>
      <EvolutionCacheManagerContent />
    </AdminRoute>
  );
}
