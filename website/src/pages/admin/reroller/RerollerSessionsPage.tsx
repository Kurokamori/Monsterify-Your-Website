import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import {
  AdminRoute,
  FormSelect,
  Pagination,
  ConfirmModal,
  useConfirmModal,
  LoadingSpinner,
  ErrorMessage,
} from '@components/common';
import rerollerService from '@services/rerollerService';

// ── Types ─────────────────────────────────────────────────────────────

interface Session {
  id: number;
  token: string;
  rollType: string;
  status: string;
  targetUserId: number;
  targetDisplayName?: string;
  targetUsername?: string;
  rolledMonsters?: unknown[];
  rolledItems?: unknown[];
  claimCount?: number;
  createdAt: string;
  [key: string]: unknown;
}

// ── Constants ─────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const ROLL_TYPE_LABELS: Record<string, string> = {
  monster: 'Monster',
  item: 'Item',
  both: 'Combined',
  combined: 'Combined',
  gift: 'Gift',
  birthday: 'Birthday',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  active: 'badge active',
  completed: 'badge defeated',
  cancelled: 'badge neutral',
};

// ── Helpers ───────────────────────────────────────────────────────────

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Component ─────────────────────────────────────────────────────────

function RerollerSessionsContent() {
  useDocumentTitle('Reroller Sessions');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const deleteConfirm = useConfirmModal();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rerollerService.listSessions({
        status: statusFilter || undefined,
        page,
        limit: 20,
      });
      setSessions(response.data ?? []);
      setTotalPages(response.pagination?.totalPages ?? 1);
    } catch (err: unknown) {
      const axiosMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(axiosMessage ?? 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async (id: number) => {
    try {
      await rerollerService.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err: unknown) {
      const axiosMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(axiosMessage ?? 'Failed to delete session');
    }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(rerollerService.buildClaimUrl(token));
  };

  return (
    <div className="container vertical gap-lg">
      {/* Header */}
      <div className="container justify-between align-center">
        <div>
          <h1><i className="fas fa-list"></i> Reroller Sessions</h1>
          <p className="text-muted">View and manage all reroll sessions</p>
        </div>
        <Link to="/admin/reroller" className="button primary">
          <i className="fas fa-plus"></i> Create New Session
        </Link>
      </div>

      {/* Filters */}
      <div className="container align-center gap-sm">
        <FormSelect
          name="statusFilter"
          label="Filter by Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingSpinner />
      ) : sessions.length === 0 ? (
        <div className="container vertical center gap-md p-lg">
          <i className="fas fa-inbox fa-3x text-muted"></i>
          <p className="text-muted">No sessions found</p>
        </div>
      ) : (
        <>
          {/* Sessions Table */}
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
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
                  <tr key={session.id}>
                    <td>#{session.id}</td>
                    <td>
                      <span className="badge">
                        {ROLL_TYPE_LABELS[session.rollType] ?? session.rollType}
                      </span>
                    </td>
                    <td>
                      {session.targetDisplayName || session.targetUsername || `User #${session.targetUserId}`}
                    </td>
                    <td className="text-accent">
                      {(session.rolledMonsters?.length ?? 0) > 0 && (
                        <span>
                          {session.rolledMonsters!.length} monster{session.rolledMonsters!.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {(session.rolledMonsters?.length ?? 0) > 0 && (session.rolledItems?.length ?? 0) > 0 && ', '}
                      {(session.rolledItems?.length ?? 0) > 0 && (
                        <span>
                          {session.rolledItems!.length} item{session.rolledItems!.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td className="text-accent">{session.claimCount ?? 0}</td>
                    <td>
                      <span className={STATUS_BADGE_CLASS[session.status] ?? 'badge neutral'}>
                        {session.status}
                      </span>
                    </td>
                    <td className="text-muted">{formatDate(session.createdAt)}</td>
                    <td>
                      <div className="container gap-xs">
                        <button
                          onClick={() => copyLink(session.token)}
                          className="button secondary icon sm"
                          title="Copy claim link"
                        >
                          <i className="fas fa-link"></i>
                        </button>
                        <button
                          onClick={() =>
                            deleteConfirm.confirmDanger(
                              'Are you sure you want to delete this session? This will also delete all associated claims and cannot be undone.',
                              () => handleDelete(session.id),
                              { title: 'Delete Session', confirmText: 'Delete' }
                            )
                          }
                          className="button danger icon sm no-flex"
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
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal {...deleteConfirm.modalProps} />
    </div>
  );
}

export function RerollerSessionsPage() {
  return (
    <AdminRoute>
      <RerollerSessionsContent />
    </AdminRoute>
  );
}
