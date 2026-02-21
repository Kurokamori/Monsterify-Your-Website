import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import artTodoService, {
  type ArtTodoList,
  type ArtTodoItem,
  type ArtTodoReference,
  type ArtTodoTrainer,
  type ArtTodoMonster,
  type ListFormData,
  type ItemFormData,
  type ReferenceType,
  type ItemStatus,
} from '../../services/artTodoService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Modal } from '../../components/common/Modal';
import { FormInput } from '../../components/common/FormInput';
import { FormSelect } from '../../components/common/FormSelect';
import { FormCheckbox } from '../../components/common/FormCheckbox';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// --- Constants ---

const EMPTY_LIST_FORM: ListFormData = { title: '', description: '' };

const EMPTY_ITEM_FORM: ItemFormData = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  due_date: '',
  is_persistent: false,
  steps_total: 0,
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

// --- Helpers ---

function statusBadgeClass(status: ItemStatus): string {
  if (status === 'in_progress') return 'badge info';
  if (status === 'completed') return 'badge completed';
  return 'badge warning';
}

function priorityBadgeClass(priority: string): string {
  if (priority === 'high') return 'badge danger';
  if (priority === 'medium') return 'badge warning';
  return 'badge neutral';
}

function formatStatus(status: string): string {
  return status.replace('_', ' ');
}

function refIcon(type: ReferenceType): string {
  return type === 'trainer' ? 'fa-solid fa-user' : 'fa-solid fa-paw';
}

// --- Component ---

export default function PersonalArtTodoPage() {
  useDocumentTitle('Art Todo');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Core data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lists, setLists] = useState<ArtTodoList[]>([]);
  const [selectedList, setSelectedList] = useState<ArtTodoList | null>(null);

  // Reference data
  const [trainers, setTrainers] = useState<ArtTodoTrainer[]>([]);
  const [monsters, setMonsters] = useState<ArtTodoMonster[]>([]);

  // List modal (create or edit)
  const [listModalMode, setListModalMode] = useState<'create' | 'edit' | null>(null);
  const [listForm, setListForm] = useState<ListFormData>(EMPTY_LIST_FORM);
  const [editingListId, setEditingListId] = useState<number | null>(null);

  // Item modal (create or edit)
  const [itemModalMode, setItemModalMode] = useState<'create' | 'edit' | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormData>(EMPTY_ITEM_FORM);
  const [editingItem, setEditingItem] = useState<ArtTodoItem | null>(null);

  // Reference modal
  const [refModalItem, setRefModalItem] = useState<ArtTodoItem | null>(null);
  const [itemReferences, setItemReferences] = useState<ArtTodoReference[]>([]);
  const [refTab, setRefTab] = useState<'trainers' | 'monsters'>('trainers');
  const [refSearchQuery, setRefSearchQuery] = useState('');
  const [refTrainerFilter, setRefTrainerFilter] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Full-screen reference / image viewer
  const [matrixItem, setMatrixItem] = useState<ArtTodoItem | null>(null);
  const [matrixRefs, setMatrixRefs] = useState<ArtTodoReference[]>([]);
  const [viewerRef, setViewerRef] = useState<ArtTodoReference | null>(null);

  // --- Data fetching ---

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      const data = await artTodoService.getLists();
      setLists(data);
    } catch {
      setError('Failed to load art todo lists. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchListWithItems = useCallback(async (listId: number) => {
    try {
      const data = await artTodoService.getList(listId);
      setSelectedList(data);
    } catch {
      setError('Failed to load list items. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    fetchLists();
    artTodoService.getTrainers().then(setTrainers).catch(() => {});
    artTodoService.getMonsters().then(setMonsters).catch(() => {});
  }, [isAuthenticated, navigate, fetchLists]);

  // Refresh both lists overview and the currently viewed list
  const refreshData = useCallback(async () => {
    await fetchLists();
    if (selectedList) {
      await fetchListWithItems(selectedList.id);
    }
  }, [fetchLists, fetchListWithItems, selectedList]);

  // --- List CRUD ---

  const openCreateList = () => {
    setListForm(EMPTY_LIST_FORM);
    setListModalMode('create');
  };

  const openEditList = (list: ArtTodoList) => {
    setListForm({ title: list.title, description: list.description || '' });
    setEditingListId(list.id);
    setListModalMode('edit');
  };

  const closeListModal = () => {
    setListModalMode(null);
    setEditingListId(null);
  };

  const handleListSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (listModalMode === 'create') {
        await artTodoService.createList(listForm);
      } else if (listModalMode === 'edit' && editingListId) {
        await artTodoService.updateList(editingListId, listForm);
      }
      closeListModal();
      await refreshData();
    } catch {
      setError(`Failed to ${listModalMode} list. Please try again.`);
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (!window.confirm('Are you sure you want to delete this list? All items in it will be deleted.')) return;
    try {
      await artTodoService.deleteList(listId);
      if (selectedList?.id === listId) setSelectedList(null);
      await fetchLists();
    } catch {
      setError('Failed to delete list. Please try again.');
    }
  };

  // --- Item CRUD ---

  const openCreateItem = (list: ArtTodoList) => {
    setSelectedList(list);
    setItemForm(EMPTY_ITEM_FORM);
    setItemModalMode('create');
  };

  const openEditItem = (item: ArtTodoItem) => {
    setEditingItem(item);
    setItemForm({
      title: item.title,
      description: item.description || '',
      status: item.status,
      priority: item.priority,
      due_date: item.due_date || '',
      is_persistent: item.is_persistent,
      steps_total: item.steps_total,
    });
    setItemModalMode('edit');
  };

  const closeItemModal = () => {
    setItemModalMode(null);
    setEditingItem(null);
  };

  const handleItemSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (itemModalMode === 'create' && selectedList) {
        await artTodoService.createItem(selectedList.id, itemForm);
      } else if (itemModalMode === 'edit' && editingItem) {
        await artTodoService.updateItem(editingItem.id, itemForm);
      }
      closeItemModal();
      await refreshData();
    } catch {
      setError(`Failed to ${itemModalMode} item. Please try again.`);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await artTodoService.deleteItem(itemId);
      await refreshData();
    } catch {
      setError('Failed to delete item. Please try again.');
    }
  };

  const handleIncrementStep = async (item: ArtTodoItem) => {
    if (item.steps_completed >= item.steps_total) return;
    try {
      const newSteps = item.steps_completed + 1;
      const newStatus: ItemStatus = newSteps >= item.steps_total ? 'completed' : item.status;
      await artTodoService.updateItem(item.id, {
        ...item,
        steps_completed: newSteps,
        status: newStatus,
      });
      await refreshData();
    } catch {
      setError('Failed to update step progress. Please try again.');
    }
  };

  // --- References ---

  const fetchItemRefs = useCallback(async (itemId: number) => {
    try {
      const data = await artTodoService.getItemReferences(itemId);
      return data;
    } catch {
      return [];
    }
  }, []);

  const openRefModal = async (item: ArtTodoItem) => {
    setRefModalItem(item);
    setRefTab('trainers');
    setRefSearchQuery('');
    setRefTrainerFilter('');
    const refs = await fetchItemRefs(item.id);
    setItemReferences(refs);
  };

  const handleAddRef = async (type: ReferenceType, id: number) => {
    if (!refModalItem) return;
    try {
      await artTodoService.addReference(refModalItem.id, type, id);
      const refs = await fetchItemRefs(refModalItem.id);
      setItemReferences(refs);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to add reference.');
    }
  };

  const handleRemoveRef = async (refId: number) => {
    if (!refModalItem) return;
    try {
      await artTodoService.removeReference(refId);
      const refs = await fetchItemRefs(refModalItem.id);
      setItemReferences(refs);
    } catch {
      setError('Failed to remove reference.');
    }
  };

  const openMatrix = async (item: ArtTodoItem) => {
    setMatrixItem(item);
    const refs = await fetchItemRefs(item.id);
    setMatrixRefs(refs);
  };

  // --- Filtered/grouped data ---

  const filteredMonsters = useMemo(() => {
    let result = monsters;
    if (refSearchQuery.trim()) {
      const q = refSearchQuery.toLowerCase();
      result = result.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.species1.toLowerCase().includes(q) ||
          (m.type1 && m.type1.toLowerCase().includes(q)),
      );
    }
    if (refTrainerFilter) {
      result = result.filter(m => m.trainer_id === Number(refTrainerFilter));
    }
    return result;
  }, [monsters, refSearchQuery, refTrainerFilter]);

  const groupedTrainers = useMemo(() => {
    const groups: Record<string, ArtTodoTrainer[]> = {};
    for (const t of trainers) {
      const key = t.species1 || 'Other';
      (groups[key] ??= []).push(t);
    }
    return groups;
  }, [trainers]);

  const toggleGroup = (name: string) => {
    setCollapsedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // --- Render guards ---

  if (loading) return <LoadingSpinner message="Loading art todo lists..." />;

  if (error && lists.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchLists} />;
  }

  // --- Render ---

  return (
    <div className="art-todo-page">
      {/* Header */}
      <div className="art-todo-header">
        <h1>My Art To-Do Lists</h1>
        <button className="button primary" onClick={openCreateList}>
          <i className="fa-solid fa-plus" /> Create New List
        </button>
      </div>

      {/* Inline error */}
      {error && (
        <div className="alert error" style={{ marginBottom: 'var(--spacing-medium)' }}>
          <i className="fa-solid fa-exclamation-circle" /> {error}
          <button className="button close no-flex" onClick={() => setError(null)} aria-label="Dismiss">
            &times;
          </button>
        </div>
      )}

      {/* Empty state */}
      {lists.length === 0 ? (
        <div className="art-todo-empty">
          <div className="art-todo-empty-icon">
            <i className="fa-solid fa-palette" />
          </div>
          <h2>No Art Todo Lists Yet</h2>
          <p>Create your first art todo list to start organizing your creative projects!</p>
          <button className="button primary lg" onClick={openCreateList}>
            Create Your First List
          </button>
        </div>
      ) : (
        /* Lists grid */
        <div className="art-todo-lists">
          {lists.map(list => (
            <div key={list.id} className="art-todo-list-card">
              <div className="art-todo-list-header">
                <h3 className="art-todo-list-title">{list.title}</h3>
                <div className="art-todo-list-actions">
                  <button className="button secondary icon sm no-flex" onClick={() => openEditList(list)} title="Edit List">
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button className="button danger icon sm no-flex" onClick={() => handleDeleteList(list.id)} title="Delete List">
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
              </div>

              {list.description && <p className="art-todo-list-description">{list.description}</p>}

              <div className="art-todo-list-stats">
                <span className="art-todo-stat">
                  <i className="fa-solid fa-list-check" /> {list.item_count} items
                </span>
                <span className="art-todo-stat">
                  <i className="fa-solid fa-check-circle" /> {list.completed_count} completed
                </span>
              </div>

              <div className="art-todo-list-footer">
                <button className="button primary sm" onClick={() => openCreateItem(list)}>
                  <i className="fa-solid fa-plus" /> Add Item
                </button>
                <button className="button secondary sm" onClick={() => fetchListWithItems(list.id)}>
                  <i className="fa-solid fa-eye" /> View Items
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected list items view */}
      {selectedList && !itemModalMode && (
        <div className="art-todo-items-section">
          <div className="art-todo-items-header">
            <h2>{selectedList.title} - Items</h2>
            <div className="art-todo-items-actions">
              <button className="button primary sm" onClick={() => openCreateItem(selectedList)}>
                <i className="fa-solid fa-plus" /> Add Item
              </button>
              <button className="button secondary" onClick={() => setSelectedList(null)}>
                <i className="fa-solid fa-arrow-left" /> Back to Lists
              </button>
            </div>
          </div>

          {selectedList.items && selectedList.items.length > 0 ? (
            <div className="art-todo-items-grid">
              {selectedList.items.map(item => (
                <div key={item.id} className={`art-todo-item-card status-${item.status} priority-${item.priority}`}>
                  <div className="art-todo-item-header">
                    <h4 className="art-todo-item-title">{item.title}</h4>
                    <div className="art-todo-item-actions">
                      <button className="button info icon sm no-flex" onClick={() => openRefModal(item)} title="Manage References">
                        <i className="fa-solid fa-image" />
                      </button>
                      <button className="button secondary icon sm" onClick={() => openEditItem(item)} title="Edit Item">
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button className="button danger icon sm no-flex" onClick={() => handleDeleteItem(item.id)} title="Delete Item">
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </div>

                  {item.description && <p className="art-todo-item-description">{item.description}</p>}

                  <div className="art-todo-item-meta">
                    <span className={statusBadgeClass(item.status)}>{formatStatus(item.status)}</span>
                    <span className={priorityBadgeClass(item.priority)}>{item.priority} priority</span>
                  </div>

                  {item.due_date && (
                    <div className="art-todo-item-due">
                      <i className="fa-solid fa-calendar-alt" />
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </div>
                  )}

                  {item.steps_total > 0 && (
                    <div className="art-todo-progress">
                      <div className="art-todo-progress-header">
                        <span className="art-todo-progress-text">
                          {item.steps_completed}/{item.steps_total} steps
                        </span>
                        {item.steps_completed < item.steps_total && (
                          <button
                            className="button primary icon sm"
                            onClick={e => { e.stopPropagation(); handleIncrementStep(item); }}
                            title="Complete next step"
                          >
                            <i className="fa-solid fa-plus" />
                          </button>
                        )}
                      </div>
                      <div className="art-todo-progress-bar">
                        <div
                          className={`art-todo-progress-fill${item.steps_completed >= item.steps_total ? ' complete' : ''}`}
                          style={{ width: `${(item.steps_completed / item.steps_total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {item.references && item.references.length > 0 && (
                    <div className="art-todo-references">
                      <div className="art-todo-references-header">
                        <span className="art-todo-references-label">References</span>
                        <button
                          className="button secondary icon sm"
                          onClick={e => { e.stopPropagation(); openMatrix(item); }}
                          title="View full reference matrix"
                        >
                          <i className="fa-solid fa-expand" />
                        </button>
                      </div>
                      <div className="art-todo-thumbnails">
                        {item.references.slice(0, 3).map(ref => (
                          <div
                            key={ref.id}
                            className="art-todo-thumbnail clickable"
                            onClick={e => { e.stopPropagation(); setViewerRef(ref); }}
                            title={`View ${ref.reference_type}: ${ref.reference_name}`}
                          >
                            {ref.reference_image ? (
                              <img src={ref.reference_image} alt={ref.reference_name} />
                            ) : (
                              <div className="art-todo-thumbnail-placeholder">
                                <i className={refIcon(ref.reference_type)} />
                              </div>
                            )}
                          </div>
                        ))}
                        {item.references.length > 3 && (
                          <div
                            className="art-todo-thumbnail-more"
                            onClick={e => { e.stopPropagation(); openMatrix(item); }}
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
          ) : (
            <div className="art-todo-empty">
              <p>No items in this list yet. Add one to get started!</p>
            </div>
          )}
        </div>
      )}

      {/* ===== List Modal (Create / Edit) ===== */}
      <Modal
        isOpen={listModalMode !== null}
        onClose={closeListModal}
        title={listModalMode === 'create' ? 'Create New Art Todo List' : 'Edit Art Todo List'}
      >
        <form onSubmit={handleListSubmit}>
          <FormInput
            label="Title"
            name="list-title"
            value={listForm.title}
            onChange={e => setListForm({ ...listForm, title: e.target.value })}
            required
            placeholder="Enter list title"
          />
          <div className="form-group">
            <label htmlFor="list-description" className="form-label">Description</label>
            <textarea
              id="list-description"
              className="input"
              value={listForm.description}
              onChange={e => setListForm({ ...listForm, description: e.target.value })}
              placeholder="Enter list description (optional)"
              rows={3}
            />
          </div>
          <div className="art-todo-modal-actions">
            <button type="button" className="button secondary" onClick={closeListModal}>Cancel</button>
            <button type="submit" className="button primary">
              {listModalMode === 'create' ? 'Create List' : 'Update List'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===== Item Modal (Create / Edit) ===== */}
      <Modal
        isOpen={itemModalMode !== null}
        onClose={closeItemModal}
        title={itemModalMode === 'create' ? 'Create New Art Todo Item' : 'Edit Art Todo Item'}
      >
        <form onSubmit={handleItemSubmit}>
          <FormInput
            label="Title"
            name="item-title"
            value={itemForm.title}
            onChange={e => setItemForm({ ...itemForm, title: e.target.value })}
            required
            placeholder="Enter item title"
          />
          <div className="form-group">
            <label htmlFor="item-description" className="form-label">Description</label>
            <textarea
              id="item-description"
              className="input"
              value={itemForm.description}
              onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
              placeholder="Enter item description (optional)"
              rows={3}
            />
          </div>

          <div className="form-row">
            <FormSelect
              label="Status"
              name="item-status"
              options={STATUS_OPTIONS}
              value={itemForm.status}
              onChange={e => setItemForm({ ...itemForm, status: e.target.value as ItemStatus })}
            />
            <FormSelect
              label="Priority"
              name="item-priority"
              options={PRIORITY_OPTIONS}
              value={itemForm.priority}
              onChange={e => setItemForm({ ...itemForm, priority: e.target.value as ItemFormData['priority'] })}
            />
          </div>

          <div className="form-row">
            <FormInput
              label="Due Date"
              name="item-due-date"
              type="date"
              value={itemForm.due_date}
              onChange={e => setItemForm({ ...itemForm, due_date: e.target.value })}
            />
            <FormInput
              label="Total Steps"
              name="item-steps"
              type="number"
              value={String(itemForm.steps_total)}
              onChange={e => setItemForm({ ...itemForm, steps_total: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>

          <FormCheckbox
            label="Persistent item (won't be deleted when completed)"
            name="item-persistent"
            checked={itemForm.is_persistent}
            onChange={e => setItemForm({ ...itemForm, is_persistent: e.target.checked })}
          />

          <div className="art-todo-modal-actions">
            <button type="button" className="button secondary" onClick={closeItemModal}>Cancel</button>
            <button type="submit" className="button primary">
              {itemModalMode === 'create' ? 'Create Item' : 'Update Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===== Reference Management Modal ===== */}
      <Modal
        isOpen={refModalItem !== null}
        onClose={() => setRefModalItem(null)}
        title={`Manage References - ${refModalItem?.title}`}
        size="large"
      >
        <div className="art-todo-ref-management">
          {/* Current references */}
          <div className="art-todo-current-refs">
            <h3>Current References</h3>
            {itemReferences.length === 0 ? (
              <p className="art-todo-no-refs">No references added yet.</p>
            ) : (
              <div className="art-todo-ref-grid">
                {itemReferences.map(ref => (
                  <div key={ref.id} className="art-todo-ref-item">
                    <div className="art-todo-ref-image">
                      {ref.reference_image ? (
                        <img src={ref.reference_image} alt={ref.reference_name} />
                      ) : (
                        <div className="art-todo-ref-placeholder">
                          <i className={refIcon(ref.reference_type)} />
                        </div>
                      )}
                    </div>
                    <div className="art-todo-ref-info">
                      <span className="art-todo-ref-name">{ref.reference_name}</span>
                      <span className="art-todo-ref-type">{ref.reference_type}</span>
                    </div>
                    <button className="button danger icon sm no-flex" onClick={() => handleRemoveRef(ref.id)} title="Remove">
                      <i className="fa-solid fa-times" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add references */}
          <div className="art-todo-add-refs">
            <h3>Add References</h3>
            <div className="art-todo-ref-tabs">
              <div className="art-todo-tab-buttons">
                <button
                  className={`button tab${refTab === 'trainers' ? ' active' : ''}`}
                  onClick={() => setRefTab('trainers')}
                >
                  <i className="fa-solid fa-user" /> Trainers
                </button>
                <button
                  className={`button tab${refTab === 'monsters' ? ' active' : ''}`}
                  onClick={() => setRefTab('monsters')}
                >
                  <i className="fa-solid fa-paw" /> Monsters
                </button>
              </div>

              <div className="art-todo-tab-content">
                {/* Trainers tab */}
                {refTab === 'trainers' && (
                  <div className="art-todo-trainer-groups">
                    {Object.entries(groupedTrainers).map(([groupName, groupTrainers]) => (
                      <div key={groupName} className="art-todo-trainer-group">
                        <div className="art-todo-group-header" onClick={() => toggleGroup(groupName)}>
                          <h4 className="art-todo-group-title">
                            <i className={`fa-solid fa-chevron-${collapsedGroups[groupName] ? 'right' : 'down'}`} />
                            {groupName}
                          </h4>
                          <span className="art-todo-group-count">{groupTrainers.length}</span>
                        </div>
                        {!collapsedGroups[groupName] && (
                          <div className="art-todo-group-items">
                            {groupTrainers.map(trainer => (
                              <div key={trainer.id} className="art-todo-selectable-item">
                                <div className="art-todo-selectable-image">
                                  {trainer.main_ref ? (
                                    <img src={trainer.main_ref} alt={trainer.name} />
                                  ) : (
                                    <div className="art-todo-ref-placeholder">
                                      <i className="fa-solid fa-user" />
                                    </div>
                                  )}
                                </div>
                                <div className="art-todo-selectable-info">
                                  <span className="art-todo-selectable-name">{trainer.name}</span>
                                  <span className="art-todo-selectable-details">
                                    {trainer.species1} {trainer.type1 && `\u2022 ${trainer.type1}`}
                                  </span>
                                </div>
                                <button
                                  className="button primary icon sm"
                                  onClick={() => handleAddRef('trainer', trainer.id)}
                                  title="Add as Reference"
                                >
                                  <i className="fa-solid fa-plus" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Monsters tab */}
                {refTab === 'monsters' && (
                  <div>
                    <div className="art-todo-monster-filters">
                      <div className="art-todo-search-box">
                        <i className="fa-solid fa-search" />
                        <input
                          type="text"
                          className="input"
                          placeholder="Search by name, species, or type..."
                          value={refSearchQuery}
                          onChange={e => setRefSearchQuery(e.target.value)}
                        />
                      </div>
                      <select
                        className="select art-todo-trainer-filter"
                        value={refTrainerFilter}
                        onChange={e => setRefTrainerFilter(e.target.value)}
                      >
                        <option value="">All Trainers</option>
                        {trainers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="art-todo-monster-grid">
                      {filteredMonsters.map(monster => (
                        <div key={monster.id} className="art-todo-selectable-item">
                          <div className="art-todo-selectable-image">
                            {monster.img_link ? (
                              <img src={monster.img_link} alt={monster.name} />
                            ) : (
                              <div className="art-todo-ref-placeholder">
                                <i className="fa-solid fa-paw" />
                              </div>
                            )}
                          </div>
                          <div className="art-todo-selectable-info">
                            <span className="art-todo-selectable-name">{monster.name}</span>
                            <span className="art-todo-selectable-details">
                              {monster.species1} {monster.type1 && `\u2022 ${monster.type1}`}
                            </span>
                            <span className="art-todo-selectable-trainer">
                              {trainers.find(t => t.id === monster.trainer_id)?.name || 'Unknown'}
                            </span>
                          </div>
                          <button
                            className="button primary icon sm"
                            onClick={() => handleAddRef('monster', monster.id)}
                            title="Add as Reference"
                          >
                            <i className="fa-solid fa-plus" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="art-todo-modal-actions">
            <button className="button primary" onClick={() => setRefModalItem(null)}>Done</button>
          </div>
        </div>
      </Modal>

      {/* ===== Full-Screen Reference Matrix ===== */}
      <Modal
        isOpen={matrixItem !== null}
        onClose={() => setMatrixItem(null)}
        title={`Reference Matrix - ${matrixItem?.title}`}
        size="xlarge"
      >
        <div className="art-todo-ref-matrix">
          {matrixRefs.length === 0 ? (
            <div className="art-todo-no-refs-large">
              <i className="fa-solid fa-image" />
              <h3>No References</h3>
              <p>No references have been added to this item yet.</p>
            </div>
          ) : (
            <div className="art-todo-matrix-grid">
              {matrixRefs.map(ref => (
                <div key={ref.id} className="art-todo-matrix-item" onClick={() => setViewerRef(ref)}>
                  <div className="art-todo-matrix-image">
                    {ref.reference_image ? (
                      <img src={ref.reference_image} alt={ref.reference_name} />
                    ) : (
                      <div className="art-todo-matrix-placeholder">
                        <i className={refIcon(ref.reference_type)} />
                      </div>
                    )}
                  </div>
                  <div className="art-todo-matrix-info">
                    <h4>{ref.reference_name}</h4>
                    <span className="art-todo-matrix-badge">{ref.reference_type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ===== Image Viewer Modal ===== */}
      <Modal
        isOpen={viewerRef !== null}
        onClose={() => setViewerRef(null)}
        title={viewerRef?.reference_name}
        size="large"
      >
        {viewerRef && (
          <div className="art-todo-image-viewer">
            <div className="art-todo-viewer-main">
              {viewerRef.reference_image ? (
                <img src={viewerRef.reference_image} alt={viewerRef.reference_name} className="art-todo-viewer-image" />
              ) : (
                <div className="art-todo-viewer-placeholder">
                  <i className={refIcon(viewerRef.reference_type)} />
                  <p>No image available</p>
                </div>
              )}
            </div>
            <div className="art-todo-viewer-info">
              <h3>{viewerRef.reference_name}</h3>
              <span className="art-todo-matrix-badge">{viewerRef.reference_type}</span>
            </div>
            <div className="art-todo-viewer-actions">
              <button
                className="button primary"
                onClick={() => {
                  const path = viewerRef.reference_type === 'trainer'
                    ? `/trainers/${viewerRef.reference_id}`
                    : `/monsters/${viewerRef.reference_id}`;
                  window.open(path, '_blank');
                }}
              >
                <i className="fa-solid fa-up-right-from-square" /> Visit Details
              </button>
              <button className="button secondary" onClick={() => setViewerRef(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
