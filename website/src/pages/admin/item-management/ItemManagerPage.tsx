import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { AdminTable, type FilterConfig, type ColumnDef } from '@components/admin/AdminTable';
import { ConfirmModal } from '@components/common/ConfirmModal';
import itemsService, { type Item } from '@services/itemsService';
import '@styles/admin/item-manager.css';

function ItemManagerContent() {
  useDocumentTitle('Item Manager');

  const [data, setData] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

  // Filter options loaded from backend
  const [categories, setCategories] = useState<string[]>([]);
  const [rarities, setRarities] = useState<string[]>([]);

  // Load filter options once on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [cats, rs] = await Promise.all([
          itemsService.getCategories(),
          itemsService.getRarities(),
        ]);
        setCategories(cats);
        setRarities(rs);
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    loadFilterOptions();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await itemsService.getAdminItems({
        page: currentPage,
        limit: 20,
        search: searchValue || undefined,
        sortBy,
        sortOrder,
        category: filterValues.category || undefined,
        rarity: filterValues.rarity || undefined,
      });
      setData(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to load items.');
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
    try {
      await itemsService.deleteItem(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  }, [deleteTarget, fetchData]);

  const filters: FilterConfig[] = [
    {
      key: 'category',
      label: 'Category',
      options: Array.isArray(categories) ? categories.map(c => ({ value: c, label: c })) : [],
    },
    {
      key: 'rarity',
      label: 'Rarity',
      options: Array.isArray(rarities) ? rarities.map(r => ({ value: r, label: r })) : [],
    },
  ];

  const columns: ColumnDef<Item>[] = [
    {
      key: '__image',
      header: 'Image',
      className: 'item-manager__thumb-cell',
      render: (item) => {
        if (item.image_url) {
          return (
            <img
              src={item.image_url}
              alt={item.name}
              className="item-manager__thumbnail"
            />
          );
        }
        return (
          <div className="item-manager__no-image">
            <i className="fas fa-cube"></i>
          </div>
        );
      },
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (item) => (
        <span className="badge neutral sm">{item.category ?? '—'}</span>
      ),
    },
    {
      key: 'rarity',
      header: 'Rarity',
      render: (item) => item.rarity
        ? <span className="badge sm">{item.rarity}</span>
        : '—',
    },
    {
      key: 'base_price',
      header: 'Price',
      sortable: true,
      render: (item) => item.base_price ?? 0,
    },
  ];

  return (
    <>
      <AdminTable<Item>
        title="Item Manager"
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        error={error}
        onRetry={fetchData}
        addButton={{ label: 'Add Item', to: '/admin/item-manager/add' }}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or description..."
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
        emptyMessage="No items found"
        actions={(item) => (
          <>
            <Link to={`/admin/item-manager/edit/${item.id}`} className="button primary sm">
              <i className="fas fa-edit"></i> Edit
            </Link>
            <button
              className="button danger sm"
              onClick={() => setDeleteTarget(item)}
            >
              <i className="fas fa-trash"></i> Delete
            </button>
          </>
        )}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"?`}
        warning="This action is permanent and cannot be undone."
        confirmText="Delete"
        variant="danger"
        confirmIcon="fas fa-trash"
      />
    </>
  );
}

export default function ItemManagerPage() {
  return (
    <AdminRoute>
      <ItemManagerContent />
    </AdminRoute>
  );
}
