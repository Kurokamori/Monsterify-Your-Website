import React, { useState, useEffect } from 'react';
import ImageUploader from './ImageUploader';
import api from '../../services/api';

const PersonForm = ({ person, factions, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    faction_id: '',
    name: '',
    alias: '',
    standing_requirement: 0,
    blurb: '',
    short_bio: '',
    long_bio: '',
    role: '',
    available_assistance: '',
    images: [],
    standing_reward: 50
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (person) {
      setFormData({
        faction_id: person.faction_id || '',
        name: person.name || '',
        alias: person.alias || '',
        standing_requirement: person.standing_requirement || 0,
        blurb: person.blurb || '',
        short_bio: person.short_bio || '',
        long_bio: person.long_bio || '',
        role: person.role || '',
        available_assistance: person.available_assistance || '',
        images: person.images || [],
        standing_reward: person.standing_reward || 50
      });
    }
  }, [person]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleImagesChange = (images) => {
    setFormData(prev => ({
      ...prev,
      images
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.faction_id || !formData.name || !formData.alias) {
      setError('Faction, name, and alias are required');
      return;
    }

    if (formData.images.length === 0) {
      setError('At least one image is required');
      return;
    }

    if (formData.images.length > 4) {
      setError('Maximum 4 images allowed');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData = {
        ...formData,
        standing_requirement: parseInt(formData.standing_requirement) || 0,
        standing_reward: parseInt(formData.standing_reward) || 50
      };

      if (person) {
        // Update existing person
        await api.put(`/admin/faction-people/${person.id}`, submitData);
      } else {
        // Create new person
        await api.post('/admin/faction-people', submitData);
      }

      onSave();
    } catch (err) {
      console.error('Error saving person:', err);
      setError(err.response?.data?.message || 'Failed to save person');
    } finally {
      setLoading(false);
    }
  };

  const selectedFaction = factions.find(f => f.id === parseInt(formData.faction_id));

  return (
    <div className="person-form-overlay">
      <div className="person-form-modal">
        <div className="modal-header">
          <h2>
            <i className="fas fa-user-edit"></i>
            {person ? 'Edit Person' : 'Create New Person'}
          </h2>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="person-form">
          <div className="form-sections">
            {/* Basic Information */}
            <div className="form-section">
              <h3>
                <i className="fas fa-info-circle"></i>
                Basic Information
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="faction_id">
                    Faction <span className="required">*</span>
                  </label>
                  <select
                    id="faction_id"
                    name="faction_id"
                    value={formData.faction_id}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select a faction</option>
                    {factions.map(faction => (
                      <option key={faction.id} value={faction.id}>
                        {faction.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="name">
                    Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Full name of the person"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="alias">
                    Alias <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="alias"
                    name="alias"
                    value={formData.alias}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Title, position, or attribute shown to non-met users"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Their role or position in the faction"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="standing_requirement">Standing Requirement</label>
                  <input
                    type="number"
                    id="standing_requirement"
                    name="standing_requirement"
                    value={formData.standing_requirement}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="0"
                  />
                  <small className="form-text">
                    Minimum absolute standing value required to meet this person
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="standing_reward">Standing Reward</label>
                  <input
                    type="number"
                    id="standing_reward"
                    name="standing_reward"
                    value={formData.standing_reward}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="50"
                  />
                  <small className="form-text">
                    Standing gained when meeting this person (sign matches trainer's current standing)
                  </small>
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className="form-section">
              <h3>
                <i className="fas fa-book"></i>
                Biography
              </h3>

              <div className="form-group">
                <label htmlFor="blurb">
                  TL;DR Blurb
                </label>
                <textarea
                  id="blurb"
                  name="blurb"
                  value={formData.blurb}
                  onChange={handleInputChange}
                  className="form-control"
                  rows={2}
                  placeholder="Short description shown in meeting modal and TL;DR tab"
                />
              </div>

              <div className="form-group">
                <label htmlFor="short_bio">Short Biography</label>
                <textarea
                  id="short_bio"
                  name="short_bio"
                  value={formData.short_bio}
                  onChange={handleInputChange}
                  className="form-control"
                  rows={3}
                  placeholder="Concise biography for the Short Bio tab"
                />
              </div>

              <div className="form-group">
                <label htmlFor="long_bio">Long Biography</label>
                <textarea
                  id="long_bio"
                  name="long_bio"
                  value={formData.long_bio}
                  onChange={handleInputChange}
                  className="form-control"
                  rows={5}
                  placeholder="Detailed biography for the Long Bio tab"
                />
              </div>

              <div className="form-group">
                <label htmlFor="available_assistance">Available Assistance</label>
                <textarea
                  id="available_assistance"
                  name="available_assistance"
                  value={formData.available_assistance}
                  onChange={handleInputChange}
                  className="form-control"
                  rows={3}
                  placeholder="What help or services this person can provide"
                />
              </div>
            </div>

            {/* Images */}
            <div className="form-section">
              <h3>
                <i className="fas fa-images"></i>
                Images (1-4 required)
              </h3>
              
              <ImageUploader
                images={formData.images}
                onChange={handleImagesChange}
                maxImages={4}
                required={true}
              />
              
              {selectedFaction && (
                <div className="faction-preview">
                  <h4>Faction Preview</h4>
                  <div 
                    className="faction-badge"
                    style={{ backgroundColor: selectedFaction.color }}
                  >
                    {selectedFaction.name}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  {person ? 'Update Person' : 'Create Person'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonForm;