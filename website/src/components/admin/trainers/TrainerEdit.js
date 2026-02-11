import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminApi from '../../../services/adminApi';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage';
import AutocompleteInput from '../../common/AutocompleteInput';
import abilityService from '../../../services/abilityService';
import { TYPES, FACTIONS, NATURES, CHARACTERISTICS } from '../../../data/trainerFormOptions';

const TrainerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [formData, setFormData] = useState({});
  const [themeDisplay, setThemeDisplay] = useState('');
  const [themeLink, setThemeLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');
  const [abilities, setAbilities] = useState([]);

  // Load abilities from backend
  useEffect(() => {
    const loadAbilities = async () => {
      const abilityData = await abilityService.getAbilityNames();
      setAbilities(abilityData);
    };
    loadAbilities();
  }, []);

  useEffect(() => {
    fetchTrainer();
  }, [id]);

  const fetchTrainer = async () => {
    try {
      setLoading(true);

      const response = await adminApi.getTrainerById(id);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch trainer details');
      }

      const trainerData = response.data;
      setTrainer(trainerData);
      setFormData(trainerData);
      
      // Parse existing theme data if it exists
      if (trainerData.theme && trainerData.theme.includes(' || ')) {
        const [display, link] = trainerData.theme.split(' || ');
        setThemeDisplay(display);
        setThemeLink(link);
      } else {
        setThemeDisplay(trainerData.theme || '');
        setThemeLink('');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching trainer:', err);
      setError('Failed to load trainer details. Please try again later.');
      setLoading(false);
    }
  };

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

      // Create FormData for potential file uploads (even though admin might not upload files here)
      const submitFormData = new FormData();
      
      // Concatenate theme fields if both are provided
      const updatedFormData = {
        ...formData,
        theme: themeLink && themeDisplay ? `${themeDisplay} || ${themeLink}` : themeDisplay
      };

      // Add all fields to FormData
      Object.keys(updatedFormData).forEach(key => {
        if (updatedFormData[key] !== undefined && updatedFormData[key] !== null) {
          submitFormData.append(key, updatedFormData[key]);
        }
      });

      const response = await adminApi.updateTrainer(id, submitFormData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update trainer');
      }

      setSaving(false);
      navigate(`/admin/dashboard/trainers/${id}`);
    } catch (err) {
      console.error('Error updating trainer:', err);
      setError('Failed to update trainer. Please try again later.');
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!trainer) return <ErrorMessage message="Trainer not found" />;

  return (
    <div className="trainer-edit-container">
      <div className="adopt-card">
        <h1>Edit Trainer: {trainer.name}</h1>
        <div className="header-actions">
          <Link to={`/admin/dashboard/trainers/${id}`} className="button secondary">
            <i className="fas fa-times"></i> Cancel
          </Link>
        </div>
      </div>

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

        <div className="trainer-edit-content">
          {activeSection === 'basic' && (
            <div className="set-item">
              <h2>Basic Information</h2>

              <div className="container cols-2 gap-md">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    required
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
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="currency_amount">Currency Amount</label>
                  <input
                    type="number"
                    id="currency_amount"
                    name="currency_amount"
                    min="0"
                    value={formData.currency_amount || 0}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="total_earned_currency">Total Earned Currency</label>
                  <input
                    type="number"
                    id="total_earned_currency"
                    name="total_earned_currency"
                    min="0"
                    value={formData.total_earned_currency || 0}
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
                  />
                </div>

                <div className="form-group theme-fields">
                  <label htmlFor="theme_display">Theme Display Text</label>
                  <input
                    type="text"
                    id="theme_display"
                    name="theme_display"
                    value={themeDisplay}
                    onChange={(e) => setThemeDisplay(e.target.value)}
                    placeholder="e.g., Pokémon Champion Theme"
                  />
                </div>

                <div className="form-group theme-fields">
                  <label htmlFor="theme_link">Theme YouTube Link (Optional)</label>
                  <input
                    type="url"
                    id="theme_link"
                    name="theme_link"
                    value={themeLink}
                    onChange={(e) => setThemeLink(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <small className="field-hint">
                    If provided, users will be able to expand and play the theme music.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="occupation">Occupation</label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    value={formData.occupation || ''}
                    onChange={handleChange}
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
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="race">Race</label>
                  <select
                    id="race"
                    name="race"
                    value={formData.race || 'Human'}
                    onChange={handleChange}
                  >
                    <option value="Human">Human</option>
                    <option value="Alter">Alter</option>
                    <option value="Ultra Beast">Ultra Beast</option>
                    <option value="Alter (Faller)">Alter (Faller)</option>
                    <option value="Human (Faller)">Human (Faller)</option>
                    <option value="Catfolk">Catfolk</option>
                  </select>
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
                    placeholder="Secondary type"
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
                    placeholder="Type 3"
                  />
                </div>

                <div className="form-group">
                  <AutocompleteInput
                    id="type4"
                    name="type4"
                    label="Type 4"
                    value={formData.type4 || ''}
                    onChange={handleChange}
                    options={TYPES}
                    placeholder="Type 4"
                  />
                </div>

                <div className="form-group">
                  <AutocompleteInput
                    id="type5"
                    name="type5"
                    label="Type 5"
                    value={formData.type5 || ''}
                    onChange={handleChange}
                    options={TYPES}
                    placeholder="Type 5"
                  />
                </div>

                <div className="form-group">
                  <AutocompleteInput
                    id="type6"
                    name="type6"
                    label="Type 6"
                    value={formData.type6 || ''}
                    onChange={handleChange}
                    options={TYPES}
                    placeholder="Type 6"
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

                <div className="form-group">
                  <AutocompleteInput
                    id="characteristic"
                    name="characteristic"
                    label="Characteristic"
                    value={formData.characteristic || ''}
                    onChange={handleChange}
                    options={CHARACTERISTICS}
                    placeholder="Trainer characteristic"
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
                  placeholder="The full biography of your trainer (supports Markdown formatting)"
                  rows="10"
                ></textarea>
                <small className="field-hint">
                  You can use Markdown formatting: **bold**, *italic*, [links](url), # headings, etc.
                </small>
              </div>
            </div>
          )}
        </div>

        <div className="trainer-edit-footer">
          <button
            type="button"
            className="button secondary"
            onClick={() => navigate(`/admin/dashboard/trainers/${id}`)}
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
                <i className="fas fa-spinner fa-spin"></i> Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrainerEdit;
