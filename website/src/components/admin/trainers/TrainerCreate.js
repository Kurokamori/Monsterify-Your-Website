import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import adminApi from '../../../services/adminApi';
import ErrorMessage from '../../common/ErrorMessage';
import AutocompleteInput from '../../common/AutocompleteInput';
import abilityService from '../../../services/abilityService';
import { TYPES, FACTIONS, NATURES } from '../../../data/trainerFormOptions';

const TrainerCreate = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [abilities, setAbilities] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    level: 1,
    currency_amount: 500,
    total_earned_currency: 500,
    player_user_id: '', // This will need to be set to a valid user ID
  });

  // Load abilities from backend
  useEffect(() => {
    const loadAbilities = async () => {
      const abilityData = await abilityService.getAbilityNames();
      setAbilities(abilityData);
    };
    loadAbilities();
  }, []);

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
      <div className="adopt-card">
        <h1>Create New Trainer</h1>
        <div className="header-actions">
          <Link to="/admin/dashboard/trainers" className="button secondary">
            <i className="fas fa-times"></i> Cancel
          </Link>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="trainer-edit-form">
        <div className="trainer-edit-tabs">
          <button
            type="button"
            className={`trainer-edit-tab${activeSection === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveSection('basic')}
          >
            <i className="fas fa-user"></i> Basic Info
          </button>
          <button
            type="button"
            className={`trainer-edit-tab${activeSection === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveSection('personal')}
          >
            <i className="fas fa-address-card"></i> Personal
          </button>
          <button
            type="button"
            className={`trainer-edit-tab${activeSection === 'type' ? 'active' : ''}`}
            onClick={() => setActiveSection('species')}
          >
            <i className="fas fa-dna"></i> Species & Types
          </button>
          <button
            type="button"
            className={`trainer-edit-tab${activeSection === 'bio' ? 'active' : ''}`}
            onClick={() => setActiveSection('bio')}
          >
            <i className="fas fa-book"></i> Biography
          </button>
        </div>

        <div className="trainer-create-content">
          {activeSection === 'basic' && (
            <div className="set-item">
              <h2>Basic Information</h2>

              <div className="container cols-2 gap-md">
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
                  <AutocompleteInput
                    id="faction"
                    name="faction"
                    label="Faction"
                    value={formData.faction || ''}
                    onChange={handleChange}
                    options={FACTIONS}
                    placeholder="Select or type faction"
                  />
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
            <div className="set-item">
              <h2>Personal Information</h2>

              <div className="container cols-2 gap-md">
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
            <div className="set-item">
              <h2>Species & Types</h2>

              <div className="container cols-2 gap-md">
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
                  <AutocompleteInput
                    id="type1"
                    name="type1"
                    label="Type 1"
                    value={formData.type1 || ''}
                    onChange={handleChange}
                    options={TYPES}
                    placeholder="Primary type"
                  />
                </div>

                <div className="form-group">
                  <AutocompleteInput
                    id="type2"
                    name="type2"
                    label="Type 2"
                    value={formData.type2 || ''}
                    onChange={handleChange}
                    options={TYPES}
                    placeholder="Secondary type (optional)"
                  />
                </div>

                <div className="form-group">
                  <AutocompleteInput
                    id="type3"
                    name="type3"
                    label="Type 3"
                    value={formData.type3 || ''}
                    onChange={handleChange}
                    options={TYPES}
                    placeholder="Additional type (optional)"
                  />
                </div>

                <div className="form-group">
                  <AutocompleteInput
                    id="ability"
                    name="ability"
                    label="Ability"
                    value={formData.ability || ''}
                    onChange={handleChange}
                    options={abilities}
                    placeholder="Trainer ability"
                    showDescriptionBelow={true}
                  />
                </div>

                <div className="form-group">
                  <AutocompleteInput
                    id="nature"
                    name="nature"
                    label="Nature"
                    value={formData.nature || ''}
                    onChange={handleChange}
                    options={NATURES}
                    placeholder="e.g. Brave, Timid, Jolly"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'bio' && (
            <div className="set-item">
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

        <div className="trainer-edit-footer">
          <button
            type="button"
            className="button secondary"
            onClick={() => navigate('/admin/dashboard/trainers')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button primary"
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
