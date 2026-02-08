import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MonsterForm = ({ monster, personId, position, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    species1: '',
    species2: '',
    species3: '',
    type1: '',
    type2: '',
    type3: '',
    type4: '',
    type5: '',
    attribute: '',
    image: '',
    position: position || 1,
    // Default monster stats that should be initialized
    level: 1,
    hp_total: 50,
    hp_iv: Math.floor(Math.random() * 32),
    hp_ev: 0,
    atk_total: 50,
    atk_iv: Math.floor(Math.random() * 32),
    atk_ev: 0,
    def_total: 50,
    def_iv: Math.floor(Math.random() * 32),
    def_ev: 0,
    spa_total: 50,
    spa_iv: Math.floor(Math.random() * 32),
    spa_ev: 0,
    spd_total: 50,
    spd_iv: Math.floor(Math.random() * 32),
    spd_ev: 0,
    spe_total: 50,
    spe_iv: Math.floor(Math.random() * 32),
    spe_ev: 0,
    friendship: 70,
    moveset: '[]'
  });
  const [newSpecies, setNewSpecies] = useState('');
  const [newType, setNewType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const attributes = [
    { value: 'virus', label: 'Virus', icon: 'fas fa-bug', color: '#8B4513' },
    { value: 'vaccine', label: 'Vaccine', icon: 'fas fa-shield-alt', color: '#4CAF50' },
    { value: 'data', label: 'Data', icon: 'fas fa-database', color: '#2196F3' },
    { value: 'free', label: 'Free', icon: 'fas fa-infinity', color: '#9C27B0' },
    { value: 'variable', label: 'Variable', icon: 'fas fa-exchange-alt', color: '#FF9800' }
  ];

  const commonTypes = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
    'Steel', 'Fairy'
  ];

  useEffect(() => {
    if (monster) {
      // Parse existing species and types data properly
      let species = [];
      let types = [];
      
      if (typeof monster.species === 'string') {
        try {
          species = JSON.parse(monster.species);
        } catch (e) {
          species = [];
        }
      } else if (Array.isArray(monster.species)) {
        species = monster.species;
      }
      
      if (typeof monster.types === 'string') {
        try {
          types = JSON.parse(monster.types);
        } catch (e) {
          types = [];
        }
      } else if (Array.isArray(monster.types)) {
        types = monster.types;
      }
      
      setFormData({
        name: monster.name || '',
        species1: species[0] || '',
        species2: species[1] || '',
        species3: species[2] || '',
        type1: types[0] || '',
        type2: types[1] || '',
        type3: types[2] || '',
        type4: types[3] || '',
        type5: types[4] || '',
        attribute: monster.attribute || '',
        image: monster.image || '',
        position: monster.position || position || 1,
        // Keep existing stats if editing
        level: monster.level || 1,
        hp_total: monster.hp_total || 50,
        hp_iv: monster.hp_iv || Math.floor(Math.random() * 32),
        hp_ev: monster.hp_ev || 0,
        atk_total: monster.atk_total || 50,
        atk_iv: monster.atk_iv || Math.floor(Math.random() * 32),
        atk_ev: monster.atk_ev || 0,
        def_total: monster.def_total || 50,
        def_iv: monster.def_iv || Math.floor(Math.random() * 32),
        def_ev: monster.def_ev || 0,
        spa_total: monster.spa_total || 50,
        spa_iv: monster.spa_iv || Math.floor(Math.random() * 32),
        spa_ev: monster.spa_ev || 0,
        spd_total: monster.spd_total || 50,
        spd_iv: monster.spd_iv || Math.floor(Math.random() * 32),
        spd_ev: monster.spd_ev || 0,
        spe_total: monster.spe_total || 50,
        spe_iv: monster.spe_iv || Math.floor(Math.random() * 32),
        spe_ev: monster.spe_ev || 0,
        friendship: monster.friendship || 70,
        moveset: monster.moveset || '[]'
      });
    }
  }, [monster, position]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSpecies = () => {
    if (!newSpecies.trim()) return;
    
    // Find first empty species slot
    if (!formData.species1) {
      setFormData(prev => ({ ...prev, species1: newSpecies.trim() }));
    } else if (!formData.species2) {
      setFormData(prev => ({ ...prev, species2: newSpecies.trim() }));
    } else if (!formData.species3) {
      setFormData(prev => ({ ...prev, species3: newSpecies.trim() }));
    } else {
      setError('Maximum 3 species allowed');
      return;
    }
    
    setNewSpecies('');
    setError(null);
  };

  const handleRemoveSpecies = (speciesNumber) => {
    setFormData(prev => ({
      ...prev,
      [`species${speciesNumber}`]: ''
    }));
  };

  const handleAddType = (typeToAdd) => {
    // Check if type already exists
    const existingTypes = [formData.type1, formData.type2, formData.type3, formData.type4, formData.type5];
    if (existingTypes.includes(typeToAdd)) {
      setError('Type already added');
      return;
    }
    
    // Find first empty type slot
    if (!formData.type1) {
      setFormData(prev => ({ ...prev, type1: typeToAdd }));
    } else if (!formData.type2) {
      setFormData(prev => ({ ...prev, type2: typeToAdd }));
    } else if (!formData.type3) {
      setFormData(prev => ({ ...prev, type3: typeToAdd }));
    } else if (!formData.type4) {
      setFormData(prev => ({ ...prev, type4: typeToAdd }));
    } else if (!formData.type5) {
      setFormData(prev => ({ ...prev, type5: typeToAdd }));
    } else {
      setError('Maximum 5 types allowed');
      return;
    }
    
    setError(null);
  };

  const handleAddCustomType = () => {
    if (!newType.trim()) return;
    handleAddType(newType.trim());
    setNewType('');
  };

  const handleRemoveType = (typeNumber) => {
    setFormData(prev => ({
      ...prev,
      [`type${typeNumber}`]: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Monster name is required');
      return;
    }

    if (!formData.attribute) {
      setError('Attribute is required');
      return;
    }

    if (!formData.species1) {
      setError('At least one species is required');
      return;
    }

    if (!formData.type1) {
      setError('At least one type is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare species and types arrays, filtering out empty values
      const species = [formData.species1, formData.species2, formData.species3].filter(s => s.trim());
      const types = [formData.type1, formData.type2, formData.type3, formData.type4, formData.type5].filter(t => t.trim());

      const submitData = {
        name: formData.name.trim(),
        species: species,
        types: types,
        attribute: formData.attribute,
        image: formData.image.trim() || null,
        position: parseInt(formData.position) || 1,
        // Include all the monster stats for proper initialization
        level: formData.level,
        hp_total: formData.hp_total,
        hp_iv: formData.hp_iv,
        hp_ev: formData.hp_ev,
        atk_total: formData.atk_total,
        atk_iv: formData.atk_iv,
        atk_ev: formData.atk_ev,
        def_total: formData.def_total,
        def_iv: formData.def_iv,
        def_ev: formData.def_ev,
        spa_total: formData.spa_total,
        spa_iv: formData.spa_iv,
        spa_ev: formData.spa_ev,
        spd_total: formData.spd_total,
        spd_iv: formData.spd_iv,
        spd_ev: formData.spd_ev,
        spe_total: formData.spe_total,
        spe_iv: formData.spe_iv,
        spe_ev: formData.spe_ev,
        friendship: formData.friendship,
        moveset: formData.moveset
      };

      if (monster) {
        // Update existing monster
        await api.put(`/admin/monsters/${monster.id}`, submitData);
      } else {
        // Create new monster
        await api.post(`/admin/faction-people/${personId}/team`, submitData);
      }

      onSave();
    } catch (err) {
      console.error('Error saving monster:', err);
      setError(err.response?.data?.message || 'Failed to save monster');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const typeColors = {
      normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
      grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
      ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
      rock: '#B8A038', ghost: '#705898', dragon: '#7B68EE', dark: '#483D8B',
      steel: '#B8B8D0', fairy: '#EE99AC', light: '#FFFFE0', shadow: '#36454F',
      beast: '#8B4513', bird: '#87CEEB', aquan: '#4682B4', machine: '#696969',
      holy: '#FFD700', plant: '#228B22', insect: '#9ACD32', neutral: '#C0C0C0'
    };
    return typeColors[type.toLowerCase()] || '#999';
  };

  return (
    <div className="monster-form-overlay">
      <div className="monster-form-modal">
        <div className="tree-header">
          <h3>
            <i className="fas fa-dragon"></i>
            {monster ? 'Edit Monster' : 'Add New Monster'}
          </h3>
          <button className="button close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="monster-form">
          <div class="form-sections">
            {/* Basic Info */}
            <div className="form-section">
              <h4>Basic Information</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    Monster Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter monster name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="position">Position</label>
                  <select
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="form-input"
                  >
                    <option value={1}>Position 1</option>
                    <option value={2}>Position 2</option>
                    <option value={3}>Position 3</option>
                    <option value={4}>Position 4</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="image">Monster Image URL</label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="https://example.com/monster-image.jpg"
                />
              </div>
            </div>

            {/* Attribute */}
            <div className="form-section">
              <h4>
                Attribute <span className="required">*</span>
              </h4>
              
              <div className="attributes-grid">
                {attributes.map(attr => (
                  <label
                    key={attr.value}
                    className={`attribute-option${formData.attribute === attr.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="attribute"
                      value={attr.value}
                      checked={formData.attribute === attr.value}
                      onChange={handleInputChange}
                    />
                    <div 
                      className="ability-pill"
                      style={{ borderColor: attr.color }}
                    >
                      <i className={attr.icon} style={{ color: attr.color }}></i>
                      <span>{attr.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Species */}
            <div className="form-section">
              <h4>
                Species (1-3 required) <span className="required">*</span>
              </h4>
              
              <div className="add-item-group">
                <input
                  type="text"
                  value={newSpecies}
                  onChange={(e) => setNewSpecies(e.target.value)}
                  className="form-input"
                  placeholder="Enter species name"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecies())}
                />
                <button
                  type="button"
                  className="button primary sm"
                  onClick={handleAddSpecies}
                  disabled={formData.species.length >= 3}
                >
                  <i className="fas fa-plus"></i>
                  Add
                </button>
              </div>

              <div className="tags-container">
                {formData.species.map((species, index) => (
                  <span key={index} className="tag species-tag">
                    {species}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemoveSpecies(index)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Types */}
            <div className="form-section">
              <h4>
                Types (1-5 required) <span className="required">*</span>
              </h4>
              
              <div className="types-section">
                <div className="common-types">
                  <h5>Common Types:</h5>
                  <div className="types-grid">
                    {commonTypes.map(type => (
                      <button
                        key={type}
                        type="button"
                        className={`type-btn${formData.types.includes(type) ? 'selected' : ''}`}
                        style={{ 
                          backgroundColor: formData.types.includes(type) ? getTypeColor(type) : '#f8f9fa',
                          color: formData.types.includes(type) ? 'white' : '#333'
                        }}
                        onClick={() => formData.types.includes(type) 
                          ? handleRemoveType(formData.types.indexOf(type))
                          : handleAddType(type)
                        }
                        disabled={!formData.types.includes(type) && formData.types.length >= 5}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="custom-type">
                  <h5>Custom Type:</h5>
                  <div className="add-item-group">
                    <input
                      type="text"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="form-input"
                      placeholder="Enter custom type"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomType())}
                    />
                    <button
                      type="button"
                      className="button primary sm"
                      onClick={handleAddCustomType}
                      disabled={formData.types.length >= 5}
                    >
                      <i className="fas fa-plus"></i>
                      Add
                    </button>
                  </div>
                </div>

                <div className="selected-types">
                  <h5>Selected Types:</h5>
                  <div className="tags-container">
                    {formData.types.map((type, index) => (
                      <span 
                        key={index} 
                        className="tag type-tag"
                        style={{ backgroundColor: getTypeColor(type) }}
                      >
                        {type}
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={() => handleRemoveType(index)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
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
              className="button secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
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
                  {monster ? 'Update Monster' : 'Add Monster'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MonsterForm;