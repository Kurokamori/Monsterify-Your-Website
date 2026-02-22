import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { AdminTable, type FilterConfig, type ColumnDef } from '@components/admin/AdminTable';
import { ConfirmModal } from '@components/common/ConfirmModal';
import submissionService, { type AdminSubmission } from '@services/submissionService';
import '@styles/admin/submission-manager.css';

const STATUS_BADGES: Record<string, string> = {
  approved: 'badge success',
  pending: 'badge pending',
  rejected: 'badge error',
  revision_requested: 'badge warning',
};

const STATUS_LABELS: Record<string, string> = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  revision_requested: 'Revision',
};

function getViewLink(item: AdminSubmission): string {
  if (item.submission_type === 'art') return `/gallery/${item.id}`;
  if (item.submission_type === 'writing') return `/library/${item.id}`;
  return `/submissions/${item.id}`;
}

function SubmissionManagerContent() {
  useDocumentTitle('Submission Manager');

  const [data, setData] = useState<AdminSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteTarget, setDeleteTarget] = useState<AdminSubmission | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await submissionService.getAdminSubmissions({
        page: currentPage,
        limit: 20,
        search: searchValue || undefined,
        sortBy,
        sortOrder,
        status: filterValues.status || undefined,
        submissionType: filterValues.submissionType || undefined,
      });
      setData(result.submissions);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchValue, sortBy, sortOrder, filterValues]);

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

  const handleFiltersChange = useCallback((filters: Record<string, string>) => {
    setFilterValues(filters);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchValue('');
    setFilterValues({});
    setCurrentPage(1);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setActionError(null);
    try {
      await submissionService.deleteSubmission(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to delete submission')
        : err instanceof Error ? err.message : 'Failed to delete submission';
      setActionError(message);
      throw err;
    }
  }, [deleteTarget, fetchData]);

  const filters: FilterConfig[] = [
    {
      key: 'submissionType',
      label: 'Type',
      options: [
        { value: 'art', label: 'Art' },
        { value: 'writing', label: 'Writing' },
        { value: 'craft', label: 'Craft' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'revision_requested', label: 'Revision Requested' },
      ],
    },
  ];

  const columns: ColumnDef<AdminSubmission>[] = [
    {
      key: '__thumbnail',
      header: 'Thumb',
      className: 'submission-manager__thumb-cell',
      render: (item) => {
        if (item.image_url) {
          return (
            <img
              src={item.image_url}
              alt={item.title}
              className="submission-manager__thumbnail"
            />
          );
        }
        const icon = item.submission_type === 'writing' ? 'fa-book' : 'fa-image';
        return (
          <div className="submission-manager__no-image">
            <i className={`fas ${icon}`}></i>
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      className: 'submission-manager__title-cell',
      render: (item) => (
        <div className="submission-manager__title-wrapper">
          <Link to={getViewLink(item)} className="submission-manager__title-link">
            {item.title}
          </Link>
          <span className="submission-manager__badges">
            {!!item.is_mature && <span className="badge warning sm">Mature</span>}
            {!!item.is_book && <span className="badge neutral sm">Book</span>}
          </span>
        </div>
      ),
    },
    {
      key: 'submission_type',
      header: 'Type',
      sortable: true,
      render: (item) => (
        <span className="submission-manager__type">
          {item.submission_type}
        </span>
      ),
    },
    {
      key: 'username',
      header: 'User',
      sortable: true,
      render: (item) => item.user_username ?? 'Unknown',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => (
        <span className={STATUS_BADGES[item.status] ?? 'badge'}>
          {STATUS_LABELS[item.status] ?? item.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      render: (item) => new Date(item.created_at).toLocaleDateString(),
    },
  ];

  return (
    <>
      <AdminTable<AdminSubmission>
        title="Submission Manager"
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        error={error}
        onRetry={fetchData}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by title or username..."
        filters={filters}
        filterValues={filterValues}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage="No submissions found"
        actions={(item) => (
          <>
            <Link to={getViewLink(item)} className="button primary sm">
              <i className="fas fa-eye"></i> View
            </Link>
            <button
              className="button danger sm"
              onClick={() => { setActionError(null); setDeleteTarget(item); }}
            >
              <i className="fas fa-trash"></i> Delete
            </button>
          </>
        )}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setActionError(null); }}
        onConfirm={handleDelete}
        title="Delete Submission"
        message={`Are you sure you want to delete "${deleteTarget?.title ?? ''}"?`}
        details={actionError ? <div style={{ color: 'var(--error-color)' }}>{actionError}</div> : undefined}
        warning="This will permanently delete the submission and cannot be undone."
        confirmText="Delete"
        variant="danger"
        confirmIcon="fas fa-trash"
      />
    </>
  );
}

export default function SubmissionManagerPage() {
  return (
    <AdminRoute>
      <SubmissionManagerContent />
    </AdminRoute>
  );
}
