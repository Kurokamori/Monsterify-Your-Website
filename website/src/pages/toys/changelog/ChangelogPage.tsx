import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useAuth } from '@contexts/AuthContext';
import { MarkdownRenderer } from '@components/common/MarkdownRenderer';
import changelogService, { ChangelogVersion } from '@services/changelogService';
import '@styles/toys/changelog.css';

export default function ChangelogPage() {
  useDocumentTitle('Changelog');
  const { currentUser } = useAuth();

  const [versions, setVersions] = useState<ChangelogVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await changelogService.getPublished();
        setVersions(data);
        if (data.length > 0) {
          setExpandedId(data[0].id);
        }
      } catch {
        setError('Failed to load changelog');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) load();
  }, [currentUser]);

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (!currentUser) {
    return (
      <div className="changelog-page">
        <div className="changelog-page__header">
          <h1><i className="fas fa-clipboard-list"></i> Changelog</h1>
        </div>
        <p className="changelog-page__login">Please log in to view the changelog.</p>
      </div>
    );
  }

  return (
    <div className="changelog-page">
      <div className="changelog-page__header">
        <h1><i className="fas fa-clipboard-list"></i> Changelog</h1>
        <p>All the updates and changes made to the site</p>
      </div>

      {error && <div className="changelog-page__error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

      {loading ? (
        <div className="changelog-page__loading">
          <i className="fas fa-spinner fa-spin"></i> Loading...
        </div>
      ) : versions.length === 0 ? (
        <div className="changelog-page__empty">
          <i className="fas fa-clipboard-list"></i>
          <p>No changelog entries yet.</p>
        </div>
      ) : (
        <div className="changelog-page__list">
          {versions.map((v, idx) => (
            <div key={v.id} className={`changelog-entry ${expandedId === v.id ? 'changelog-entry--expanded' : ''}`}>
              <button
                className="changelog-entry__header"
                onClick={() => toggleExpand(v.id)}
              >
                <div className="changelog-entry__info">
                  {idx === 0 && <span className="changelog-entry__latest">Latest</span>}
                  <h2>v{v.version} — {v.title}</h2>
                </div>
                <div className="changelog-entry__meta">
                  {v.publishedAt && (
                    <span className="changelog-entry__date">
                      {new Date(v.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  )}
                  <i className={`fas fa-chevron-${expandedId === v.id ? 'up' : 'down'}`}></i>
                </div>
              </button>
              {expandedId === v.id && (
                <div className="changelog-entry__body">
                  {v.content ? (
                    <MarkdownRenderer content={v.content} className="changelog-entry__content" />
                  ) : (
                    <p className="changelog-entry__no-content"><em>No details for this version.</em></p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
