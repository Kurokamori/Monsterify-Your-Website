import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import rerollerService from '../../../services/rerollerService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import './RerollerPage.css';

const RerollerSessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch sessions
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await rerollerService.listSessions({
        status: statusFilter || undefined,
        page,
        limit: 20
      });
      setSessions(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [statusFilter, page]);

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await rerollerService.deleteSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete session');
    }
  };

  // Copy link
  const copyLink = (token) => {
    navigator.clipboard.writeText(rerollerService.buildClaimUrl(token));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-badge active';
      case 'claimed': return 'status-badge defeated';
      case 'cancelled': return 'status-badge';
      default: return 'status-badge';
    }
  };

  // Get roll type label
  const getRollTypeLabel = (type) => {
    switch (type) {
      case 'monster': return 'Monster';
      case 'item': return 'Item';
      case 'combined': return 'Combined';
      case 'gift': return 'Gift';
      default: return type;
    }
  };

  return (
    <div className="reroller-container">
      <div className="reroller-header">
        <h1>Reroller Sessions</h1>
        <p>View and manage all reroll sessions</p>
        <Link to="/admin/reroller" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          <i className="fas fa-plus"></i> Create New Session
        </Link>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label style={{ color: 'var(--admin-text-secondary)' }}>Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--admin-input-bg)',
            border: '1px solid var(--admin-border-color)',
            borderRadius: '6px',
            color: 'var(--admin-text-primary)'
          }}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="claimed">Claimed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div className="message error">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : sessions.length === 0 ? (
        <div className="empty-results">
          <i className="fas fa-inbox"></i>
          <p>No sessions found</p>
        </div>
      ) : (
        <>
          {/* Sessions Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--admin-border-color)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--admin-text-secondary)' }}>ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--admin-text-secondary)' }}>Type</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--admin-text-secondary)' }}>Target User</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--admin-text-secondary)' }}>Rewards</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--admin-text-secondary)' }}>Claims</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--admin-text-secondary)' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--admin-text-secondary)' }}>Created</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--admin-text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id} style={{ borderBottom: '1px solid var(--admin-border-color)' }}>
                    <td style={{ padding: '1rem', color: 'var(--admin-text-primary)' }}>#{session.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        background: 'var(--admin-accent-color)',
                        color: '#000',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        {getRollTypeLabel(session.rollType)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--admin-text-primary)' }}>
                      {session.targetDisplayName || session.targetUsername || `User #${session.targetUserId}`}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--admin-text-secondary)' }}>
                      {session.rolledMonsters?.length > 0 && (
                        <span>{session.rolledMonsters.length} monster{session.rolledMonsters.length !== 1 ? 's' : ''}</span>
                      )}
                      {session.rolledMonsters?.length > 0 && session.rolledItems?.length > 0 && ', '}
                      {session.rolledItems?.length > 0 && (
                        <span>{session.rolledItems.length} item{session.rolledItems.length !== 1 ? 's' : ''}</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--admin-text-secondary)' }}>
                      {session.claimCount || 0}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={getStatusClass(session.status)}>
                        {session.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                      {formatDate(session.createdAt)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => copyLink(session.token)}
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: 'var(--admin-input-bg)',
                            border: '1px solid var(--admin-border-color)',
                            borderRadius: '4px',
                            color: 'var(--admin-text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="Copy claim link"
                        >
                          <i className="fas fa-link"></i>
                        </button>
                        <Link
                          to={`/admin/reroller/sessions/${session.id}`}
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: 'var(--admin-input-bg)',
                            border: '1px solid var(--admin-border-color)',
                            borderRadius: '4px',
                            color: 'var(--admin-text-secondary)',
                            textDecoration: 'none',
                            fontSize: '0.8rem'
                          }}
                          title="View details"
                        >
                          <i className="fas fa-eye"></i>
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(session.id)}
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: 'var(--admin-input-bg)',
                            border: '1px solid var(--admin-danger-color)',
                            borderRadius: '4px',
                            color: 'var(--admin-danger-color)',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="Delete session"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Previous
              </button>
              <span style={{ padding: '0.5rem 1rem', color: 'var(--admin-text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="edit-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Session</h3>
            <p style={{ color: 'var(--admin-text-secondary)', margin: '1rem 0' }}>
              Are you sure you want to delete this session? This will also delete all associated claims and cannot be undone.
            </p>
            <div className="edit-modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RerollerSessionsPage;
