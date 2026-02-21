import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { AdminTable, type ColumnDef } from '@components/admin/AdminTable';
import { ConfirmModal } from '@components/common/ConfirmModal';
import userService, { type AdminUser } from '@services/userService';
import { useAuth } from '@contexts/useAuth';
import '@styles/admin/user-manager.css';

function formatSettingName(key: string): string {
  return key
    .replace(/_enabled$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function UserDetailPanel({ user }: { user: AdminUser }) {
  const rollerSettings = user.monster_roller_settings;
  const contentSettings = user.content_settings;

  return (
    <div className="user-manager__detail-panel">
      <div className="user-manager__detail-header">
        <h3>User Details — {user.display_name || user.username}</h3>
      </div>

      <div className="user-manager__detail-info">
        <div className="user-manager__detail-field">
          <label>Username</label>
          <span>{user.username}</span>
        </div>
        <div className="user-manager__detail-field">
          <label>Display Name</label>
          <span>{user.display_name || '—'}</span>
        </div>
        <div className="user-manager__detail-field">
          <label>Theme</label>
          <span>{user.theme || 'Default'}</span>
        </div>
        <div className="user-manager__detail-field">
          <label>Discord ID</label>
          <span>{user.discord_id || '—'}</span>
        </div>
        <div className="user-manager__detail-field">
          <label>Created</label>
          <span>{new Date(user.created_at).toLocaleString()}</span>
        </div>
      </div>

      <div className="user-manager__settings-section">
        <h4>Monster Roller Settings</h4>
        {rollerSettings ? (
          <div className="user-manager__settings-grid">
            {Object.entries(rollerSettings).map(([key, val]) => (
              <div key={key} className="user-manager__setting-item">
                <span className="user-manager__setting-name">{formatSettingName(key)}</span>
                <span className={`badge sm ${val ? 'success' : 'neutral'}`}>
                  {val ? 'On' : 'Off'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-color-muted)', fontSize: '0.85rem' }}>No settings configured</p>
        )}
      </div>

      <div className="user-manager__settings-section">
        <h4>Content Filter Settings</h4>
        <div className="user-manager__settings-grid">
          {Object.entries(contentSettings).map(([key, val]) => (
            <div key={key} className="user-manager__setting-item">
              <span className="user-manager__setting-name">{formatSettingName(key)}</span>
              <span className={`badge sm ${val ? 'success' : 'neutral'}`}>
                {val ? 'On' : 'Off'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserManagerContent() {
  useDocumentTitle('User Manager');
  const { currentUser } = useAuth();

  const [data, setData] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.getAdminUsers({
        page: currentPage,
        limit: 20,
        search: searchValue || undefined,
        sortBy,
        sortOrder,
      });
      setData(result.users);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchValue, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSortChange = useCallback((field: string) => {
    setSortBy(prev => {
      if (prev === field) {
        setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortOrder('asc');
      return field;
    });
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchValue('');
    setCurrentPage(1);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await userService.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      if (expandedUserId === deleteTarget.id) {
        setExpandedUserId(null);
      }
      fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  }, [deleteTarget, expandedUserId, fetchData]);

  const toggleExpand = useCallback((userId: number) => {
    setExpandedUserId(prev => prev === userId ? null : userId);
  }, []);

  const expandedUser = expandedUserId !== null ? data.find(u => u.id === expandedUserId) : null;

  const isSelfDelete = deleteTarget && currentUser && deleteTarget.id === currentUser.id;

  const columns: ColumnDef<AdminUser>[] = [
    {
      key: 'username',
      header: 'Username',
      sortable: true,
    },
    {
      key: 'display_name',
      header: 'Display Name',
      sortable: true,
    },
    {
      key: 'discord_id',
      header: 'Discord',
      render: (item) => item.discord_id ? (
        <span className="user-manager__discord-link badge neutral sm">
          <i className="fab fa-discord"></i> {item.discord_id}
        </span>
      ) : '—',
    },
    {
      key: 'is_admin',
      header: 'Admin',
      render: (item) => (
        <span className={`badge sm ${item.is_admin ? 'success' : 'neutral'}`}>
          {item.is_admin ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (item) => new Date(item.created_at).toLocaleDateString(),
    },
  ];

  return (
    <>
      <AdminTable<AdminUser>
        title="User Manager"
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        error={error}
        onRetry={fetchData}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by username or display name..."
        onResetFilters={handleResetFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage="No users found"
        actions={(item) => (
          <>
            <button
              className={`button sm ${expandedUserId === item.id ? 'secondary' : 'primary'}`}
              onClick={() => toggleExpand(item.id)}
            >
              <i className={`fas fa-chevron-${expandedUserId === item.id ? 'up' : 'down'}`}></i>
              {expandedUserId === item.id ? ' Collapse' : ' Expand'}
            </button>
            <button
              className="button danger sm"
              onClick={() => setDeleteTarget(item)}
            >
              <i className="fas fa-trash"></i> Delete
            </button>
          </>
        )}
      />

      {expandedUser && (
        <UserDetailPanel user={expandedUser} />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteTarget?.username ?? ''}"?`}
        warning={isSelfDelete
          ? 'You are trying to delete your own account. The server will block this action.'
          : 'This action is permanent and cannot be undone.'}
        confirmText="Delete"
        variant="danger"
        confirmIcon="fas fa-trash"
      />
    </>
  );
}

export default function UserManagerPage() {
  return (
    <AdminRoute>
      <UserManagerContent />
    </AdminRoute>
  );
}
