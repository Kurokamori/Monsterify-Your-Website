import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { AdminTable, type FilterConfig } from '@components/admin/AdminTable';
import { ConfirmModal } from '@components/common/ConfirmModal';
import speciesService, {
  type Species,
  FRANCHISE_CONFIG,
} from '@services/speciesService';
import {
  SLUG_TO_FRANCHISE,
  getSpeciesAdminConfig,
  getIdField,
  getImageField,
} from './speciesFieldConfig';

function SpeciesAdminContent() {
  const { franchise: slug } = useParams<{ franchise: string }>();

  const franchiseKey = slug ? SLUG_TO_FRANCHISE[slug] : undefined;
  const config = franchiseKey ? getSpeciesAdminConfig(franchiseKey) : undefined;
  const franchiseConfig = franchiseKey ? FRANCHISE_CONFIG[franchiseKey] : undefined;
  const idField = franchiseKey ? getIdField(franchiseKey) : 'id';
  const imageField = franchiseKey ? getImageField(franchiseKey) : 'imageUrl';

  useDocumentTitle(config ? `${config.label} Management` : 'Species Management');

  // Data state
  const [data, setData] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search & filters
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Sorting
  const [sortBy, setSortBy] = useState(franchiseConfig?.sortDefault ?? 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Species | null>(null);

  const fetchData = useCallback(async () => {
    if (!franchiseKey) return;
    setLoading(true);
    setError(null);
    try {
      const result = await speciesService.getSpecies(franchiseKey, {
        page: currentPage,
        limit: 20,
        search: searchValue || undefined,
        sortBy,
        sortOrder,
        ...filterValues,
      });
      setData(result.species);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error fetching species:', err);
      setError('Failed to load species data.');
    } finally {
      setLoading(false);
    }
  }, [franchiseKey, currentPage, searchValue, sortBy, sortOrder, filterValues]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset state when franchise changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchValue('');
    setFilterValues({});
    setSortBy(franchiseConfig?.sortDefault ?? 'name');
    setSortOrder('asc');
  }, [franchiseKey, franchiseConfig?.sortDefault]);

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
    if (!deleteTarget || !franchiseKey) return;
    const id = deleteTarget[idField] as string | number;
    try {
      await speciesService.deleteSpecies(franchiseKey, id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting species:', err);
    }
  }, [deleteTarget, franchiseKey, idField, fetchData]);

  if (!franchiseKey || !config || !franchiseConfig) {
    return (
      <div className="error-container">
        <p className="alert error">Unknown species type: {slug}</p>
        <Link to="/admin" className="button secondary">Back to Dashboard</Link>
      </div>
    );
  }

  // Build filter configs from franchise config + admin config filter options
  const tableFilters: FilterConfig[] = Object.entries(franchiseConfig.filters).map(([filterKey, fc]) => {
    // Priority: static options from FRANCHISE_CONFIG > filterOptions from admin config > boolean fallback
    const staticOptions = fc.options;
    const configOptions = config.filterOptions?.[filterKey];

    let options: { value: string; label: string }[];
    if (staticOptions) {
      options = staticOptions.map(o => ({ value: o, label: o }));
    } else if (fc.type === 'boolean') {
      options = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];
    } else if (configOptions) {
      options = configOptions.map(o => ({ value: o, label: o }));
    } else {
      options = [];
    }

    return { key: fc.field, label: fc.label, options };
  });

  // Build columns: image + config columns
  const columns = [
    {
      key: '__image',
      header: 'Image',
      className: 'admin-table-page__image-cell',
      render: (item: Species) => {
        const url = item[imageField] as string | null;
        return url ? (
          <img
            src={url}
            alt={String(item[franchiseConfig.nameField] ?? '')}
            className="admin-table-page__thumbnail"
          />
        ) : null;
      },
    },
    ...config.columns,
  ];

  // Build add button - include Mass Add for fakemon
  const basePath = `/admin/species/${slug}`;

  return (
    <>
      <AdminTable<Species>
        title={`${config.label} Species`}
        data={data}
        columns={columns}
        keyExtractor={(item) => item[idField] as string | number}
        loading={loading}
        error={error}
        onRetry={fetchData}
        addButton={{ label: `Add ${config.label}`, to: `${basePath}/add` }}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={`Search ${config.label}...`}
        filters={tableFilters.length > 0 ? tableFilters : undefined}
        filterValues={filterValues}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage={`No ${config.label} species found`}
        actions={(item) => {
          const id = item[idField] as string | number;
          return (
            <>
              <Link to={`${basePath}/edit/${id}`} className="button primary sm">
                <i className="fas fa-edit"></i> Edit
              </Link>
              <button
                className="button danger sm"
                onClick={() => setDeleteTarget(item)}
              >
                <i className="fas fa-trash"></i> Delete
              </button>
            </>
          );
        }}
      />

      {config.hasMassAdd && (
        <div style={{ marginTop: 'var(--spacing-small)' }}>
          <Link to={`${basePath}/mass-add`} className="button secondary">
            <i className="fas fa-images"></i> Mass Add {config.label}
          </Link>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${config.label}`}
        message={`Are you sure you want to delete "${deleteTarget?.[franchiseConfig.nameField] as string ?? ''}"?`}
        warning="This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        confirmIcon="fas fa-trash"
      />
    </>
  );
}

export default function SpeciesAdminPage() {
  return (
    <AdminRoute>
      <SpeciesAdminContent />
    </AdminRoute>
  );
}
