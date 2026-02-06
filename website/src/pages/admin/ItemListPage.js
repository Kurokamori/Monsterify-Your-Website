import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import itemsApi from '../../services/itemsApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-toastify';

const ItemListPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [rarities, setRarities] = useState([]);

  // Fetch items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsApi.getItems({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy,
        sortOrder,
        category: categoryFilter,
        type: typeFilter,
        rarity: rarityFilter
      });

      setItems(response.data);
      setTotalPages(response.pagination.totalPages);
      setError(null);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Failed to fetch items. Please try again later.');
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const [categoriesResponse, typesResponse, raritiesResponse] = await Promise.all([
        itemsApi.getCategories(),
        itemsApi.getTypes(),
        itemsApi.getRarities()
      ]);

      setCategories(categoriesResponse.data);
      setTypes(typesResponse.data);
      setRarities(raritiesResponse.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      toast.error('Failed to fetch filter options');
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsApi.deleteItem(id);
        toast.success('Item deleted successfully');
        fetchItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Failed to delete item');
      }
    }
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleRarityFilterChange = (e) => {
    setRarityFilter(e.target.value);
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
    setCategoryFilter('');
    setTypeFilter('');
    setRarityFilter('');
    setCurrentPage(1);
  };

  // Fetch items and filter options when dependencies change
  useEffect(() => {
    fetchItems();
  }, [currentPage, searchTerm, sortBy, sortOrder, categoryFilter, typeFilter, rarityFilter]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Shop Items</h1>
        <div>
          <Link to="/admin/items/add" className="button primary" style={{ marginRight: '10px' }}>
            <i className="fas fa-plus"></i> Add Item
          </Link>
          <Link to="/admin/items/bulk" className="button primary">
            <i className="fas fa-upload"></i> Bulk Add Items
          </Link>
        </div>
      </div>

      <div className="admin-filters">
        <div className="admin-search">
          <SearchBar
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="admin-filter-group">
          <div className="admin-filter">
            <label>Category:</label>
            <select value={categoryFilter} onChange={handleCategoryFilterChange}>
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label>Type:</label>
            <select value={typeFilter} onChange={handleTypeFilterChange}>
              <option value="">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label>Rarity:</label>
            <select value={rarityFilter} onChange={handleRarityFilterChange}>
              <option value="">All Rarities</option>
              {rarities.map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity}
                </option>
              ))}
            </select>
          </div>

          <button className="button secondary" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading items..." />
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-table-image-cell">Image</th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name
                    {sortBy === 'name' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('category')} className="sortable">
                    Category
                    {sortBy === 'category' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('type')} className="sortable">
                    Type
                    {sortBy === 'type' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('rarity')} className="sortable">
                    Rarity
                    {sortBy === 'rarity' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th onClick={() => handleSort('base_price')} className="sortable">
                    Price
                    {sortBy === 'base_price' && (
                      <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    )}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="admin-table-image-cell">
                        <img
                          src={item.image_url || '/images/placeholder-item.png'}
                          alt={item.name}
                          className="admin-item-thumbnail"
                        />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.type || 'N/A'}</td>
                      <td>{item.rarity || 'N/A'}</td>
                      <td>{formatPrice(item.base_price)}</td>
                      <td className="admin-actions-cell">
                        <Link
                          to={`/admin/items/edit/${item.id}`}
                          className="button info sm"
                          title="Edit Item"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                        <button
                          className="button danger sm"
                          title="Delete Item"
                          onClick={() => handleDelete(item.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="admin-table-empty">
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default ItemListPage;
