import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import rerollerService from '../../../services/rerollerService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

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
        <Link to="/admin/reroller" className="button primary reroller-create-btn">
          <i className="fas fa-plus"></i> Create New Session
        </Link>
      </div>

      {/* Filters */}
      <div className="sessions-filter">
        <label className="sessions-filter-label">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="sessions-filter-select"
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
          <div className="sessions-table-wrapper">
            <table className="sessions-table">
              <thead>
                <tr className="sessions-table-header-row">
                  <th>ID</th>
                  <th>Type</th>
                  <th>Target User</th>
                  <th>Rewards</th>
                  <th>Claims</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id} className="sessions-table-row">
                    <td>#{session.id}</td>
                    <td>
                      <span className="roll-type-badge">
                        {getRollTypeLabel(session.rollType)}
                      </span>
                    </td>
                    <td>
                      {session.targetDisplayName || session.targetUsername || `User #${session.targetUserId}`}
                    </td>
                    <td className="accent">
                      {session.rolledMonsters?.length > 0 && (
                        <span>{session.rolledMonsters.length} monster{session.rolledMonsters.length !== 1 ? 's' : ''}</span>
                      )}
                      {session.rolledMonsters?.length > 0 && session.rolledItems?.length > 0 && ', '}
                      {session.rolledItems?.length > 0 && (
                        <span>{session.rolledItems.length} item{session.rolledItems.length !== 1 ? 's' : ''}</span>
                      )}
                    </td>
                    <td className="accent">
                      {session.claimCount || 0}
                    </td>
                    <td>
                      <span className={getStatusClass(session.status)}>
                        {session.status}
                      </span>
                    </td>
                    <td className="muted">
                      {formatDate(session.createdAt)}
                    </td>
                    <td>
                      <div className="session-actions">
                        <button
                          onClick={() => copyLink(session.token)}
                          className="session-action-btn"
                          title="Copy claim link"
                        >
                          <i className="fas fa-link"></i>
                        </button>
                        <Link
                          to={`/admin/reroller/sessions/${session.id}`}
                          className="session-action-btn"
                          title="View details"
                        >
                          <i className="fas fa-eye"></i>
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(session.id)}
                          className="session-action-btn delete"
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
            <div className="sessions-pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="button secondary sessions-button secondary"
              >
                Previous
              </button>
              <span className="sessions-pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="button secondary sessions-button secondary"
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
            <p className="delete-modal-message">
              Are you sure you want to delete this session? This will also delete all associated claims and cannot be undone.
            </p>
            <div className="edit-modal-actions">
              <button className="button secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="button danger" onClick={() => handleDelete(deleteConfirm)}>
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
