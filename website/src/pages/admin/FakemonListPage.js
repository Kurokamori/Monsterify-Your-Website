import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import fakemonService from '../../services/fakemonService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

/**
 * Fakemon List Page
 * Displays a list of all fakemon with options to add, edit, and delete
 */
const FakemonListPage = () => {
  const [fakemon, setFakemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [types, setTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fakemonToDelete, setFakemonToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  // Check for success message in location state
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      // Clear the location state
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch fakemon and types on component mount
  useEffect(() => {
    fetchTypes();
    fetchFakemon();
  }, [currentPage, selectedType]);

  // Fetch all fakemon types
  const fetchTypes = async () => {
    try {
      const response = await fakemonService.getAllTypes();
      setTypes(response.types || []);
    } catch (err) {
      console.error('Error fetching fakemon types:', err);
    }
  };

  // Fetch fakemon with pagination and filters
  const fetchFakemon = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 20,
        type: selectedType || undefined,
        search: searchTerm || undefined
      };

      const response = await fakemonService.getAllFakemon(params);

      // Process fakemon data to ensure each has a types array
      const processedFakemon = (response.fakemon || []).map(mon => {
        // Create types array from type1, type2, etc. fields
        const types = [mon.type1, mon.type2, mon.type3, mon.type4, mon.type5]
          .filter(Boolean); // Remove null/undefined values

        return {
          ...mon,
          types: types,
          // Use image_url if available, otherwise use a placeholder
          image_url: mon.image_url || `https://via.placeholder.com/50?text=${encodeURIComponent(mon.name)}`
        };
      });

      setFakemon(processedFakemon);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Error fetching fakemon:', err);
      setError('Failed to load fakemon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchFakemon();
  };

  // Handle type filter change
  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Open delete confirmation modal
  const openDeleteModal = (fakemon) => {
    setFakemonToDelete(fakemon);
    setDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setFakemonToDelete(null);
    setDeleteModalOpen(false);
  };

  // Handle fakemon deletion
  const handleDeleteFakemon = async () => {
    if (!fakemonToDelete) return;

    try {
      await fakemonService.deleteFakemon(fakemonToDelete.number);

      // Remove the deleted fakemon from the list
      setFakemon(fakemon.filter(f => f.number !== fakemonToDelete.number));

      // Show success message
      setSuccessMessage(`Fakemon #${fakemonToDelete.number} (${fakemonToDelete.name}) deleted successfully`);

      // Close the modal
      closeDeleteModal();
    } catch (err) {
      console.error(`Error deleting fakemon ${fakemonToDelete.number}:`, err);
      setError(`Failed to delete fakemon: ${err.response?.data?.message || err.message}`);
      closeDeleteModal();
    }
  };

  // Generate pagination buttons
  const renderPagination = () => {
    const pages = [];

    // Always show first page
    pages.push(
      <button
        key="first"
        onClick={() => handlePageChange(1)}
        className={`admin-button secondary ${currentPage === 1 ? 'active' : ''}`}
        disabled={currentPage === 1}
      >
        1
      </button>
    );

    // Show ellipsis if needed
    if (currentPage > 3) {
      pages.push(
        <span key="ellipsis1" className="admin-pagination-ellipsis">...</span>
      );
    }

    // Show current page and surrounding pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they're always shown

      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`admin-pagination-button ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      pages.push(
        <span key="ellipsis2" className="admin-pagination-ellipsis">...</span>
      );
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pages.push(
        <button
          key="last"
          onClick={() => handlePageChange(totalPages)}
          className={`admin-pagination-button ${currentPage === totalPages ? 'active' : ''}`}
          disabled={currentPage === totalPages}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="container">
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">Fakemon Management</h1>
          <p className="admin-dashboard-subtitle">
            Manage fakemon entries in the Fakedex
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="admin-alert success">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="admin-alert error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="admin-actions">
          <Link to="/admin" className="button secondary">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </Link>
          <Link to="/admin/fakemon/add" className="button primary">
            <i className="fas fa-plus"></i> Add New Fakemon
          </Link>
          <Link to="/admin/fakemon/mass-add" className="button primary">
            <i className="fas fa-images"></i> Mass Addition
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="admin-filters">
          <form onSubmit={handleSearch} className="admin-search-form">
            <input
              type="text"
              placeholder="Search fakemon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
            <button type="submit" className="button primary">
              <i className="fas fa-search"></i> Search
            </button>
          </form>

          <div className="admin-filter-group">
            <label htmlFor="typeFilter" className="admin-filter-label">Filter by Type:</label>
            <select
              id="typeFilter"
              value={selectedType}
              onChange={handleTypeChange}
              className="admin-filter-select"
            >
              <option value="">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fakemon Table */}
        {loading ? (
          <LoadingSpinner message="Loading fakemon..." />
        ) : (
          <>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th className="fakemon-types-cell">Types</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fakemon.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">No fakemon found</td>
                    </tr>
                  ) : (
                    fakemon.map(mon => (
                      <tr key={mon.number}>
                        <td>#{mon.number}</td>
                        <td>
                          <img
                            src={mon.image_url}
                            alt={mon.name}
                            className="admin-fakemon-thumbnail"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/50?text=No+Image';
                            }}
                          />
                        </td>
                        <td>{mon.name}</td>
                        <td className="fakemon-types-cell">
                          {mon.types.map(type => (
                            <span key={type} className={`fakemon-type type-badge type-${type.toLowerCase()}`}>
                              {type}
                            </span>
                          ))}
                        </td>
                        <td>{mon.category || '-'}</td>
                        <td className="admin-actions-cell">
                          <Link
                            to={`/fakedex/${mon.number}`}
                            className="button secondary sm"
                            title="View Fakemon"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          <Link
                            to={`/admin/fakemon/edit/${mon.number}`}
                            className="button info sm"
                            title="Edit Fakemon"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <button
                            onClick={() => openDeleteModal(mon)}
                            className="button danger sm"
                            title="Delete Fakemon"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="admin-pagination-button"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                {renderPagination()}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="admin-pagination-button"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && fakemonToDelete && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Confirm Deletion</h2>
            </div>
            <div className="admin-modal-body">
              <p>
                Are you sure you want to delete the fakemon <strong>#{fakemonToDelete.number} {fakemonToDelete.name}</strong>?
              </p>
              <p className="admin-modal-warning">
                This action cannot be undone.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                onClick={closeDeleteModal}
                className="button secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFakemon}
                className="button danger"
              >
                Delete Fakemon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FakemonListPage;
