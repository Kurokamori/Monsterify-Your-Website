import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { AdminTable, type FilterConfig } from '@components/admin/AdminTable';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { InfoModal } from '@components/common/InfoModal';
import speciesService, {
  type Species,
  type WikiImportSummary,
  type ImageRefreshSummary,
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

  // Wiki import
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<WikiImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Image refresh
  const [refreshConfirmOpen, setRefreshConfirmOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSummary, setRefreshSummary] = useState<ImageRefreshSummary | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Dynamic filter options (fetched from backend endpoints)
  const [dynamicFilterOptions, setDynamicFilterOptions] = useState<Record<string, string[]>>({});

  // Fetch dynamic filter options from backend
  useEffect(() => {
    if (!franchiseKey || !franchiseConfig?.filterEndpoints) return;

    const endpoints = franchiseConfig.filterEndpoints;
    for (const [filterKey, endpoint] of Object.entries(endpoints)) {
      if (endpoint.dependsOn) continue; // dependent filters are fetched separately
      speciesService.fetchDynamicFilterOptions(franchiseKey, filterKey).then(options => {
        setDynamicFilterOptions(prev => ({ ...prev, [filterKey]: options }));
      }).catch(err => console.error(`Error fetching ${filterKey} options:`, err));
    }
  }, [franchiseKey, franchiseConfig?.filterEndpoints]);

  // Fetch dependent filter options when their parent value changes
  useEffect(() => {
    if (!franchiseKey || !franchiseConfig?.filterEndpoints) return;

    const endpoints = franchiseConfig.filterEndpoints;
    for (const [filterKey, endpoint] of Object.entries(endpoints)) {
      if (!endpoint.dependsOn) continue;
      const parentValue = filterValues[endpoint.dependsOn];
      speciesService.fetchDynamicFilterOptions(franchiseKey, filterKey, parentValue || undefined).then(options => {
        setDynamicFilterOptions(prev => ({ ...prev, [filterKey]: options }));
      }).catch(err => console.error(`Error fetching ${filterKey} options:`, err));
    }
  }, [franchiseKey, franchiseConfig?.filterEndpoints, filterValues]);

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
    setDynamicFilterOptions({});
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

  const handleImport = useCallback(async () => {
    if (!franchiseKey) return;
    setImporting(true);
    setImportError(null);
    try {
      const summary = await speciesService.importFromWiki(franchiseKey);
      setImportConfirmOpen(false);
      setImportSummary(summary);
      fetchData();
    } catch (err) {
      console.error('Error importing species from wiki:', err);
      setImportError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  }, [franchiseKey, fetchData]);

  const handleRefreshImages = useCallback(async () => {
    if (!franchiseKey) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const summary = await speciesService.refreshImages(franchiseKey);
      setRefreshConfirmOpen(false);
      setRefreshSummary(summary);
      fetchData();
    } catch (err) {
      console.error('Error refreshing species images:', err);
      setRefreshError('Image refresh failed. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [franchiseKey, fetchData]);

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

  // Build filter configs from franchise config + admin config filter options + dynamic options
  const tableFilters: FilterConfig[] = Object.entries(franchiseConfig.filters).map(([filterKey, fc]) => {
    const staticOptions = fc.options;
    const configOptions = config.filterOptions?.[filterKey];
    const dynamicOptions = dynamicFilterOptions[filterKey];

    let options: { value: string; label: string }[];
    if (staticOptions) {
      options = staticOptions.map(o => ({ value: o, label: o }));
    } else if (fc.type === 'boolean') {
      options = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }];
    } else if (configOptions) {
      options = configOptions.map(o => ({ value: o, label: o }));
    } else if (dynamicOptions) {
      options = dynamicOptions.map(o => ({ value: o, label: o }));
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

      <div style={{ marginTop: 'var(--spacing-small)', display: 'flex', gap: 'var(--spacing-xsmall)' }}>
        <Link to={`${basePath}/mass-edit`} className="button secondary">
          <i className="fas fa-edit"></i> Mass Edit
        </Link>
        {config.hasMassAdd && (
          <Link to={`${basePath}/mass-add`} className="button secondary">
            <i className="fas fa-images"></i> Mass Add {config.label}
          </Link>
        )}
        {config.wikiImport && (
          <button
            className="button secondary"
            onClick={() => { setImportError(null); setImportConfirmOpen(true); }}
          >
            <i className="fas fa-cloud-download-alt"></i> {config.wikiImport.label}
          </button>
        )}
        {config.imageRefresh && (
          <button
            className="button secondary"
            onClick={() => { setRefreshError(null); setRefreshConfirmOpen(true); }}
          >
            <i className="fas fa-sync-alt"></i> {config.imageRefresh.label}
          </button>
        )}
      </div>

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

      {config.wikiImport && (
        <ConfirmModal
          isOpen={importConfirmOpen}
          onClose={() => { if (!importing) setImportConfirmOpen(false); }}
          onConfirm={handleImport}
          title={`Import ${config.label} from Wiki`}
          message={`This will scrape ${config.wikiImport.source} and add any ${config.label} not already in the database. Existing entries are left unchanged.`}
          details={importError ? <p className="alert error">{importError}</p> : undefined}
          confirmText={importing ? 'Importing…' : 'Import'}
          confirmIcon="fas fa-cloud-download-alt"
          loading={importing}
          confirmDisabled={importing}
        />
      )}

      <InfoModal
        isOpen={!!importSummary}
        onClose={() => setImportSummary(null)}
        title={`${config.label} Import Complete`}
        size="medium"
        metadata={importSummary ? [
          { label: 'Scraped from wiki', value: importSummary.scraped },
          { label: 'Already in database', value: importSummary.existing },
          { label: 'Newly added', value: importSummary.added.length },
          ...(importSummary.missingImages.length > 0
            ? [{ label: 'Added without image', value: importSummary.missingImages.length }]
            : []),
          ...(importSummary.failed.length > 0
            ? [{ label: 'Failed', value: importSummary.failed.length }]
            : []),
        ] : undefined}
        sections={importSummary && importSummary.added.length > 0 ? [
          {
            title: `Added ${importSummary.added.length} ${config.label}`,
            icon: 'fas fa-plus-circle',
            content: (
              <ul className="species-import-added">
                {importSummary.added.map((pal) => (
                  <li key={pal.name}>
                    {pal.number ? `#${pal.number} ` : ''}{pal.name}
                  </li>
                ))}
              </ul>
            ),
          },
        ] : undefined}
        description={importSummary && importSummary.added.length === 0
          ? `No new ${config.label} found — the database is already up to date.`
          : undefined}
      />

      {config.imageRefresh && (
        <ConfirmModal
          isOpen={refreshConfirmOpen}
          onClose={() => { if (!refreshing) setRefreshConfirmOpen(false); }}
          onConfirm={handleRefreshImages}
          title={`Update ${config.label} Images`}
          message={`This will re-point every ${config.label} entry at the best image available: our own artwork when it has been uploaded, falling back to the ${config.imageRefresh.fallbackSource} image otherwise. Entries with no image from either source are left unchanged.`}
          details={refreshError ? <p className="alert error">{refreshError}</p> : undefined}
          confirmText={refreshing ? 'Updating…' : 'Update Images'}
          confirmIcon="fas fa-sync-alt"
          loading={refreshing}
          confirmDisabled={refreshing}
        />
      )}

      <InfoModal
        isOpen={!!refreshSummary}
        onClose={() => setRefreshSummary(null)}
        title={`${config.label} Images Updated`}
        size="medium"
        metadata={refreshSummary ? [
          { label: 'Checked', value: refreshSummary.checked },
          { label: 'Already current', value: refreshSummary.unchanged },
          { label: 'Updated', value: refreshSummary.updated.length },
          ...(refreshSummary.unresolved.length > 0
            ? [{ label: 'No image available', value: refreshSummary.unresolved.length }]
            : []),
          ...(refreshSummary.failed.length > 0
            ? [{ label: 'Failed', value: refreshSummary.failed.length }]
            : []),
        ] : undefined}
        sections={refreshSummary && refreshSummary.updated.length > 0 ? [
          {
            title: `Updated ${refreshSummary.updated.length} image(s)`,
            icon: 'fas fa-sync-alt',
            content: (
              <ul className="species-import-added">
                {refreshSummary.updated.map((change) => (
                  <li key={change.id}>
                    {change.name} — {change.source === 'self-hosted'
                      ? 'now using our own artwork'
                      : `now using the ${config.imageRefresh?.fallbackSource ?? 'fallback'} image`}
                  </li>
                ))}
              </ul>
            ),
          },
        ] : undefined}
        description={refreshSummary && refreshSummary.updated.length === 0
          ? `Every ${config.label} entry is already using the best image available.`
          : undefined}
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
