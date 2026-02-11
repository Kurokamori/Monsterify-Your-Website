import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import monsterService from '../../services/monsterService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

/**
 * Monster List Page
 * Displays a list of all monsters with options to add, edit, and delete
 */
const MonsterListPage = () => {
  const [monsters, setMonsters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [types, setTypes] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [monsterToDelete, setMonsterToDelete] = useState(null);
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

  // Fetch monsters, types, and trainers on component mount
  useEffect(() => {
    fetchTypes();
    fetchTrainers();
    fetchMonsters();
  }, [currentPage, selectedType, selectedTrainer]);

  // Fetch all monster types
  const fetchTypes = async () => {
    try {
      const response = await monsterService.getAllTypes();
      setTypes(response.types || []);
    } catch (err) {
      console.error('Error fetching monster types:', err);
    }
  };

  // Fetch all trainers
  const fetchTrainers = async () => {
    try {
      const response = await trainerService.getAllTrainers();
      setTrainers(response.trainers || []);
    } catch (err) {
      console.error('Error fetching trainers:', err);
    }
  };

  // Fetch monsters with pagination and filters
  const fetchMonsters = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 20,
        type: selectedType || undefined,
        trainer_id: selectedTrainer || undefined,
        search: searchTerm || undefined
      };

      let response;
      if (selectedTrainer) {
        response = await monsterService.getTrainerMonstersPaginated(selectedTrainer, params);
        setMonsters(response.monsters || []);
        setTotalPages(response.totalPages || 1);
      } else {
        response = await monsterService.getAllMonsters(params);
        setMonsters(response.data || []);
        setTotalPages(Math.ceil((response.count || 0) / 20));
      }
    } catch (err) {
      console.error('Error fetching monsters:', err);
      setError('Failed to load monsters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMonsters();
  };

  // Handle type filter change
  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
    setCurrentPage(1);
  };

  // Handle trainer filter change
  const handleTrainerChange = (e) => {
    setSelectedTrainer(e.target.value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Open delete confirmation modal
  const openDeleteModal = (monster) => {
    setMonsterToDelete(monster);
    setDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setMonsterToDelete(null);
    setDeleteModalOpen(false);
  };

  // Handle monster deletion
  const handleDeleteMonster = async () => {
    if (!monsterToDelete) return;

    try {
      await monsterService.deleteMonster(monsterToDelete.id);

      // Remove the deleted monster from the list
      setMonsters(monsters.filter(m => m.id !== monsterToDelete.id));

      // Show success message
      setSuccessMessage(`Monster #${monsterToDelete.id} (${monsterToDelete.name}) deleted successfully`);

      // Close the modal
      closeDeleteModal();
    } catch (err) {
      console.error(`Error deleting monster ${monsterToDelete.id}:`, err);
      setError(`Failed to delete monster: ${err.response?.data?.message || err.message}`);
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
        className={`button secondary ${currentPage === 1 ? 'active' : ''}`}
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
          className={`button secondary ${currentPage === i ? 'active' : ''}`}
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
          className={`button secondary ${currentPage === totalPages ? 'active' : ''}`}
          disabled={currentPage === totalPages}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  // Get trainer name by ID
  const getTrainerName = (trainerId) => {
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer ? trainer.name : 'Unknown';
  };

  // Format monster types for display
  const formatTypes = (monster) => {
    const types = [];
    if (monster.type1) types.push(monster.type1);
    if (monster.type2) types.push(monster.type2);
    if (monster.type3) types.push(monster.type3);
    if (monster.type4) types.push(monster.type4);
    if (monster.type5) types.push(monster.type5);
    return types;
  };

  return (
    <div className="container">
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">Monster Management</h1>
          <p className="admin-dashboard-subtitle">
            Manage monsters in the game
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert success">
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="alert error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="admin-actions">
          <Link to="/admin" className="button secondary">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </Link>
          <Link to="/admin/monsters/add" className="button primary">
            <i className="fas fa-plus"></i> Add New Monster
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="admin-filters">
          <form onSubmit={handleSearch} className="tree-header">
            <input
              type="text"
              placeholder="Search monsters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-search-input"
            />
            <button type="submit" className="button primary">
              <i className="fas fa-search"></i> Search
            </button>
          </form>

          <div className="form-input">
            <label htmlFor="typeFilter" className="admin-filter-label">Type:</label>
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

          <div className="form-input">
            <label htmlFor="trainerFilter" className="admin-filter-label">Trainer:</label>
            <select
              id="trainerFilter"
              value={selectedTrainer}
              onChange={handleTrainerChange}
              className="admin-filter-select"
            >
              <option value="">All Trainers</option>
              {trainers.map(trainer => (
                <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Monster Table */}
        {loading ? (
          <LoadingSpinner message="Loading monsters..." />
        ) : (
          <>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Species</th>
                    <th>Types</th>
                    <th>Level</th>
                    <th>Trainer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {monsters.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center">No monsters found</td>
                    </tr>
                  ) : (
                    monsters.map(monster => (
                      <tr key={monster.id}>
                        <td>#{monster.id}</td>
                        <td>
                          <img
                            src={monster.img_link || 'https://via.placeholder.com/50?text=No+Image'}
                            alt={monster.name}
                            className="admin-monster-thumbnail"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/50?text=No+Image';
                            }}
                          />
                        </td>
                        <td>{monster.name}</td>
                        <td>{monster.species1}{monster.species2 ? `, ${monster.species2}` : ''}{monster.species3 ? `, ${monster.species3}` : ''}</td>
                        <td>
                          {formatTypes(monster).map(type => (
                            <span key={type} className={`monster-type type-${type.toLowerCase()}`}>
                              {type}
                            </span>
                          ))}
                        </td>
                        <td>{monster.level}</td>
                        <td>{getTrainerName(monster.trainer_id)}</td>
                        <td className="admin-actions-cell">
                          <Link
                            to={`/monsters/${monster.id}`}
                            className="button secondary sm"
                            title="View Monster"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          <Link
                            to={`/admin/monsters/edit/${monster.id}`}
                            className="button info sm"
                            title="Edit Monster"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <button
                            onClick={() => openDeleteModal(monster)}
                            className="button danger sm"
                            title="Delete Monster"
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
                  className="button secondary sm"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                {renderPagination()}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="button secondary sm"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && monsterToDelete && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Confirm Deletion</h2>
            </div>
            <div className="admin-modal-body">
              <p>
                Are you sure you want to delete the monster <strong>#{monsterToDelete.id} {monsterToDelete.name}</strong>?
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
                onClick={handleDeleteMonster}
                className="button danger"
              >
                Delete Monster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonsterListPage;
