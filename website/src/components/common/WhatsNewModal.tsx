import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from './Modal';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useAuth } from '@contexts/AuthContext';
import changelogService, { ChangelogVersion } from '@services/changelogService';
import '@styles/toys/changelog.css';

const LAST_SEEN_KEY = 'whats-new-last-seen-version';

export function WhatsNewModal() {
  const { currentUser } = useAuth();
  const [version, setVersion] = useState<ChangelogVersion | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const checkForUpdates = async () => {
      try {
        const latest = await changelogService.getLatest();
        if (!latest) return;

        const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
        if (lastSeen !== latest.version) {
          setVersion(latest);
          setIsOpen(true);
        }
      } catch {
        // Silently fail — don't block the app
      }
    };

    checkForUpdates();
  }, [currentUser]);

  const handleClose = () => {
    if (version) {
      localStorage.setItem(LAST_SEEN_KEY, version.version);
    }
    setIsOpen(false);
  };

  if (!version) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`What's New — v${version.version}`}
      size="large"
      footer={
        <div className="whats-new-modal__footer">
          <Link to="/toys/changelog" className="whats-new-modal__changelog-link" onClick={handleClose}>
            <i className="fas fa-clipboard-list"></i> View Full Changelog
          </Link>
          <button className="button primary" onClick={handleClose}>
            Got it!
          </button>
        </div>
      }
    >
      <div>
        <span className="whats-new-modal__version-tag">v{version.version}</span>
        <h2 style={{ margin: '0 0 0.25rem' }}>{version.title}</h2>
        {version.publishedAt && (
          <div className="whats-new-modal__date">
            {new Date(version.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        )}
        {version.content ? (
          <MarkdownRenderer content={version.content} className="whats-new-modal__content" />
        ) : (
          <p><em>No details for this version.</em></p>
        )}
      </div>
    </Modal>
  );
}
