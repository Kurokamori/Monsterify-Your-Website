import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import fakemonService from '../../services/fakemonService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

/**
 * Fakemon Form Page
 * Form for adding and editing fakemon
 */
const FakemonFormPage = () => {
  const { number } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!number;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [types, setTypes] = useState([]);
  const [attributes, setAttributes] = useState(['Normal', 'Mega', 'Legendary', 'Mythical', 'Ultra Beast']);
  
  // Form data state
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    category: '',
    type1: '',
    type2: '',
    type3: '',
    type4: '',
    type5: '',
    attribute: '',
    description: '',
    image_url: '',
    evolution_line: [],
    ability1: '',
    ability2: '',
    hidden_ability: '',
    hp: 50,
    attack: 50,
    defense: 50,
    special_attack: 50,
    special_defense: 50,
    speed: 50
  });

  // Fetch types and fakemon data on component mount
  useEffect(() => {
    fetchTypes();
    
    if (isEditMode) {
      fetchFakemon();
    } else {
      fetchNextNumber();
    }
  }, [isEditMode, number]);

  // Fetch all fakemon types
  const fetchTypes = async () => {
    try {
      const response = await fakemonService.getAllTypes();
      setTypes(response.types || []);
    } catch (err) {
      console.error('Error fetching fakemon types:', err);
      setError('Failed to load fakemon types. Please try again.');
    }
  };

  // Fetch next available fakemon number
  const fetchNextNumber = async () => {
    try {
      const response = await fakemonService.getNextFakemonNumber();
      
      if (response.success) {
        setFormData(prev => ({
          ...prev,
          number: response.nextNumber
        }));
      }
    } catch (err) {
      console.error('Error fetching next fakemon number:', err);
    }
  };

  // Fetch fakemon data for editing
  const fetchFakemon = async () => {
    try {
      setLoading(true);
      
      const response = await fakemonService.getFakemonByNumber(number);
      
      if (!response.fakemon) {
        setError(`Fakemon #${number} not found`);
        setLoading(false);
        return;
      }
      
      const fakemon = response.fakemon;
      
      // Parse JSON fields
      const evolution_line = fakemon.evolution_line ? JSON.parse(fakemon.evolution_line) : [];

      setFormData({
        number: fakemon.number,
        name: fakemon.name,
        category: fakemon.category || '',
        type1: fakemon.type1 || '',
        type2: fakemon.type2 || '',
        type3: fakemon.type3 || '',
        type4: fakemon.type4 || '',
        type5: fakemon.type5 || '',
        attribute: fakemon.attribute || '',
        description: fakemon.description || '',
        image_url: fakemon.image_url || '',
        evolution_line,
        ability1: fakemon.ability1 || '',
        ability2: fakemon.ability2 || '',
        hidden_ability: fakemon.hidden_ability || '',
        hp: fakemon.hp || 50,
        attack: fakemon.attack || 50,
        defense: fakemon.defense || 50,
        special_attack: fakemon.special_attack || 50,
        special_defense: fakemon.special_defense || 50,
        speed: fakemon.speed || 50
      });
    } catch (err) {
      console.error(`Error fetching fakemon #${number}:`, err);
      setError(`Failed to load fakemon #${number}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle stats changes
  const handleStatChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  // Handle evolution line changes
  const handleEvolutionChange = (index, field, value) => {
    setFormData(prev => {
      const newEvolutionLine = [...prev.evolution_line];
      
      if (!newEvolutionLine[index]) {
        newEvolutionLine[index] = { number: '', name: '', level: '' };
      }
      
      newEvolutionLine[index][field] = value;
      
      return {
        ...prev,
        evolution_line: newEvolutionLine
      };
    });
  };

  // Add evolution to evolution line
  const addEvolution = () => {
    setFormData(prev => ({
      ...prev,
      evolution_line: [...prev.evolution_line, { number: '', name: '', level: '' }]
    }));
  };

  // Remove evolution from evolution line
  const removeEvolution = (index) => {
    setFormData(prev => ({
      ...prev,
      evolution_line: prev.evolution_line.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.number || !formData.name || !formData.category || !formData.type1) {
      setError('Number, name, category, and at least one type are required');
      return;
    }
    
    try {
      setSaving(true);
      
      if (isEditMode) {
        // Update existing fakemon
        await fakemonService.updateFakemon(number, formData);
        navigate('/admin/fakemon', {
          state: { successMessage: `Fakemon #${number} (${formData.name}) updated successfully` }
        });
      } else {
        // Create new fakemon
        await fakemonService.createFakemon(formData);
        navigate('/admin/fakemon', {
          state: { successMessage: `Fakemon #${formData.number} (${formData.name}) created successfully` }
        });
      }
    } catch (err) {
      console.error('Error saving fakemon:', err);
      setError(`Failed to save fakemon: ${err.response?.data?.message || err.message}`);
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">
            {isEditMode ? `Edit Fakemon #${number}` : 'Add New Fakemon'}
          </h1>
          <p className="admin-dashboard-subtitle">
            {isEditMode ? `Editing: ${formData.name}` : 'Create a new fakemon entry'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="admin-alert error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="admin-actions">
          <Link to="/admin/fakemon" className="admin-button secondary">
            <i className="fas fa-arrow-left"></i> Back to Fakemon List
          </Link>
        </div>

        {/* Fakemon Form */}
        {loading ? (
          <LoadingSpinner message="Loading fakemon data..." />
        ) : (
          <div className="admin-form-container">
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-grid">
                {/* Basic Information */}
                <div className="admin-form-section">
                  <h2 className="admin-form-section-title">Basic Information</h2>
                  
                  <div className="admin-form-group">
                    <label htmlFor="number" className="admin-form-label">
                      Number <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="number"
                      name="number"
                      value={formData.number}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="e.g., 001"
                      required
                      disabled={isEditMode || saving}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="name" className="admin-form-label">
                      Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="e.g., Bulbasaur"
                      required
                      disabled={saving}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="category" className="admin-form-label">
                      Category
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="e.g., Seed Pokémon"
                      disabled={saving}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="image_url" className="admin-form-label">
                      Image URL
                    </label>
                    <input
                      type="text"
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="https://example.com/image.png"
                      disabled={saving}
                    />
                    {formData.image_url && (
                      <div className="admin-form-image-preview">
                        <img
                          src={formData.image_url}
                          alt="Fakemon preview"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/100?text=Invalid+URL';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Types and Species */}
                <div className="admin-form-section">
                  <h2 className="admin-form-section-title">Types and Species</h2>
                  
                  <div className="admin-form-group">
                    <label htmlFor="type1" className="admin-form-label">
                      Type 1 <span className="required">*</span>
                    </label>
                    <select
                      id="type1"
                      name="type1"
                      value={formData.type1}
                      onChange={handleChange}
                      className="admin-form-select"
                      required
                      disabled={saving}
                    >
                      <option value="">Select Type</option>
                      {types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="type2" className="admin-form-label">
                      Type 2
                    </label>
                    <select
                      id="type2"
                      name="type2"
                      value={formData.type2}
                      onChange={handleChange}
                      className="admin-form-select"
                      disabled={saving}
                    >
                      <option value="">None</option>
                      {types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="type3" className="admin-form-label">
                      Type 3
                    </label>
                    <select
                      id="type3"
                      name="type3"
                      value={formData.type3}
                      onChange={handleChange}
                      className="admin-form-select"
                      disabled={saving}
                    >
                      <option value="">None</option>
                      {types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="type4" className="admin-form-label">
                      Type 4
                    </label>
                    <select
                      id="type4"
                      name="type4"
                      value={formData.type4}
                      onChange={handleChange}
                      className="admin-form-select"
                      disabled={saving}
                    >
                      <option value="">None</option>
                      {types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="type5" className="admin-form-label">
                      Type 5
                    </label>
                    <select
                      id="type5"
                      name="type5"
                      value={formData.type5}
                      onChange={handleChange}
                      className="admin-form-select"
                      disabled={saving}
                    >
                      <option value="">None</option>
                      {types.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="attribute" className="admin-form-label">
                      Attribute
                    </label>
                    <select
                      id="attribute"
                      name="attribute"
                      value={formData.attribute}
                      onChange={handleChange}
                      className="admin-form-select"
                      disabled={saving}
                    >
                      <option value="">None</option>
                      {attributes.map(attr => (
                        <option key={attr} value={attr}>{attr}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="species1" className="admin-form-label">
                      Species 1
                    </label>
                    <input
                      type="text"
                      id="species1"
                      name="species1"
                      value={formData.species1}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="e.g., Grass"
                      disabled={saving}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="species2" className="admin-form-label">
                      Species 2
                    </label>
                    <input
                      type="text"
                      id="species2"
                      name="species2"
                      value={formData.species2}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="e.g., Poison"
                      disabled={saving}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="species3" className="admin-form-label">
                      Species 3
                    </label>
                    <input
                      type="text"
                      id="species3"
                      name="species3"
                      value={formData.species3}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="e.g., Seed"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="admin-form-section">
                <h2 className="admin-form-section-title">Description</h2>
                
                <div className="admin-form-group">
                  <label htmlFor="description" className="admin-form-label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="admin-form-textarea"
                    rows="4"
                    placeholder="Enter a description for this fakemon..."
                    disabled={saving}
                  ></textarea>
                </div>
              </div>

              {/* Abilities */}
              <div className="admin-form-section">
                <h2 className="admin-form-section-title">Abilities</h2>

                <div className="admin-form-group">
                  <label htmlFor="ability1" className="admin-form-label">
                    Ability 1
                  </label>
                  <input
                    type="text"
                    id="ability1"
                    name="ability1"
                    value={formData.ability1}
                    onChange={handleChange}
                    className="admin-form-input"
                    placeholder="e.g., Overgrow"
                    disabled={saving}
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="ability2" className="admin-form-label">
                    Ability 2
                  </label>
                  <input
                    type="text"
                    id="ability2"
                    name="ability2"
                    value={formData.ability2}
                    onChange={handleChange}
                    className="admin-form-input"
                    placeholder="e.g., Chlorophyll"
                    disabled={saving}
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="hidden_ability" className="admin-form-label">
                    Hidden Ability
                  </label>
                  <input
                    type="text"
                    id="hidden_ability"
                    name="hidden_ability"
                    value={formData.hidden_ability}
                    onChange={handleChange}
                    className="admin-form-input"
                    placeholder="e.g., Leaf Guard"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="admin-form-section">
                <h2 className="admin-form-section-title">Base Stats</h2>
                
                <div className="admin-stats-grid">
                  <div className="admin-form-group">
                    <label htmlFor="hp" className="admin-form-label">
                      HP
                    </label>
                    <input
                      type="number"
                      id="hp"
                      name="hp"
                      value={formData.hp}
                      onChange={handleStatChange}
                      className="admin-form-input"
                      min="1"
                      max="255"
                      disabled={saving}
                    />
                    <div className="admin-stat-bar">
                      <div
                        className="admin-stat-fill hp"
                        style={{ width: `${Math.min(100, (formData.hp / 255) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="attack" className="admin-form-label">
                      Attack
                    </label>
                    <input
                      type="number"
                      id="attack"
                      name="attack"
                      value={formData.attack}
                      onChange={handleStatChange}
                      className="admin-form-input"
                      min="1"
                      max="255"
                      disabled={saving}
                    />
                    <div className="admin-stat-bar">
                      <div
                        className="admin-stat-fill attack"
                        style={{ width: `${Math.min(100, (formData.attack / 255) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="defense" className="admin-form-label">
                      Defense
                    </label>
                    <input
                      type="number"
                      id="defense"
                      name="defense"
                      value={formData.defense}
                      onChange={handleStatChange}
                      className="admin-form-input"
                      min="1"
                      max="255"
                      disabled={saving}
                    />
                    <div className="admin-stat-bar">
                      <div
                        className="admin-stat-fill defense"
                        style={{ width: `${Math.min(100, (formData.defense / 255) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="special_attack" className="admin-form-label">
                      Special Attack
                    </label>
                    <input
                      type="number"
                      id="special_attack"
                      name="special_attack"
                      value={formData.special_attack}
                      onChange={handleStatChange}
                      className="admin-form-input"
                      min="1"
                      max="255"
                      disabled={saving}
                    />
                    <div className="admin-stat-bar">
                      <div
                        className="admin-stat-fill special-attack"
                        style={{ width: `${Math.min(100, (formData.special_attack / 255) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="special_defense" className="admin-form-label">
                      Special Defense
                    </label>
                    <input
                      type="number"
                      id="special_defense"
                      name="special_defense"
                      value={formData.special_defense}
                      onChange={handleStatChange}
                      className="admin-form-input"
                      min="1"
                      max="255"
                      disabled={saving}
                    />
                    <div className="admin-stat-bar">
                      <div
                        className="admin-stat-fill special-defense"
                        style={{ width: `${Math.min(100, (formData.special_defense / 255) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="speed" className="admin-form-label">
                      Speed
                    </label>
                    <input
                      type="number"
                      id="speed"
                      name="speed"
                      value={formData.speed}
                      onChange={handleStatChange}
                      className="admin-form-input"
                      min="1"
                      max="255"
                      disabled={saving}
                    />
                    <div className="admin-stat-bar">
                      <div
                        className="admin-stat-fill speed"
                        style={{ width: `${Math.min(100, (formData.speed / 255) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Evolution Line */}
              <div className="admin-form-section">
                <h2 className="admin-form-section-title">Evolution Line</h2>
                
                {formData.evolution_line.length === 0 ? (
                  <p className="admin-form-hint">No evolutions added yet.</p>
                ) : (
                  <div className="admin-evolution-list">
                    {formData.evolution_line.map((evo, index) => (
                      <div key={index} className="admin-evolution-item">
                        <div className="admin-evolution-fields">
                          <div className="admin-form-group">
                            <label className="admin-form-label">Number</label>
                            <input
                              type="text"
                              value={evo.number}
                              onChange={(e) => handleEvolutionChange(index, 'number', e.target.value)}
                              className="admin-form-input"
                              placeholder="e.g., 002"
                              disabled={saving}
                            />
                          </div>
                          
                          <div className="admin-form-group">
                            <label className="admin-form-label">Name</label>
                            <input
                              type="text"
                              value={evo.name}
                              onChange={(e) => handleEvolutionChange(index, 'name', e.target.value)}
                              className="admin-form-input"
                              placeholder="e.g., Ivysaur"
                              disabled={saving}
                            />
                          </div>
                          
                          <div className="admin-form-group">
                            <label className="admin-form-label">Level</label>
                            <input
                              type="text"
                              value={evo.level}
                              onChange={(e) => handleEvolutionChange(index, 'level', e.target.value)}
                              className="admin-form-input"
                              placeholder="e.g., 16"
                              disabled={saving}
                            />
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeEvolution(index)}
                          className="admin-button delete"
                          disabled={saving}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={addEvolution}
                  className="admin-button secondary"
                  disabled={saving}
                >
                  <i className="fas fa-plus"></i> Add Evolution
                </button>
              </div>
              
              {/* Form Actions */}
              <div className="admin-form-actions">
                <Link
                  to="/admin/fakemon"
                  className="admin-button secondary"
                  disabled={saving}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="admin-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i> {isEditMode ? 'Update Fakemon' : 'Create Fakemon'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FakemonFormPage;
