import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import adminApi from '../../../services/adminApi';
import ErrorMessage from '../../common/ErrorMessage';

const TrainerCreate = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    level: 1,
    currency_amount: 500,
    total_earned_currency: 500,
    player_user_id: '', // This will need to be set to a valid user ID
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Validate required fields
      if (!formData.name) {
        setError('Trainer name is required');
        setSaving(false);
        return;
      }

      if (!formData.player_user_id) {
        setError('User ID is required');
        setSaving(false);
        return;
      }

      const response = await adminApi.createTrainer(formData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create trainer');
      }

      const newTrainerId = response.data.data.id;
      setSaving(false);
      navigate(`/admin/dashboard/trainers/${newTrainerId}`);
    } catch (err) {
      console.error('Error creating trainer:', err);
      setError('Failed to create trainer. Please try again later.');
      setSaving(false);
    }
  };

  return (
    <div className="trainer-create-container">
      <div className="trainer-create-header">
        <h1>Create New Trainer</h1>
        <div className="trainer-create-actions">
          <Link to="/admin/dashboard/trainers" className="trainer-create-btn cancel">
            <i className="fas fa-times"></i> Cancel
          </Link>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="trainer-create-form">
        <div className="trainer-create-tabs">
          <button
            type="button"
            className={`trainer-create-tab ${activeSection === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveSection('basic')}
          >
            <i className="fas fa-user"></i> Basic Info
          </button>
          <button
            type="button"
            className={`trainer-create-tab ${activeSection === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveSection('personal')}
          >
            <i className="fas fa-address-card"></i> Personal
          </button>
          <button
            type="button"
            className={`trainer-create-tab ${activeSection === 'species' ? 'active' : ''}`}
            onClick={() => setActiveSection('species')}
          >
            <i className="fas fa-dna"></i> Species & Types
          </button>
          <button
            type="button"
            className={`trainer-create-tab ${activeSection === 'bio' ? 'active' : ''}`}
            onClick={() => setActiveSection('bio')}
          >
            <i className="fas fa-book"></i> Biography
          </button>
        </div>

        <div className="trainer-create-content">
          {activeSection === 'basic' && (
            <div className="create-section">
              <h2>Basic Information</h2>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="player_user_id">User ID *</label>
                  <input
                    type="text"
                    id="player_user_id"
                    name="player_user_id"
                    value={formData.player_user_id || ''}
                    onChange={handleChange}
                    required
                    placeholder="Enter user ID or Discord ID"
                  />
                  <small className="form-help">The ID of the user who owns this trainer</small>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    required
                    placeholder="Trainer name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="nickname">Nickname</label>
                  <input
                    type="text"
                    id="nickname"
                    name="nickname"
                    value={formData.nickname || ''}
                    onChange={handleChange}
                    placeholder="Optional nickname"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="level">Level</label>
                  <input
                    type="number"
                    id="level"
                    name="level"
                    min="1"
                    max="100"
                    value={formData.level || 1}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="faction">Faction</label>
                  <select
                    id="faction"
                    name="faction"
                    value={formData.faction || ''}
                    onChange={handleChange}
                  >
                    <option value="">Select Faction</option>
                    <option value="Nyakuza">Nyakuza</option>
                    <option value="Digital Dawn">Digital Dawn</option>
                    <option value="Ranchers">Ranchers</option>
                    <option value="Tamers">Tamers</option>
                    <option value="Rangers">Rangers</option>
                    <option value="League">The League</option>
                    <option value="Koa's Laboratory">Koa's Laboratory</option>
                    <option value="Project Obsidian">Project Obsidian</option>
                    <option value="Spirit Keepers">Spirit Keepers</option>
                    <option value="The Tribes">The Tribes</option>
                    <option value="Twilight Order">Twilight Order</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    placeholder="e.g. Novice Explorer"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="currency_amount">Starting Currency</label>
                  <input
                    type="number"
                    id="currency_amount"
                    name="currency_amount"
                    min="0"
                    value={formData.currency_amount || 500}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="main_ref">Main Reference Image URL</label>
                  <input
                    type="text"
                    id="main_ref"
                    name="main_ref"
                    value={formData.main_ref || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'personal' && (
            <div className="create-section">
              <h2>Personal Information</h2>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <input
                    type="text"
                    id="gender"
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    placeholder="Gender"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pronouns">Pronouns</label>
                  <input
                    type="text"
                    id="pronouns"
                    name="pronouns"
                    value={formData.pronouns || ''}
                    onChange={handleChange}
                    placeholder="e.g. She/Her, He/Him, They/Them"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sexuality">Sexuality</label>
                  <input
                    type="text"
                    id="sexuality"
                    name="sexuality"
                    value={formData.sexuality || ''}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="age">Age</label>
                  <input
                    type="text"
                    id="age"
                    name="age"
                    value={formData.age || ''}
                    onChange={handleChange}
                    placeholder="Age"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="height">Height</label>
                  <input
                    type="text"
                    id="height"
                    name="height"
                    value={formData.height || ''}
                    onChange={handleChange}
                    placeholder="Height"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="weight">Weight</label>
                  <input
                    type="text"
                    id="weight"
                    name="weight"
                    value={formData.weight || ''}
                    onChange={handleChange}
                    placeholder="Weight"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="theme">Theme</label>
                  <input
                    type="text"
                    id="theme"
                    name="theme"
                    value={formData.theme || ''}
                    onChange={handleChange}
                    placeholder="Theme"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="occupation">Occupation</label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    value={formData.occupation || ''}
                    onChange={handleChange}
                    placeholder="Occupation"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="birthplace">Birthplace</label>
                  <input
                    type="text"
                    id="birthplace"
                    name="birthplace"
                    value={formData.birthplace || ''}
                    onChange={handleChange}
                    placeholder="Place of birth"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="residence">Residence</label>
                  <input
                    type="text"
                    id="residence"
                    name="residence"
                    value={formData.residence || ''}
                    onChange={handleChange}
                    placeholder="Current residence"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'species' && (
            <div className="create-section">
              <h2>Species & Types</h2>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="species1">Species 1</label>
                  <input
                    type="text"
                    id="species1"
                    name="species1"
                    value={formData.species1 || ''}
                    onChange={handleChange}
                    placeholder="Primary species"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="species2">Species 2</label>
                  <input
                    type="text"
                    id="species2"
                    name="species2"
                    value={formData.species2 || ''}
                    onChange={handleChange}
                    placeholder="Secondary species (optional)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="species3">Species 3</label>
                  <input
                    type="text"
                    id="species3"
                    name="species3"
                    value={formData.species3 || ''}
                    onChange={handleChange}
                    placeholder="Tertiary species (optional)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type1">Type 1</label>
                  <input
                    type="text"
                    id="type1"
                    name="type1"
                    value={formData.type1 || ''}
                    onChange={handleChange}
                    placeholder="Primary type"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type2">Type 2</label>
                  <input
                    type="text"
                    id="type2"
                    name="type2"
                    value={formData.type2 || ''}
                    onChange={handleChange}
                    placeholder="Secondary type (optional)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type3">Type 3</label>
                  <input
                    type="text"
                    id="type3"
                    name="type3"
                    value={formData.type3 || ''}
                    onChange={handleChange}
                    placeholder="Additional type (optional)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ability">Ability</label>
                  <input
                    type="text"
                    id="ability"
                    name="ability"
                    value={formData.ability || ''}
                    onChange={handleChange}
                    placeholder="Trainer ability"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="nature">Nature</label>
                  <input
                    type="text"
                    id="nature"
                    name="nature"
                    value={formData.nature || ''}
                    onChange={handleChange}
                    placeholder="e.g. Brave, Timid, Jolly"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'bio' && (
            <div className="create-section">
              <h2>Biography</h2>

              <div className="form-group">
                <label htmlFor="quote">Quote</label>
                <input
                  type="text"
                  id="quote"
                  name="quote"
                  value={formData.quote || ''}
                  onChange={handleChange}
                  placeholder="A memorable quote from your trainer"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tldr">TL;DR (Summary)</label>
                <textarea
                  id="tldr"
                  name="tldr"
                  value={formData.tldr || ''}
                  onChange={handleChange}
                  placeholder="A brief summary of your trainer"
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="biography">Full Biography</label>
                <textarea
                  id="biography"
                  name="biography"
                  value={formData.biography || ''}
                  onChange={handleChange}
                  placeholder="The full biography of your trainer"
                  rows="10"
                ></textarea>
              </div>
            </div>
          )}
        </div>

        <div className="trainer-create-footer">
          <button
            type="button"
            className="trainer-create-btn cancel"
            onClick={() => navigate('/admin/dashboard/trainers')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="trainer-create-btn save"
            disabled={saving}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Creating...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i> Create Trainer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrainerCreate;
