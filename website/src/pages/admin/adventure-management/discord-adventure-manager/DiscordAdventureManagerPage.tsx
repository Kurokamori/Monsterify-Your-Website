import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { TabContainer } from '@components/common/TabContainer';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { useConfirmModal } from '@components/common/useConfirmModal';
import { AdminRoute } from '@components/common/AdminRoute';
import adventureService from '@services/adventureService';
import type { AdminAdventure, AdminAdventureParticipant } from '@services/adventureService';
import '@styles/admin/discord-adventure-manager.css';

type StatusMsg = { type: 'success' | 'error'; text: string } | null;

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  return fallback;
}

// =============================================================================
// Adventures Tab
// =============================================================================

function AdventuresTab() {
  const [adventures, setAdventures] = useState<AdminAdventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusMsg, setStatusMsg] = useState<StatusMsg>(null);
  const [saving, setSaving] = useState(false);

  // Rename state
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const confirmModal = useConfirmModal();

  const fetchAdventures = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const result = await adventureService.adminGetAllAdventures(params);
      setAdventures(result.adventures ?? []);
      setTotalPages(result.pagination?.totalPages ?? 1);
      setTotal(result.pagination?.total ?? 0);
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to load adventures') });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchAdventures();
  }, [fetchAdventures]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const handleRename = useCallback(async () => {
    if (renameId === null || !renameValue.trim()) return;
    setSaving(true);
    try {
      await adventureService.adminUpdateAdventure(renameId, { title: renameValue.trim() });
      setStatusMsg({ type: 'success', text: 'Adventure renamed' });
      setRenameId(null);
      setRenameValue('');
      fetchAdventures();
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to rename') });
    } finally {
      setSaving(false);
    }
  }, [renameId, renameValue, fetchAdventures]);

  const handleComplete = useCallback((adv: AdminAdventure) => {
    confirmModal.confirm(
      `Complete adventure "${adv.title}"?`,
      async () => {
        try {
          await adventureService.adminCompleteAdventure(adv.id);
          setStatusMsg({ type: 'success', text: 'Adventure completed' });
          fetchAdventures();
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to complete') });
        }
      },
      { confirmText: 'Complete', variant: 'default' },
    );
  }, [confirmModal, fetchAdventures]);

  const handleCancel = useCallback((adv: AdminAdventure) => {
    confirmModal.confirmDanger(
      `Cancel adventure "${adv.title}"? This will set its status to cancelled.`,
      async () => {
        try {
          await adventureService.adminUpdateAdventure(adv.id, { status: 'cancelled' } as never);
          setStatusMsg({ type: 'success', text: 'Adventure cancelled' });
          fetchAdventures();
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to cancel') });
        }
      },
    );
  }, [confirmModal, fetchAdventures]);

  const handleDelete = useCallback((adv: AdminAdventure) => {
    confirmModal.confirmDanger(
      `Delete adventure "${adv.title}"? This action cannot be undone.`,
      async () => {
        try {
          await adventureService.adminDeleteAdventure(adv.id);
          setStatusMsg({ type: 'success', text: 'Adventure deleted' });
          fetchAdventures();
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete') });
        }
      },
    );
  }, [confirmModal, fetchAdventures]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="dam__panel">
      {/* Status Messages */}
      {statusMsg && (
        <div className={`dam__status dam__status--${statusMsg.type}`}>
          <i className={`fas fa-${statusMsg.type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="dam__toolbar">
        <div className="dam__filters">
          <select
            className="dam__select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
          <input
            type="text"
            className="dam__search"
            placeholder="Search title or creator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Rename Panel */}
      {renameId !== null && (
        <div className="dam__rename-panel">
          <h3>Rename Adventure #{renameId}</h3>
          <div className="dam__rename-row">
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              placeholder="New title..."
              autoFocus
            />
            <button className="button primary small" onClick={handleRename} disabled={saving || !renameValue.trim()}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving...</> : 'Save'}
            </button>
            <button className="button secondary small" onClick={() => { setRenameId(null); setRenameValue(''); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="dam__loading">
          <i className="fas fa-spinner fa-spin" />
          <span>Loading adventures...</span>
        </div>
      ) : adventures.length === 0 ? (
        <div className="dam__empty">
          <i className="fas fa-compass" />
          <p>No adventures found</p>
        </div>
      ) : (
        <>
          <div className="dam__table-container">
            <table className="dam__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Creator</th>
                  <th>Status</th>
                  <th>Participants</th>
                  <th>Words</th>
                  <th>Encounters</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adventures.map((adv) => (
                  <tr key={adv.id}>
                    <td>{adv.id}</td>
                    <td>{adv.title}</td>
                    <td>{adv.creatorUsername ?? '—'}</td>
                    <td>
                      <span className={`dam__status-badge dam__status-badge--${adv.status}`}>
                        {adv.status}
                      </span>
                    </td>
                    <td>{adv.totalParticipants}</td>
                    <td>{adv.totalWords.toLocaleString()}</td>
                    <td>
                      {adv.encounterCount}
                      {adv.maxEncounters ? `/${adv.maxEncounters}` : ''}
                    </td>
                    <td>{formatDate(adv.createdAt)}</td>
                    <td>
                      <div className="dam__actions-cell">
                        <button
                          className="button secondary small"
                          title="Rename"
                          onClick={() => { setRenameId(adv.id); setRenameValue(adv.title); }}
                        >
                          <i className="fas fa-pen" />
                        </button>
                        {adv.status === 'active' && (
                          <>
                            <button
                              className="button primary small"
                              title="Complete"
                              onClick={() => handleComplete(adv)}
                            >
                              <i className="fas fa-check" />
                            </button>
                            <button
                              className="button warning small"
                              title="Cancel"
                              onClick={() => handleCancel(adv)}
                            >
                              <i className="fas fa-ban" />
                            </button>
                          </>
                        )}
                        <button
                          className="button danger small"
                          title="Delete"
                          onClick={() => handleDelete(adv)}
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="dam__footer">
            <span className="dam__count">{total} adventure{total !== 1 ? 's' : ''}</span>
            <div className="dam__pagination">
              <button
                className="button secondary small"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                className="button secondary small"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  );
}

// =============================================================================
// Thread Manager Tab
// =============================================================================

function ThreadManagerTab() {
  const [adventures, setAdventures] = useState<AdminAdventure[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<AdminAdventureParticipant[]>([]);
  const [loadingAdventures, setLoadingAdventures] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<StatusMsg>(null);

  // Fetch adventures with threads
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingAdventures(true);
      try {
        // Fetch a large page to get all adventures, then filter for those with threads
        const result = await adventureService.adminGetAllAdventures({ limit: 500 });
        if (cancelled) return;
        const withThreads = (result.adventures ?? []).filter(
          (a: AdminAdventure) => a.discordThreadId,
        );
        setAdventures(withThreads);
      } catch (err) {
        if (!cancelled) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to load adventures') });
        }
      } finally {
        if (!cancelled) setLoadingAdventures(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch participants when selection changes
  useEffect(() => {
    if (selectedId === null) {
      setParticipants([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingParticipants(true);
      try {
        const result = await adventureService.adminGetParticipants(selectedId);
        if (!cancelled) setParticipants(result.participants ?? []);
      } catch (err) {
        if (!cancelled) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to load participants') });
        }
      } finally {
        if (!cancelled) setLoadingParticipants(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  const handleSend = useCallback(async () => {
    if (selectedId === null || !message.trim()) return;
    setSending(true);
    try {
      await adventureService.adminSendMessage(selectedId, message.trim());
      setStatusMsg({ type: 'success', text: 'Message sent to thread' });
      setMessage('');
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to send message') });
    } finally {
      setSending(false);
    }
  }, [selectedId, message]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="dam__panel">
      {/* Status Messages */}
      {statusMsg && (
        <div className={`dam__status dam__status--${statusMsg.type}`}>
          <i className={`fas fa-${statusMsg.type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Adventure Selector */}
      <div className="dam__toolbar">
        <div className="dam__filters">
          {loadingAdventures ? (
            <span className="dam__loading" style={{ padding: 0 }}>
              <i className="fas fa-spinner fa-spin" /> Loading threads...
            </span>
          ) : (
            <select
              className="dam__select"
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Select an adventure...</option>
              {adventures.map((adv) => (
                <option key={adv.id} value={adv.id}>
                  #{adv.id} — {adv.title} ({adv.status})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {selectedId === null ? (
        <div className="dam__empty">
          <i className="fab fa-discord" />
          <p>Select an adventure to view its thread participants</p>
        </div>
      ) : (
        <>
          {/* Participants Table */}
          <h3 className="dam__section-title">Participants</h3>
          {loadingParticipants ? (
            <div className="dam__loading">
              <i className="fas fa-spinner fa-spin" />
              <span>Loading participants...</span>
            </div>
          ) : participants.length === 0 ? (
            <div className="dam__empty">
              <i className="fas fa-users" />
              <p>No participants yet</p>
            </div>
          ) : (
            <div className="dam__table-container">
              <table className="dam__table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Discord ID</th>
                    <th>Words</th>
                    <th>Messages</th>
                    <th>Last Active</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id}>
                      <td>{p.username ?? '—'}</td>
                      <td><span className="dam__discord-id">{p.discordUserId}</span></td>
                      <td>{p.wordCount.toLocaleString()}</td>
                      <td>{p.messageCount}</td>
                      <td>{formatDate(p.lastMessageAt)}</td>
                      <td>{formatDate(p.joinedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Message Composer */}
          <div className="dam__message-panel">
            <h3>Send Message to Thread</h3>
            <textarea
              className="dam__textarea"
              placeholder="Type a message to send to the Discord thread..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
            />
            <div className="dam__message-actions">
              <span className={`dam__char-count${message.length > 2000 ? ' dam__char-count--over' : ''}`}>
                {message.length}/2000
              </span>
              <button
                className="button primary"
                onClick={handleSend}
                disabled={sending || !message.trim() || message.length > 2000}
              >
                {sending ? (
                  <><i className="fas fa-spinner fa-spin" /> Sending...</>
                ) : (
                  <><i className="fas fa-paper-plane" /> Send</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function DiscordAdventureManagerPage() {
  useDocumentTitle('Discord Adventure Manager');
  const [activeTab, setActiveTab] = useState('adventures');

  const tabs = [
    {
      key: 'adventures',
      label: 'Adventures',
      icon: 'fas fa-compass',
      content: <AdventuresTab />,
    },
    {
      key: 'threads',
      label: 'Thread Manager',
      icon: 'fab fa-discord',
      content: <ThreadManagerTab />,
    },
  ];

  return (
    <AdminRoute>
      <div className="main-container">
        <h1>Discord Adventure Manager</h1>
        <TabContainer
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="underline"
        />
      </div>
    </AdminRoute>
  );
}
