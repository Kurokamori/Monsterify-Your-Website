import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import fakemonService from '../../services/fakemonService';
import abilityService from '../../services/abilityService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackendFileUpload from '../../components/common/BackendFileUpload';
import AutocompleteInput from '../../components/common/AutocompleteInput';
import { TYPES, ATTRIBUTES, FAKEMON_CATEGORIES } from '../../data/trainerFormOptions';

// --- Stat Generator Constants ---
const BST_RANGES = {
  fodder: [180, 250],
  weak: [250, 350],
  below_average: [350, 420],
  average: [420, 500],
  above_average: [500, 560],
  powerful: [560, 600],
  pseudo_legendary: [600, 640],
  legendary: [640, 720]
};

const POWER_LEVELS = [
  { value: 'fodder', label: 'Fodder (BST 180-250)' },
  { value: 'weak', label: 'Weak (BST 250-350)' },
  { value: 'below_average', label: 'Below Average (BST 350-420)' },
  { value: 'average', label: 'Average (BST 420-500)' },
  { value: 'above_average', label: 'Above Average (BST 500-560)' },
  { value: 'powerful', label: 'Powerful (BST 560-600)' },
  { value: 'pseudo_legendary', label: 'Pseudo-Legendary (BST 600-640)' },
  { value: 'legendary', label: 'Legendary (BST 640-720)' }
];

const SPECIALTY_OPTIONS = [
  { key: 'random', label: 'Random' },
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'special_attack', label: 'Special Attack' },
  { key: 'special_defense', label: 'Special Defense' },
  { key: 'speed', label: 'Speed' }
];

const STAT_KEYS = ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'];

// --- Evolution Tree Builder (for preview) ---
const buildEvolutionTree = (chain) => {
  if (!chain || chain.length === 0) return [];
  const roots = chain.filter(evo => evo.evolves_from === null || evo.evolves_from === undefined || evo.evolves_from === '');
  if (roots.length === 0 && chain.length > 0) roots.push(chain[0]);

  const buildNode = (entry) => {
    const children = chain.filter(evo =>
      String(evo.evolves_from) === String(entry.number) && String(evo.number) !== String(entry.number)
    );
    return { ...entry, children: children.map(child => buildNode(child)) };
  };

  return roots.map(root => buildNode(root));
};

const renderEvoPreviewNode = (node, depth = 0) => (
  <div key={node.number} className="evo-preview-node" style={{ marginLeft: depth * 24 }}>
    <span className="evo-preview-node-content">
      {depth > 0 && <><i className="fas fa-arrow-right evo-preview-arrow"></i></>}
      <strong>#{node.number}</strong> {node.name || '???'}
      {node.method && <span className="evo-preview-method"> ({node.method}{node.method_detail ? `: ${node.method_detail}` : ''})</span>}
    </span>
    {node.children && node.children.map(child => renderEvoPreviewNode(child, depth + 1))}
  </div>
);

/**
 * Fakemon Form Page
 * Form for adding and editing fakemon with autocomplete, stat generator, and enhanced evolution editor
 */
const FakemonFormPage = () => {
  const { number } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!number;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [abilityOptions, setAbilityOptions] = useState([]);
  const [fakemonNames, setFakemonNames] = useState([]);

  // Stat generator state
  const [statPowerLevel, setStatPowerLevel] = useState('');
  const [statSpecialties, setStatSpecialties] = useState([]);

  // Form data state
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    category: '',
    classification: '',
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

  // Fetch data on component mount
  useEffect(() => {
    fetchAbilityOptions();
    fetchFakemonNames();

    if (isEditMode) {
      fetchFakemon();
    } else {
      fetchNextNumber();
    }
  }, [isEditMode, number]);

  const fetchAbilityOptions = async () => {
    try {
      const response = await abilityService.getAbilityNames();
      setAbilityOptions(response || []);
    } catch (err) {
      console.error('Error fetching abilities:', err);
    }
  };

  const fetchFakemonNames = async () => {
    try {
      const response = await fakemonService.getAllFakemon({ limit: 9999 });
      const names = (response.fakemon || []).map(f => ({
        name: f.name,
        description: `#${String(f.number).padStart(3, '0')}`
      }));
      setFakemonNames(names);
    } catch (err) {
      console.error('Error fetching fakemon names:', err);
    }
  };

  const fetchNextNumber = async () => {
    try {
      const response = await fakemonService.getNextFakemonNumber();
      if (response.success) {
        setFormData(prev => ({ ...prev, number: response.nextNumber }));
      }
    } catch (err) {
      console.error('Error fetching next fakemon number:', err);
    }
  };

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
      const evolution_line = fakemon.evolution_line ? JSON.parse(fakemon.evolution_line) : [];

      setFormData({
        number: fakemon.number,
        name: fakemon.name,
        category: fakemon.category || '',
        classification: fakemon.classification || '',
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

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleEvolutionChange = (index, field, value) => {
    setFormData(prev => {
      const newEvolutionLine = [...prev.evolution_line];
      if (!newEvolutionLine[index]) {
        newEvolutionLine[index] = { number: '', name: '', level: '', method: '', method_detail: '', evolves_from: '' };
      }
      newEvolutionLine[index][field] = value;
      return { ...prev, evolution_line: newEvolutionLine };
    });
  };

  const addEvolution = () => {
    setFormData(prev => {
      const prevEntry = prev.evolution_line[prev.evolution_line.length - 1];
      return {
        ...prev,
        evolution_line: [...prev.evolution_line, {
          number: '',
          name: '',
          level: '',
          method: '',
          method_detail: '',
          evolves_from: prevEntry ? prevEntry.number : ''
        }]
      };
    });
  };

  const removeEvolution = (index) => {
    setFormData(prev => ({
      ...prev,
      evolution_line: prev.evolution_line.filter((_, i) => i !== index)
    }));
  };

  // --- Stat Generator ---
  const handleSpecialtyToggle = (key) => {
    if (key === 'random') {
      setStatSpecialties(prev => prev.includes('random') ? [] : ['random']);
    } else {
      setStatSpecialties(prev => {
        const filtered = prev.filter(s => s !== 'random');
        return filtered.includes(key)
          ? filtered.filter(s => s !== key)
          : [...filtered, key];
      });
    }
  };

  const handleRollStats = () => {
    if (!statPowerLevel) return;

    const [minBST, maxBST] = BST_RANGES[statPowerLevel];
    const targetBST = Math.floor(Math.random() * (maxBST - minBST + 1)) + minBST;

    const isRandom = statSpecialties.includes('random') || statSpecialties.length === 0;
    const specialtyStatKeys = isRandom ? [] : statSpecialties.filter(s => s !== 'random');

    // Generate weights: specialty stats get higher allocation
    const weights = {};
    STAT_KEYS.forEach(key => {
      if (specialtyStatKeys.includes(key)) {
        weights[key] = 2.0 + Math.random() * 1.0; // 2.0-3.0x
      } else {
        weights[key] = 0.5 + Math.random() * 1.0; // 0.5-1.5x
      }
    });

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

    // Distribute BST proportionally
    const stats = {};
    let allocated = 0;
    STAT_KEYS.forEach((key, i) => {
      if (i === STAT_KEYS.length - 1) {
        stats[key] = targetBST - allocated;
      } else {
        const portion = Math.round((weights[key] / totalWeight) * targetBST);
        stats[key] = portion;
        allocated += portion;
      }
    });

    // Add variance and clamp
    STAT_KEYS.forEach(key => {
      const variance = Math.floor(Math.random() * 11) - 5;
      stats[key] = Math.max(1, Math.min(255, stats[key] + variance));
    });

    // Adjust to hit target BST
    let currentBST = STAT_KEYS.reduce((sum, key) => sum + stats[key], 0);
    let diff = targetBST - currentBST;
    while (diff !== 0) {
      const adjustKey = specialtyStatKeys.length > 0
        ? specialtyStatKeys[Math.floor(Math.random() * specialtyStatKeys.length)]
        : STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)];
      const adjustment = diff > 0 ? Math.min(diff, 10) : Math.max(diff, -10);
      const newVal = Math.max(1, Math.min(255, stats[adjustKey] + adjustment));
      diff -= (newVal - stats[adjustKey]);
      stats[adjustKey] = newVal;
      if (diff !== 0 && stats[adjustKey] === 1 || stats[adjustKey] === 255) {
        // If we hit limits, try another stat
        const otherKey = STAT_KEYS[Math.floor(Math.random() * STAT_KEYS.length)];
        const adj2 = diff > 0 ? Math.min(diff, 5) : Math.max(diff, -5);
        const newVal2 = Math.max(1, Math.min(255, stats[otherKey] + adj2));
        diff -= (newVal2 - stats[otherKey]);
        stats[otherKey] = newVal2;
      }
    }

    setFormData(prev => ({ ...prev, ...stats }));
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.number || !formData.name || !formData.category || !formData.type1) {
      setError('Number, name, category (universe), and at least one type are required');
      return;
    }

    try {
      setSaving(true);
      if (isEditMode) {
        await fakemonService.updateFakemon(number, formData);
        navigate('/admin/fakemon', {
          state: { successMessage: `Fakemon #${number} (${formData.name}) updated successfully` }
        });
      } else {
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

  // Computed: evolution tree preview
  const evoTreePreview = useMemo(() => buildEvolutionTree(formData.evolution_line), [formData.evolution_line]);

  // Computed: evolution "evolves from" options
  const evolvesFromOptions = useMemo(() => {
    return formData.evolution_line
      .filter(evo => evo.number)
      .map(evo => ({ value: evo.number, label: `#${evo.number} ${evo.name || ''}`.trim() }));
  }, [formData.evolution_line]);

  // Computed: BST total
  const bstTotal = formData.hp + formData.attack + formData.defense +
    formData.special_attack + formData.special_defense + formData.speed;

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

        {error && (
          <div className="admin-alert error">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <div className="admin-actions">
          <Link to="/admin/fakemon" className="button secondary">
            <i className="fas fa-arrow-left"></i> Back to Fakemon List
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading fakemon data..." />
        ) : (
          <div className="bulk-monster-add-form">
            <form onSubmit={handleSubmit} className="reroller-content">
              <div className="reroller-content">
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
                      placeholder="e.g., Leaflet"
                      required
                      disabled={saving}
                    />
                  </div>

                  <AutocompleteInput
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={FAKEMON_CATEGORIES}
                    placeholder="e.g., Pokemon, Fakemon"
                    label="Category (Universe) *"
                    disabled={saving}
                  />

                  <div className="admin-form-group">
                    <label htmlFor="classification" className="admin-form-label">
                      Classification
                    </label>
                    <input
                      type="text"
                      id="classification"
                      name="classification"
                      value={formData.classification}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="e.g., The Mountain Goat Monster"
                      disabled={saving}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="image_url" className="admin-form-label">
                      Image
                    </label>
                    <BackendFileUpload
                      uploadEndpoint="/fakedex/admin/upload"
                      initialImageUrl={formData.image_url}
                      onUploadSuccess={(result) => {
                        if (result && result.secure_url) {
                          setFormData(prev => ({ ...prev, image_url: result.secure_url }));
                        } else {
                          setFormData(prev => ({ ...prev, image_url: '' }));
                        }
                      }}
                      onUploadError={(err) => setError(`Image upload failed: ${err}`)}
                      buttonText="Upload Fakemon Image"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleChange}
                      placeholder="Or enter image URL directly"
                      disabled={saving}
                      className="admin-form-input with-margin-top"
                    />
                  </div>
                </div>

                {/* Types and Attributes */}
                <div className="admin-form-section">
                  <h2 className="admin-form-section-title">Types and Attributes</h2>

                  <AutocompleteInput
                    id="type1"
                    name="type1"
                    value={formData.type1}
                    onChange={handleChange}
                    options={TYPES}
                    placeholder="Select Type"
                    label="Type 1 *"
                    required
                    disabled={saving}
                  />

                  <AutocompleteInput
                    id="type2"
                    name="type2"
                    value={formData.type2}
                    onChange={handleChange}
                    options={TYPES}
                    placeholder="None"
                    label="Type 2"
                    disabled={saving}
                  />

                  <AutocompleteInput
                    id="type3"
                    name="type3"
                    value={formData.type3}
                    onChange={handleChange}
                    options={TYPES}
                    placeholder="None"
                    label="Type 3"
                    disabled={saving}
                  />

                  <AutocompleteInput
                    id="type4"
                    name="type4"
                    value={formData.type4}
                    onChange={handleChange}
                    options={TYPES}
                    placeholder="None"
                    label="Type 4"
                    disabled={saving}
                  />

                  <AutocompleteInput
                    id="type5"
                    name="type5"
                    value={formData.type5}
                    onChange={handleChange}
                    options={TYPES}
                    placeholder="None"
                    label="Type 5"
                    disabled={saving}
                  />

                  <AutocompleteInput
                    id="attribute"
                    name="attribute"
                    value={formData.attribute}
                    onChange={handleChange}
                    options={ATTRIBUTES}
                    placeholder="None"
                    label="Attribute"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="admin-form-section">
                <h2 className="admin-form-section-title">Description</h2>
                <div className="admin-form-group">
                  <label htmlFor="description" className="admin-form-label">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="admin-form-input"
                    rows="4"
                    placeholder="Enter a description for this fakemon..."
                    disabled={saving}
                  ></textarea>
                </div>
              </div>

              {/* Abilities */}
              <div className="admin-form-section">
                <h2 className="admin-form-section-title">Abilities</h2>

                <AutocompleteInput
                  id="ability1"
                  name="ability1"
                  value={formData.ability1}
                  onChange={handleChange}
                  options={abilityOptions}
                  placeholder="e.g., Overgrow"
                  label="Ability 1"
                  showDescriptionBelow={true}
                  disabled={saving}
                />

                <AutocompleteInput
                  id="ability2"
                  name="ability2"
                  value={formData.ability2}
                  onChange={handleChange}
                  options={abilityOptions}
                  placeholder="e.g., Chlorophyll"
                  label="Ability 2"
                  showDescriptionBelow={true}
                  disabled={saving}
                />

                <AutocompleteInput
                  id="hidden_ability"
                  name="hidden_ability"
                  value={formData.hidden_ability}
                  onChange={handleChange}
                  options={abilityOptions}
                  placeholder="e.g., Leaf Guard"
                  label="Hidden Ability"
                  showDescriptionBelow={true}
                  disabled={saving}
                />
              </div>

              {/* Stats */}
              <div className="admin-form-section">
                <h2 className="admin-form-section-title">Base Stats</h2>

                {/* Stat Generator */}
                <div className="admin-stat-generator">
                  <h3 className="admin-stat-generator-title">
                    <i className="fas fa-dice"></i> Stat Generator
                  </h3>
                  <div className="admin-stat-generator-row">
                    <div className="admin-form-group power-level-group">
                      <label className="admin-form-label">Power Level</label>
                      <select
                        value={statPowerLevel}
                        onChange={(e) => setStatPowerLevel(e.target.value)}
                        className="admin-form-input"
                      >
                        <option value="">Select Power Level</option>
                        {POWER_LEVELS.map(pl => (
                          <option key={pl.value} value={pl.value}>{pl.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group specialty-group">
                      <label className="admin-form-label">Specialty Stats</label>
                      <div className="type-tags">
                        {SPECIALTY_OPTIONS.map(opt => (
                          <label key={opt.key} className="attribute-tag">
                            <input
                              type="checkbox"
                              checked={statSpecialties.includes(opt.key)}
                              onChange={() => handleSpecialtyToggle(opt.key)}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={handleRollStats}
                      disabled={!statPowerLevel}
                    >
                      <i className="fas fa-dice"></i> Roll Stats
                    </button>
                  </div>
                </div>

                <div className="button">
                  {STAT_KEYS.map(key => {
                    const labels = {
                      hp: 'HP', attack: 'Attack', defense: 'Defense',
                      special_attack: 'Special Attack', special_defense: 'Special Defense', speed: 'Speed'
                    };
                    const barClass = key.replace('_', '-');
                    return (
                      <div className="admin-form-group" key={key}>
                        <label htmlFor={key} className="admin-form-label">{labels[key]}</label>
                        <input
                          type="number"
                          id={key}
                          name={key}
                          value={formData[key]}
                          onChange={handleStatChange}
                          className="admin-form-input"
                          min="1"
                          max="255"
                          disabled={saving}
                        />
                        <div className="admin-stat-bar">
                          <div
                            className={`admin-stat-fill${barClass}`}
                            style={{ width: `${Math.min(100, (formData[key] / 255) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="admin-bst-display">
                  <strong>BST Total: {bstTotal}</strong>
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

                          <AutocompleteInput
                            id={`evo-name-${index}`}
                            name={`evo-name-${index}`}
                            value={evo.name || ''}
                            onChange={(e) => handleEvolutionChange(index, 'name', e.target.value)}
                            options={fakemonNames}
                            placeholder="e.g., Ivysaur"
                            label="Name"
                            helpText="May not exist yet"
                            disabled={saving}
                          />

                          <div className="admin-form-group">
                            <label className="admin-form-label">Method</label>
                            <select
                              value={evo.method || ''}
                              onChange={(e) => handleEvolutionChange(index, 'method', e.target.value)}
                              className="admin-form-input"
                              disabled={saving}
                            >
                              <option value="">None (Base)</option>
                              <option value="level">Level Up</option>
                              <option value="item">Item</option>
                              <option value="condition">Condition</option>
                            </select>
                          </div>

                          {evo.method === 'level' && (
                            <div className="admin-form-group">
                              <label className="admin-form-label">Level</label>
                              <input
                                type="text"
                                value={evo.level || ''}
                                onChange={(e) => handleEvolutionChange(index, 'level', e.target.value)}
                                className="admin-form-input"
                                placeholder="e.g., 16"
                                disabled={saving}
                              />
                            </div>
                          )}

                          <div className="admin-form-group">
                            <label className="admin-form-label">Method Detail</label>
                            <input
                              type="text"
                              value={evo.method_detail || ''}
                              onChange={(e) => handleEvolutionChange(index, 'method_detail', e.target.value)}
                              className="admin-form-input"
                              placeholder={
                                evo.method === 'item' ? 'e.g., Water Stone' :
                                evo.method === 'condition' ? 'e.g., friendship:255' :
                                evo.method === 'level' ? 'e.g., Level 16' :
                                'Details...'
                              }
                              disabled={saving}
                            />
                          </div>

                          <div className="admin-form-group">
                            <label className="admin-form-label">Evolves From</label>
                            <select
                              value={evo.evolves_from != null ? evo.evolves_from : ''}
                              onChange={(e) => handleEvolutionChange(index, 'evolves_from', e.target.value ? (parseInt(e.target.value) || e.target.value) : null)}
                              className="admin-form-input"
                              disabled={saving}
                            >
                              <option value="">None (Base Form)</option>
                              {evolvesFromOptions
                                .filter(opt => String(opt.value) !== String(evo.number))
                                .map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))
                              }
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeEvolution(index)}
                          className="button danger sm"
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
                  className="button secondary"
                  disabled={saving}
                >
                  <i className="fas fa-plus"></i> Add Evolution
                </button>

                {/* Evolution Tree Preview */}
                {evoTreePreview.length > 0 && (
                  <div className="admin-evo-preview">
                    <h4>
                      <i className="fas fa-sitemap"></i> Evolution Tree Preview
                    </h4>
                    {evoTreePreview.map(root => renderEvoPreviewNode(root))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="admin-form-actions">
                <Link to="/admin/fakemon" className="button secondary" disabled={saving}>
                  Cancel
                </Link>
                <button type="submit" className="button primary" disabled={saving}>
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
