import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Modal from '../../components/common/Modal';

const BossAdmin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bosses, setBosses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBoss, setSelectedBoss] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    total_hp: '',
    month: '',
    year: '',
    status: 'active',
    reward_monster_data: {
      name: '',
      species: [],
      types: [],
      attribute: ''
    },
    grunt_monster_data: {
      name: '',
      species: [],
      types: [],
      attribute: ''
    }
  });

  useEffect(() => {
    fetchBosses();
  }, []);

  useEffect(() => {
    // Check if we should open the create modal based on the route
    if (location.pathname.includes('/add')) {
      handleCreate();
    }
  }, [location.pathname]);

  const fetchBosses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bosses/admin/all');
      if (response.data.success) {
        setBosses(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching bosses:', err);
      setError('Failed to load bosses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      total_hp: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      status: 'active',
      reward_monster_data: {
        name: '',
        species: [],
        types: [],
        attribute: ''
      },
      grunt_monster_data: {
        name: '',
        species: [],
        types: [],
        attribute: ''
      }
    });
    setShowCreateModal(true);
    // Update URL to reflect the modal state
    if (!location.pathname.includes('/add')) {
      navigate('/admin/bosses/add', { replace: true });
    }
  };

  const handleEdit = (boss) => {
    setSelectedBoss(boss);
    setFormData({
      name: boss.name || '',
      description: boss.description || '',
      image_url: boss.image_url || '',
      total_hp: boss.total_hp || '',
      month: boss.month || '',
      year: boss.year || '',
      status: boss.status || 'active',
      reward_monster_data: boss.reward_monster_data || {
        name: '',
        species: [],
        types: [],
        attribute: ''
      },
      grunt_monster_data: boss.grunt_monster_data || {
        name: '',
        species: [],
        types: [],
        attribute: ''
      }
    });
    setShowEditModal(true);
  };

  const handleDelete = (boss) => {
    setSelectedBoss(boss);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        total_hp: parseInt(formData.total_hp),
        month: parseInt(formData.month),
        year: parseInt(formData.year)
      };

      if (selectedBoss) {
        // Update existing boss
        await api.put(`/bosses/admin/${selectedBoss.id}`, {
          ...payload,
          current_hp: selectedBoss.current_hp
        });
      } else {
        // Create new boss
        await api.post('/bosses/admin/create', payload);
      }

      await fetchBosses();
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedBoss(null);
      // Navigate back to the main bosses page
      navigate('/admin/bosses', { replace: true });
    } catch (err) {
      console.error('Error saving boss:', err);
      setError('Failed to save boss');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await api.delete(`/bosses/admin/${selectedBoss.id}`);
      await fetchBosses();
      setShowDeleteModal(false);
      setSelectedBoss(null);
    } catch (err) {
      console.error('Error deleting boss:', err);
      setError('Failed to delete boss');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateMonsterData = (monsterType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [monsterType]: {
        ...prev[monsterType],
        [field]: value
      }
    }));
  };

  const addSpecies = (monsterType) => {
    setFormData(prev => ({
      ...prev,
      [monsterType]: {
        ...prev[monsterType],
        species: [...prev[monsterType].species, '']
      }
    }));
  };

  const updateSpecies = (monsterType, index, value) => {
    setFormData(prev => ({
      ...prev,
      [monsterType]: {
        ...prev[monsterType],
        species: prev[monsterType].species.map((s, i) => i === index ? value : s)
      }
    }));
  };

  const removeSpecies = (monsterType, index) => {
    setFormData(prev => ({
      ...prev,
      [monsterType]: {
        ...prev[monsterType],
        species: prev[monsterType].species.filter((_, i) => i !== index)
      }
    }));
  };

  const addType = (monsterType) => {
    setFormData(prev => ({
      ...prev,
      [monsterType]: {
        ...prev[monsterType],
        types: [...prev[monsterType].types, '']
      }
    }));
  };

  const updateType = (monsterType, index, value) => {
    setFormData(prev => ({
      ...prev,
      [monsterType]: {
        ...prev[monsterType],
        types: prev[monsterType].types.map((t, i) => i === index ? value : t)
      }
    }));
  };

  const removeType = (monsterType, index) => {
    setFormData(prev => ({
      ...prev,
      [monsterType]: {
        ...prev[monsterType],
        types: prev[monsterType].types.filter((_, i) => i !== index)
      }
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && !showCreateModal && !showEditModal) {
    return <LoadingSpinner message="Loading bosses..." />;
  }

  if (error && !showCreateModal && !showEditModal) {
    return <ErrorMessage message={error} onRetry={fetchBosses} />;
  }

  return (
    <div className="admin-page">
      <div className="option-row">
        <h1>Boss Management</h1>
        <button
          className="button primary"
          onClick={handleCreate}
        >
          <i className="fas fa-plus"></i> Create New Boss
        </button>
      </div>

      <div className="admin-content">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Month/Year</th>
                <th>Health</th>
                <th>Status</th>
                <th>Participants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bosses.map((boss) => (
                <tr key={boss.id}>
                  <td>
                    {boss.image_url ? (
                      <img 
                        src={boss.image_url} 
                        alt={boss.name}
                        className="admin-boss-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default_boss.png';
                        }}
                      />
                    ) : (
                      <div className="admin-boss-placeholder">
                        <i className="fas fa-dragon"></i>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="boss-name-cell">
                      <strong>{boss.name}</strong>
                      {boss.description && (
                        <div className="boss-description-preview">
                          {boss.description.length > 50 
                            ? boss.description.substring(0, 50) + '...'
                            : boss.description
                          }
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{boss.month}/{boss.year}</td>
                  <td>
                    <div className="health-display">
                      {boss.current_hp?.toLocaleString() || 0} / {boss.total_hp?.toLocaleString() || 0}
                      <div className="health-bar-small">
                        <div 
                          className="health-fill"
                          style={{
                            width: `${((boss.current_hp || 0) / (boss.total_hp || 1)) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge${boss.status}`}>
                      {boss.status}
                    </span>
                  </td>
                  <td>{boss.total_participants || 0}</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="button secondary sm"
                        onClick={() => handleEdit(boss)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="button danger sm"
                        onClick={() => handleDelete(boss)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                      <Link
                        to={`/boss`}
                        className="button info sm"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {bosses.length === 0 && (
            <div className="no-data">
              <i className="fas fa-dragon"></i>
              <p>No bosses created yet. Create your first boss!</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Boss Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedBoss(null);
          navigate('/admin/bosses', { replace: true });
        }}
        title={selectedBoss ? 'Edit Boss' : 'Create New Boss'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="boss-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Boss Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => updateFormData('image_url', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Total Health *</label>
              <input
                type="number"
                value={formData.total_hp}
                onChange={(e) => updateFormData('total_hp', e.target.value)}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => updateFormData('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="defeated">Defeated</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>

            <div className="form-group">
              <label>Month *</label>
              <select
                value={formData.month}
                onChange={(e) => updateFormData('month', e.target.value)}
                required
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Year *</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => updateFormData('year', e.target.value)}
                required
                min="2020"
                max="2030"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              rows="3"
            />
          </div>

          {/* Reward Monster Section */}
          <div className="monster-section">
            <h3>🏆 Reward Monster (1st Place)</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Monster Name</label>
                <input
                  type="text"
                  value={formData.reward_monster_data.name}
                  onChange={(e) => updateMonsterData('reward_monster_data', 'name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Attribute</label>
                <input
                  type="text"
                  value={formData.reward_monster_data.attribute}
                  onChange={(e) => updateMonsterData('reward_monster_data', 'attribute', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Species (up to 3)</label>
              {formData.reward_monster_data.species.map((species, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={species}
                    onChange={(e) => updateSpecies('reward_monster_data', index, e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => removeSpecies('reward_monster_data', index)}
                    className="button danger"
                  >
                    ×
                  </button>
                </div>
              ))}
              {formData.reward_monster_data.species.length < 3 && (
                <button 
                  type="button" 
                  onClick={() => addSpecies('reward_monster_data')}
                  className="button primary"
                >
                  + Add Species
                </button>
              )}
            </div>

            <div className="form-group">
              <label>Types (up to 5)</label>
              {formData.reward_monster_data.types.map((type, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => updateType('reward_monster_data', index, e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => removeType('reward_monster_data', index)}
                    className="button danger"
                  >
                    ×
                  </button>
                </div>
              ))}
              {formData.reward_monster_data.types.length < 5 && (
                <button 
                  type="button" 
                  onClick={() => addType('reward_monster_data')}
                  className="button primary"
                >
                  + Add Type
                </button>
              )}
            </div>
          </div>

          {/* Grunt Monster Section */}
          <div className="monster-section">
            <h3>🎁 Grunt Monster (All Others)</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Monster Name</label>
                <input
                  type="text"
                  value={formData.grunt_monster_data.name}
                  onChange={(e) => updateMonsterData('grunt_monster_data', 'name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Attribute</label>
                <input
                  type="text"
                  value={formData.grunt_monster_data.attribute}
                  onChange={(e) => updateMonsterData('grunt_monster_data', 'attribute', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Species (up to 3)</label>
              {formData.grunt_monster_data.species.map((species, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={species}
                    onChange={(e) => updateSpecies('grunt_monster_data', index, e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => removeSpecies('grunt_monster_data', index)}
                    className="button danger"
                  >
                    ×
                  </button>
                </div>
              ))}
              {formData.grunt_monster_data.species.length < 3 && (
                <button 
                  type="button" 
                  onClick={() => addSpecies('grunt_monster_data')}
                  className="button primary"
                >
                  + Add Species
                </button>
              )}
            </div>

            <div className="form-group">
              <label>Types (up to 5)</label>
              {formData.grunt_monster_data.types.map((type, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={type}
                    onChange={(e) => updateType('grunt_monster_data', index, e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => removeType('grunt_monster_data', index)}
                    className="button danger"
                  >
                    ×
                  </button>
                </div>
              ))}
              {formData.grunt_monster_data.types.length < 5 && (
                <button 
                  type="button" 
                  onClick={() => addType('grunt_monster_data')}
                  className="button primary"
                >
                  + Add Type
                </button>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedBoss(null);
                navigate('/admin/bosses', { replace: true });
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (selectedBoss ? 'Update Boss' : 'Create Boss')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBoss(null);
        }}
        title="Delete Boss"
      >
        <div className="guide-content">
          <p>Are you sure you want to delete "{selectedBoss?.name}"?</p>
          <p className="warning">This action cannot be undone and will also delete all related damage data.</p>
          
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedBoss(null);
              }}
            >
              Cancel
            </button>
            <button
              className="button danger"
              onClick={handleDeleteConfirm}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Boss'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BossAdmin;