import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const PersonalArtTodoPage = () => {
  useDocumentTitle('Art Todo');
  
  const { isAuthenticated, currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Modal states
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);

  // Form states
  const [listForm, setListForm] = useState({ title: '', description: '' });
  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    is_persistent: false,
    steps_total: 0
  });

  // Reference data
  const [trainers, setTrainers] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [itemReferences, setItemReferences] = useState([]);
  const [selectedTab, setSelectedTab] = useState('trainers');

  // Reference modal states
  const [isFullScreenReferenceOpen, setIsFullScreenReferenceOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState(null);
  const [collapsedTrainerGroups, setCollapsedTrainerGroups] = useState({});

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchLists();
      fetchTrainers();
      fetchMonsters();
    }
  }, [isAuthenticated]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await api.get('/art-todo/lists');
      setLists(response.data.data || []);
    } catch (err) {
      console.error('Error fetching lists:', err);
      setError('Failed to load art todo lists. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await api.get('/art-todo/trainers');
      setTrainers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching trainers:', err);
    }
  };

  const fetchMonsters = async () => {
    try {
      const response = await api.get('/art-todo/monsters');
      setMonsters(response.data.data || []);
    } catch (err) {
      console.error('Error fetching monsters:', err);
    }
  };

  const fetchItemReferences = async (itemId) => {
    try {
      const response = await api.get(`/art-todo/items/${itemId}/references`);
      setItemReferences(response.data.data || []);
    } catch (err) {
      console.error('Error fetching item references:', err);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      await api.post('/art-todo/lists', listForm);
      setListForm({ title: '', description: '' });
      setIsCreateListModalOpen(false);
      fetchLists();
    } catch (err) {
      console.error('Error creating list:', err);
      setError('Failed to create list. Please try again.');
    }
  };

  const handleUpdateList = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/art-todo/lists/${selectedList.id}`, listForm);
      setListForm({ title: '', description: '' });
      setIsEditListModalOpen(false);
      setSelectedList(null);
      fetchLists();
    } catch (err) {
      console.error('Error updating list:', err);
      setError('Failed to update list. Please try again.');
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list? All items in it will be deleted.')) {
      return;
    }

    try {
      await api.delete(`/art-todo/lists/${listId}`);
      fetchLists();
    } catch (err) {
      console.error('Error deleting list:', err);
      setError('Failed to delete list. Please try again.');
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/art-todo/lists/${selectedList.id}/items`, itemForm);
      setItemForm({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        is_persistent: false,
        steps_total: 0
      });
      setIsCreateItemModalOpen(false);
      fetchLists();
      // Refresh the current list view if we're viewing items
      if (selectedList) {
        fetchListWithItems(selectedList.id);
      }
    } catch (err) {
      console.error('Error creating item:', err);
      setError('Failed to create item. Please try again.');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/art-todo/items/${selectedItem.id}`, itemForm);
      setItemForm({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        is_persistent: false,
        steps_total: 0
      });
      setIsEditItemModalOpen(false);
      setSelectedItem(null);
      fetchLists();
      // Refresh the current list view if we're viewing items
      if (selectedList) {
        fetchListWithItems(selectedList.id);
      }
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await api.delete(`/art-todo/items/${itemId}`);
      fetchLists();
      // Refresh the current list view if we're viewing items
      if (selectedList) {
        fetchListWithItems(selectedList.id);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item. Please try again.');
    }
  };

  const handleAddReference = async (referenceType, referenceId) => {
    try {
      console.log('Adding reference:', { referenceType, referenceId, itemId: selectedItem.id });
      await api.post(`/art-todo/items/${selectedItem.id}/references`, {
        reference_type: referenceType,
        reference_id: referenceId
      });
      fetchItemReferences(selectedItem.id);
    } catch (err) {
      console.error('Error adding reference:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to add reference. Please try again.');
    }
  };

  const handleRemoveReference = async (referenceId) => {
    try {
      await api.delete(`/art-todo/references/${referenceId}`);
      fetchItemReferences(selectedItem.id);
    } catch (err) {
      console.error('Error removing reference:', err);
      setError('Failed to remove reference. Please try again.');
    }
  };

  const openEditListModal = (list) => {
    setSelectedList(list);
    setListForm({ title: list.title, description: list.description || '' });
    setIsEditListModalOpen(true);
  };

  const openCreateItemModal = (list) => {
    setSelectedList(list);
    setIsCreateItemModalOpen(true);
  };

  const fetchListWithItems = async (listId) => {
    try {
      const response = await api.get(`/art-todo/lists/${listId}`);
      const listWithItems = response.data.data;
      setSelectedList(listWithItems);
    } catch (err) {
      console.error('Error fetching list with items:', err);
      setError('Failed to load list items. Please try again.');
    }
  };

  const openEditItemModal = (item) => {
    setSelectedItem(item);
    setItemForm({
      title: item.title,
      description: item.description || '',
      status: item.status,
      priority: item.priority,
      due_date: item.due_date || '',
      is_persistent: item.is_persistent,
      steps_total: item.steps_total
    });
    setIsEditItemModalOpen(true);
  };

  const openReferenceModal = (item) => {
    setSelectedItem(item);
    fetchItemReferences(item.id);
    setSearchQuery('');
    setSelectedTrainerFilter('');
    setSelectedTab('trainers');
    setIsReferenceModalOpen(true);
  };

  const handleIncrementStep = async (item) => {
    if (item.steps_completed >= item.steps_total) return;

    try {
      const newStepsCompleted = item.steps_completed + 1;
      const newStatus = newStepsCompleted >= item.steps_total ? 'completed' : item.status;

      await api.put(`/art-todo/items/${item.id}`, {
        ...item,
        steps_completed: newStepsCompleted,
        status: newStatus
      });

      fetchLists();
      if (selectedList) {
        fetchListWithItems(selectedList.id);
      }
    } catch (err) {
      console.error('Error incrementing step:', err);
      setError('Failed to update step progress. Please try again.');
    }
  };

  const openFullScreenReference = (item) => {
    setSelectedItem(item);
    fetchItemReferences(item.id);
    setIsFullScreenReferenceOpen(true);
  };

  const openImageViewer = (reference) => {
    setSelectedReference(reference);
    setIsImageViewerOpen(true);
  };

  const getFilteredMonsters = () => {
    let filtered = monsters;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(monster =>
        monster.name.toLowerCase().includes(query) ||
        monster.species1.toLowerCase().includes(query) ||
        (monster.type1 && monster.type1.toLowerCase().includes(query))
      );
    }

    // Filter by trainer
    if (selectedTrainerFilter) {
      filtered = filtered.filter(monster =>
        monster.trainer_id === parseInt(selectedTrainerFilter)
      );
    }

    return filtered;
  };

  const getGroupedTrainers = () => {
    const grouped = {};
    trainers.forEach(trainer => {
      const groupKey = trainer.species1 || 'Other';
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(trainer);
    });
    return grouped;
  };

  const toggleTrainerGroup = (groupName) => {
    setCollapsedTrainerGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="art-todo-container">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please log in to access your art todo lists.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading art todo lists..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={fetchLists}
      />
    );
  }

  return (
    <div className="art-todo-container">
      <div className="art-todo-header">
        <h1>My Art To-Do Lists</h1>
        <button
          className="create-list-btn"
          onClick={() => setIsCreateListModalOpen(true)}
        >
          <i className="fas fa-plus"></i> Create New List
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="no-lists">
          <div className="no-lists-icon">
            <i className="fas fa-list"></i>
          </div>
          <h2>No Art Todo Lists</h2>
          <p>Create your first art todo list to start organizing your art projects!</p>
          <button
            className="create-first-list-btn"
            onClick={() => setIsCreateListModalOpen(true)}
          >
            Create Your First List
          </button>
        </div>
      ) : (
        <div className="lists-grid">
          {lists.map(list => (
            <div key={list.id} className="list-card">
              <div className="list-header">
                <h3 className="list-title">{list.title}</h3>
                <div className="list-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => openEditListModal(list)}
                    title="Edit List"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteList(list.id)}
                    title="Delete List"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              {list.description && (
                <p className="list-description">{list.description}</p>
              )}

              <div className="list-stats">
                <span className="stat">
                  <i className="fas fa-tasks"></i> {list.item_count} items
                </span>
                <span className="stat">
                  <i className="fas fa-check-circle"></i> {list.completed_count} completed
                </span>
              </div>

              <div className="list-actions-bottom">
                <button
                  className="add-item-btn"
                  onClick={() => openCreateItemModal(list)}
                >
                  <i className="fas fa-plus"></i> Add Item
                </button>
                <button
                  className="view-items-btn"
                  onClick={() => fetchListWithItems(list.id)}
                >
                  View Items
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected List Items View */}
      {selectedList && !isCreateItemModalOpen && !isEditItemModalOpen && (
        <div className="list-items-view">
          <div className="items-header">
            <h2>{selectedList.title} - Items</h2>
            <div className="items-actions">
              <button
                className="add-item-btn"
                onClick={() => openCreateItemModal(selectedList)}
              >
                <i className="fas fa-plus"></i> Add Item
              </button>
              <button
                className="back-btn"
                onClick={() => setSelectedList(null)}
              >
                <i className="fas fa-arrow-left"></i> Back to Lists
              </button>
            </div>
          </div>

          <div className="items-grid">
            {selectedList.items?.map(item => (
              <div key={item.id} className={`item-card status-${item.status} priority-${item.priority}`}>
                <div className="item-header">
                  <h4 className="item-title">{item.title}</h4>
                  <div className="item-actions">
                    <button
                      className="action-btn reference"
                      onClick={() => openReferenceModal(item)}
                      title="Manage References"
                    >
                      <i className="fas fa-image"></i>
                    </button>
                    <button
                      className="action-btn edit"
                      onClick={() => openEditItemModal(item)}
                      title="Edit Item"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete Item"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="item-description">{item.description}</p>
                )}

                <div className="item-meta">
                  <span className={`status-badge status-${item.status}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  <span className={`priority-badge priority-${item.priority}`}>
                    {item.priority}
                  </span>
                </div>

                {item.due_date && (
                  <div className="item-due-date">
                    <i className="fas fa-calendar-alt"></i>
                    Due: {new Date(item.due_date).toLocaleDateString()}
                  </div>
                )}

                {item.steps_total > 0 && (
                  <div className="item-progress">
                    <div className="progress-header">
                      <span className="progress-text">
                        {item.steps_completed}/{item.steps_total} steps
                      </span>
                      {item.steps_completed < item.steps_total && (
                        <button
                          className="increment-step-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIncrementStep(item);
                          }}
                          title="Complete next step"
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      )}
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(item.steps_completed / item.steps_total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {item.references && item.references.length > 0 && (
                  <div className="item-references">
                    <div className="references-header">
                      <span className="references-label">References:</span>
                      <button
                        className="view-matrix-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFullScreenReference(item);
                        }}
                        title="View full reference matrix"
                      >
                        <i className="fas fa-expand"></i>
                      </button>
                    </div>
                    <div className="reference-thumbnails">
                      {item.references.slice(0, 3).map(ref => (
                        <div
                          key={ref.id}
                          className="reference-thumbnail clickable"
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageViewer(ref);
                          }}
                          title={`Click to view ${ref.reference_type}: ${ref.reference_name}`}
                        >
                          {ref.reference_image ? (
                            <img
                              src={ref.reference_image}
                              alt={ref.reference_name}
                            />
                          ) : (
                            <div className="reference-placeholder">
                              <i className={`fas fa-${ref.reference_type === 'trainer' ? 'user' : 'paw'}`}></i>
                            </div>
                          )}
                        </div>
                      ))}
                      {item.references.length > 3 && (
                        <div
                          className="reference-more clickable"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFullScreenReference(item);
                          }}
                          title="View all references"
                        >
                          +{item.references.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create List Modal */}
      <Modal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        title="Create New Art Todo List"
      >
        <form onSubmit={handleCreateList} className="list-form">
          <div className="form-group">
            <label htmlFor="list-title">Title *</label>
            <input
              type="text"
              id="list-title"
              value={listForm.title}
              onChange={(e) => setListForm({ ...listForm, title: e.target.value })}
              required
              placeholder="Enter list title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="list-description">Description</label>
            <textarea
              id="list-description"
              value={listForm.description}
              onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
              placeholder="Enter list description (optional)"
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setIsCreateListModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="button primary">
              Create List
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit List Modal */}
      <Modal
        isOpen={isEditListModalOpen}
        onClose={() => setIsEditListModalOpen(false)}
        title="Edit Art Todo List"
      >
        <form onSubmit={handleUpdateList} className="list-form">
          <div className="form-group">
            <label htmlFor="edit-list-title">Title *</label>
            <input
              type="text"
              id="edit-list-title"
              value={listForm.title}
              onChange={(e) => setListForm({ ...listForm, title: e.target.value })}
              required
              placeholder="Enter list title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-list-description">Description</label>
            <textarea
              id="edit-list-description"
              value={listForm.description}
              onChange={(e) => setListForm({ ...listForm, description: e.target.value })}
              placeholder="Enter list description (optional)"
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setIsEditListModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="button primary">
              Update List
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Item Modal */}
      <Modal
        isOpen={isCreateItemModalOpen}
        onClose={() => setIsCreateItemModalOpen(false)}
        title="Create New Art Todo Item"
      >
        <form onSubmit={handleCreateItem} className="item-form">
          <div className="form-group">
            <label htmlFor="item-title">Title *</label>
            <input
              type="text"
              id="item-title"
              value={itemForm.title}
              onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
              required
              placeholder="Enter item title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="item-description">Description</label>
            <textarea
              id="item-description"
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              placeholder="Enter item description (optional)"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="item-status">Status</label>
              <select
                id="item-status"
                value={itemForm.status}
                onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="item-priority">Priority</label>
              <select
                id="item-priority"
                value={itemForm.priority}
                onChange={(e) => setItemForm({ ...itemForm, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="item-due-date">Due Date</label>
              <input
                type="date"
                id="item-due-date"
                value={itemForm.due_date}
                onChange={(e) => setItemForm({ ...itemForm, due_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="item-steps">Total Steps</label>
              <input
                type="number"
                id="item-steps"
                value={itemForm.steps_total}
                onChange={(e) => setItemForm({ ...itemForm, steps_total: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={itemForm.is_persistent}
                onChange={(e) => setItemForm({ ...itemForm, is_persistent: e.target.checked })}
              />
              Persistent item (won't be deleted when completed)
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setIsCreateItemModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="button primary">
              Create Item
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditItemModalOpen}
        onClose={() => setIsEditItemModalOpen(false)}
        title="Edit Art Todo Item"
      >
        <form onSubmit={handleUpdateItem} className="item-form">
          <div className="form-group">
            <label htmlFor="edit-item-title">Title *</label>
            <input
              type="text"
              id="edit-item-title"
              value={itemForm.title}
              onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
              required
              placeholder="Enter item title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-item-description">Description</label>
            <textarea
              id="edit-item-description"
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              placeholder="Enter item description (optional)"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-item-status">Status</label>
              <select
                id="edit-item-status"
                value={itemForm.status}
                onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-item-priority">Priority</label>
              <select
                id="edit-item-priority"
                value={itemForm.priority}
                onChange={(e) => setItemForm({ ...itemForm, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-item-due-date">Due Date</label>
              <input
                type="date"
                id="edit-item-due-date"
                value={itemForm.due_date}
                onChange={(e) => setItemForm({ ...itemForm, due_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-item-steps">Total Steps</label>
              <input
                type="number"
                id="edit-item-steps"
                value={itemForm.steps_total}
                onChange={(e) => setItemForm({ ...itemForm, steps_total: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={itemForm.is_persistent}
                onChange={(e) => setItemForm({ ...itemForm, is_persistent: e.target.checked })}
              />
              Persistent item (won't be deleted when completed)
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => setIsEditItemModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="button primary">
              Update Item
            </button>
          </div>
        </form>
      </Modal>

      {/* Reference Management Modal */}
      <Modal
        isOpen={isReferenceModalOpen}
        onClose={() => setIsReferenceModalOpen(false)}
        title={`Manage References - ${selectedItem?.title}`}
        size="large"
      >
        <div className="reference-management">
          <div className="current-references">
            <h3>Current References</h3>
            {itemReferences.length === 0 ? (
              <p className="no-references">No references added yet.</p>
            ) : (
              <div className="references-grid">
                {itemReferences.map(ref => (
                  <div key={ref.id} className="reference-item">
                    <div className="reference-image">
                      {ref.reference_image ? (
                        <img
                          src={ref.reference_image}
                          alt={ref.reference_name}
                        />
                      ) : (
                        <div className="reference-placeholder">
                          <i className={`fas fa-${ref.reference_type === 'trainer' ? 'user' : 'paw'}`}></i>
                        </div>
                      )}
                    </div>
                    <div className="reference-info">
                      <span className="reference-name">{ref.reference_name}</span>
                      <span className="reference-type">{ref.reference_type}</span>
                    </div>
                    <button
                      className="remove-reference-btn"
                      onClick={() => handleRemoveReference(ref.id)}
                      title="Remove Reference"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="add-references">
            <h3>Add References</h3>

            <div className="reference-tabs">
              <div className="button tabs">
                <button
                  className={`button tab ${selectedTab === 'trainers' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('trainers')}
                >
                  Trainers
                </button>
                <button
                  className={`button tab ${selectedTab === 'monsters' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('monsters')}
                >
                  Monsters
                </button>
              </div>

              <div className="tab-content">
                {selectedTab === 'trainers' && (
                  <div className="trainers-grouped">
                    {Object.entries(getGroupedTrainers()).map(([groupName, groupTrainers]) => (
                      <div key={groupName} className="trainer-group">
                        <div 
                          className="trainer-group-header"
                          onClick={() => toggleTrainerGroup(groupName)}
                        >
                          <h4 className="group-title">
                            <i className={`fas fa-chevron-${collapsedTrainerGroups[groupName] ? 'right' : 'down'}`}></i>
                            {groupName} ({groupTrainers.length})
                          </h4>
                        </div>
                        {!collapsedTrainerGroups[groupName] && (
                          <div className="trainers-grid">
                            {groupTrainers.map(trainer => (
                              <div key={trainer.id} className="reference-option">
                                <div className="reference-image">
                                  {trainer.main_ref ? (
                                    <img
                                      src={trainer.main_ref}
                                      alt={trainer.name}
                                    />
                                  ) : (
                                    <div className="reference-placeholder">
                                      <i className="fas fa-user"></i>
                                    </div>
                                  )}
                                </div>
                                <div className="reference-info">
                                  <span className="reference-name">{trainer.name}</span>
                                  <span className="reference-details">
                                    {trainer.species1} {trainer.type1 && `• ${trainer.type1}`}
                                  </span>
                                </div>
                                <button
                                  className="add-reference-btn"
                                  onClick={() => handleAddReference('trainer', trainer.id)}
                                  title="Add as Reference"
                                >
                                  <i className="fas fa-plus"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === 'monsters' && (
                  <div className="monsters-section">
                    <div className="monsters-filters">
                      <div className="filter-row">
                        <div className="search-box">
                          <i className="fas fa-search"></i>
                          <input
                            type="text"
                            placeholder="Search by name, species, or type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <select
                          value={selectedTrainerFilter}
                          onChange={(e) => setSelectedTrainerFilter(e.target.value)}
                          className="trainer-filter"
                        >
                          <option value="">All Trainers</option>
                          {trainers.map(trainer => (
                            <option key={trainer.id} value={trainer.id}>
                              {trainer.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="monsters-grid">
                      {getFilteredMonsters().map(monster => (
                        <div key={monster.id} className="reference-option">
                          <div className="reference-image">
                            {monster.img_link ? (
                              <img
                                src={monster.img_link}
                                alt={monster.name}
                              />
                            ) : (
                              <div className="reference-placeholder">
                                <i className="fas fa-paw"></i>
                              </div>
                            )}
                          </div>
                          <div className="reference-info">
                            <span className="reference-name">{monster.name}</span>
                            <span className="reference-details">
                              {monster.species1} {monster.type1 && `• ${monster.type1}`}
                            </span>
                            <span className="reference-trainer">
                              Trainer: {trainers.find(t => t.id === monster.trainer_id)?.name || 'Unknown'}
                            </span>
                          </div>
                          <button
                            className="add-reference-btn"
                            onClick={() => handleAddReference('monster', monster.id)}
                            title="Add as Reference"
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="button primary"
              onClick={() => setIsReferenceModalOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Full Screen Reference Matrix Modal */}
      <Modal
        isOpen={isFullScreenReferenceOpen}
        onClose={() => setIsFullScreenReferenceOpen(false)}
        title={`Reference Matrix - ${selectedItem?.title}`}
        size="xlarge"
      >
        <div className="reference-matrix-fullscreen">
          {itemReferences.length === 0 ? (
            <div className="no-references-fullscreen">
              <i className="fas fa-image"></i>
              <h3>No References</h3>
              <p>No references have been added to this item yet.</p>
            </div>
          ) : (
            <div className="reference-matrix-grid">
              {itemReferences.map(ref => (
                <div
                  key={ref.id}
                  className="reference-matrix-item"
                  onClick={() => openImageViewer(ref)}
                >
                  <div className="reference-matrix-image">
                    {ref.reference_image ? (
                      <img
                        src={ref.reference_image}
                        alt={ref.reference_name}
                      />
                    ) : (
                      <div className="reference-placeholder large">
                        <i className={`fas fa-${ref.reference_type === 'trainer' ? 'user' : 'paw'}`}></i>
                      </div>
                    )}
                  </div>
                  <div className="reference-matrix-info">
                    <h4>{ref.reference_name}</h4>
                    <span className="reference-type-badge">{ref.reference_type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        title={selectedReference?.reference_name}
        size="large"
      >
        {selectedReference && (
          <div className="image-viewer">
            <div className="image-viewer-main">
              {selectedReference.reference_image ? (
                <img
                  src={selectedReference.reference_image}
                  alt={selectedReference.reference_name}
                  className="viewer-image"
                />
              ) : (
                <div className="viewer-placeholder">
                  <i className={`fas fa-${selectedReference.reference_type === 'trainer' ? 'user' : 'paw'}`}></i>
                  <p>No image available</p>
                </div>
              )}
            </div>
            <div className="image-viewer-info">
              <h3>{selectedReference.reference_name}</h3>
              <span className="reference-type-badge">{selectedReference.reference_type}</span>
            </div>
            <div className="image-viewer-actions">
              <button
                className="button primary"
                onClick={() => {
                  const detailPath = selectedReference.reference_type === 'trainer'
                    ? `/trainers/${selectedReference.reference_id}`
                    : `/monsters/${selectedReference.reference_id}`;
                  window.open(detailPath, '_blank');
                }}
              >
                <i className="fas fa-external-link-alt"></i> Visit Details
              </button>
              <button
                className="button secondary"
                onClick={() => setIsImageViewerOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PersonalArtTodoPage;
