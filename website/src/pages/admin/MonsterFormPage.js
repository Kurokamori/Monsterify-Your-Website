import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import monsterService from '../../services/monsterService';
import trainerService from '../../services/trainerService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

/**
 * Monster Form Page
 * Form for adding and editing monsters
 */
const MonsterFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [types, setTypes] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [fakemon, setFakemon] = useState([]);
  const [attributes, setAttributes] = useState(['Virus', 'Vaccine', 'Data', 'Free', 'Variable']);
  const [natures, setNatures] = useState([
    'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
    'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
    'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
    'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
    'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'
  ]);
  const [genders, setGenders] = useState(['Male', 'Female', 'Non-binary', 'Genderless']);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    trainer_id: '',
    level: 1,
    species1: '',
    species2: '',
    species3: '',
    type1: '',
    type2: '',
    type3: '',
    type4: '',
    type5: '',
    attribute: '',
    img_link: '',
    gender: '',
    nature: '',
    characteristic: '',
    ability1: '',
    ability2: '',
    hidden_ability: '',
    friendship: 70,
    shiny: false,
    alpha: false,
    shadow: false,
    paradox: false,
    pokerus: false,
    hp_total: 50,
    atk_total: 50,
    def_total: 50,
    spa_total: 50,
    spd_total: 50,
    spe_total: 50,
    hp_iv: 0,
    atk_iv: 0,
    def_iv: 0,
    spa_iv: 0,
    spd_iv: 0,
    spe_iv: 0,
    hp_ev: 0,
    atk_ev: 0,
    def_ev: 0,
    spa_ev: 0,
    spd_ev: 0,
    spe_ev: 0,
    moveset: [],
    tldr: '',
    bio: '',
    where_met: '',
    date_met: new Date().toISOString().split('T')[0],
    height: '',
    weight: '',
    pronouns: '',
    age: '',
    acquired: '',
    held_item: '',
    fav_berry: '',
    seal: '',
    mark: '',
    box_number: 1
  });

  // Fetch types, trainers, and monster data on component mount
  useEffect(() => {
    fetchTypes();
    fetchTrainers();
    fetchFakemon();

    if (isEditMode) {
      fetchMonster();
    }
  }, [isEditMode, id]);

  // Fetch all monster types
  const fetchTypes = async () => {
    setTypes(['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy']);
  };

  // Fetch all trainers
  const fetchTrainers = async () => {
    try {
      const response = await trainerService.getAllTrainers();
      setTrainers(response.trainers || []);
    } catch (err) {
      console.error('Error fetching trainers:', err);
      setError('Failed to load trainers. Please try again.');
    }
  };

  // Fetch all fakemon for species selection
  const fetchFakemon = async () => {
    try {
      const response = await monsterService.getAllFakemon();
      setFakemon(response.fakemon || []);
    } catch (err) {
      console.error('Error fetching fakemon:', err);
      setError('Failed to load fakemon. Please try again.');
    }
  };

  // Fetch monster data for editing
  const fetchMonster = async () => {
    try {
      setLoading(true);

      const response = await monsterService.getMonsterById(id);

      if (!response.success || !response.data) {
        setError(`Monster #${id} not found`);
        setLoading(false);
        return;
      }

      const monster = response.data;

      // Parse moveset if it's a string
      let moveset = [];
      try {
        if (typeof monster.moveset === 'string') {
          moveset = JSON.parse(monster.moveset);
        } else if (Array.isArray(monster.moveset)) {
          moveset = monster.moveset;
        }
      } catch (err) {
        console.error('Error parsing moveset:', err);
      }

      setFormData({
        ...monster,
        moveset
      });
    } catch (err) {
      console.error(`Error fetching monster #${id}:`, err);
      setError(`Failed to load monster #${id}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle checkboxes
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }

    // Handle numeric inputs
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
      return;
    }

    // Handle all other inputs
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle species selection
  const handleSpeciesChange = (e) => {
    const { name, value } = e.target;

    // Find the selected fakemon
    const selectedFakemon = fakemon.find(f => f.name === value);

    if (selectedFakemon) {
      // Update types based on the selected fakemon
      const types = [
        selectedFakemon.type1,
        selectedFakemon.type2,
        selectedFakemon.type3,
        selectedFakemon.type4,
        selectedFakemon.type5
      ].filter(Boolean);

      setFormData(prev => ({
        ...prev,
        [name]: value,
        type1: types[0] || prev.type1,
        type2: types[1] || '',
        type3: types[2] || '',
        type4: types[3] || '',
        type5: types[4] || '',
        attribute: selectedFakemon.attribute || prev.attribute
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle moveset changes
  const handleMoveChange = (index, value) => {
    setFormData(prev => {
      const newMoveset = [...prev.moveset];
      newMoveset[index] = value;
      return {
        ...prev,
        moveset: newMoveset
      };
    });
  };

  // Add move to moveset
  const addMove = () => {
    setFormData(prev => ({
      ...prev,
      moveset: [...prev.moveset, '']
    }));
  };

  // Remove move from moveset
  const removeMove = (index) => {
    setFormData(prev => ({
      ...prev,
      moveset: prev.moveset.filter((_, i) => i !== index)
    }));
  };

  // Initialize monster with stats, moves, etc.
  const initializeMonster = async () => {
    try {
      setSaving(true);

      // Create the monster first
      const createResponse = await monsterService.createMonster({
        ...formData,
        moveset: JSON.stringify(formData.moveset)
      });

      if (!createResponse.success) {
        setError(createResponse.message || 'Failed to create monster');
        setSaving(false);
        return;
      }

      const createdMonster = createResponse.data;

      // Initialize the monster
      const initResponse = await monsterService.initializeMonster(createdMonster.id);

      if (!initResponse.success) {
        setError(initResponse.message || 'Failed to initialize monster');
        setSaving(false);
        return;
      }

      // Navigate to the monster list with success message
      navigate('/admin/monsters', {
        state: { successMessage: `Monster ${createdMonster.name} created and initialized successfully` }
      });
    } catch (err) {
      console.error('Error initializing monster:', err);
      setError(`Failed to initialize monster: ${err.response?.data?.message || err.message}`);
      setSaving(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.trainer_id || !formData.species1 || !formData.type1) {
      setError('Name, trainer, species, and at least one type are required');
      return;
    }

    try {
      setSaving(true);

      // Prepare data for submission
      const submitData = {
        ...formData,
        moveset: JSON.stringify(formData.moveset)
      };

      if (isEditMode) {
        // Update existing monster
        const response = await monsterService.updateMonster(id, submitData);

        if (!response.success) {
          setError(response.message || 'Failed to update monster');
          setSaving(false);
          return;
        }

        navigate('/admin/monsters', {
          state: { successMessage: `Monster #${id} (${formData.name}) updated successfully` }
        });
      } else {
        // Create new monster and initialize it
        await initializeMonster();
      }
    } catch (err) {
      console.error('Error saving monster:', err);
      setError(`Failed to save monster: ${err.response?.data?.message || err.message}`);
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <div className="admin-dashboard">
        <div className="admin-dashboard-header">
          <h1 className="admin-dashboard-title">
            {isEditMode ? `Edit Monster #${id}` : 'Add New Monster'}
          </h1>
          <p className="admin-dashboard-subtitle">
            {isEditMode ? `Editing: ${formData.name}` : 'Create a new monster'}
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
          <Link to="/admin/monsters" className="button secondary">
            <i className="fas fa-arrow-left"></i> Back to Monster List
          </Link>
        </div>

        {/* Monster Form */}
        {loading ? (
          <LoadingSpinner message="Loading monster data..." />
        ) : (
          <div className="admin-form-container">
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="admin-form-tabs">
                <div
                  className={`admin-form-tab ${activeTab === 'basic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('basic')}
                >
                  Basic Info
                </div>
                <div
                  className={`admin-form-tab ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  Stats & Moves
                </div>
                <div
                  className={`admin-form-tab ${activeTab === 'appearance' ? 'active' : ''}`}
                  onClick={() => setActiveTab('appearance')}
                >
                  Appearance
                </div>
                <div
                  className={`admin-form-tab ${activeTab === 'biography' ? 'active' : ''}`}
                  onClick={() => setActiveTab('biography')}
                >
                  Biography
                </div>
              </div>

              <div className={`admin-form-tab-content ${activeTab === 'basic' ? 'active' : ''}`}>
                <div className="admin-form-grid">
                  {/* Basic Information */}
                  <div className="admin-form-section">
                    <h2 className="admin-form-section-title">Basic Information</h2>

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
                        placeholder="e.g., Sparky"
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="trainer_id" className="admin-form-label">
                        Trainer <span className="required">*</span>
                      </label>
                      <select
                        id="trainer_id"
                        name="trainer_id"
                        value={formData.trainer_id}
                        onChange={handleChange}
                        className="admin-form-select"
                        required
                        disabled={saving || isEditMode}
                      >
                        <option value="">Select Trainer</option>
                        {trainers.map(trainer => (
                          <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="level" className="admin-form-label">
                        Level <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="level"
                        name="level"
                        value={formData.level}
                        onChange={handleChange}
                        className="admin-form-input"
                        min="1"
                        max="100"
                        required
                        disabled={saving || isEditMode}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="species1" className="admin-form-label">
                        Species 1 <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="species1"
                        name="species1"
                        value={formData.species1}
                        onChange={handleChange}
                        className="admin-form-input"
                        placeholder="e.g., Mouse"
                        disabled={saving || isEditMode}
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
                        placeholder="e.g., Mouse"
                        disabled={saving || isEditMode}
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
                        placeholder="e.g., Electric"
                        disabled={saving || isEditMode}
                      />
                    </div>
                  </div>

                  {/* Types and Attributes */}
                  <div className="admin-form-section">
                    <h2 className="admin-form-section-title">Types and Attributes</h2>

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
                        disabled={saving || isEditMode}
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
                        disabled={saving || isEditMode}
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
                        disabled={saving || isEditMode}
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
                        disabled={saving || isEditMode}
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
                        disabled={saving || isEditMode}
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
                        disabled={saving || isEditMode}
                      >
                        <option value="">None</option>
                        {attributes.map(attr => (
                          <option key={attr} value={attr}>{attr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats & Moves Tab */}
              <div className={`admin-form-tab-content ${activeTab === 'stats' ? 'active' : ''}`}>
                <div className="admin-form-grid">
                  {/* Stats */}
                  <div className="admin-form-section">
                    <h2 className="admin-form-section-title">Base Stats</h2>

                    <div className="admin-stats-grid">
                      <div className="admin-form-group">
                        <label htmlFor="hp_total" className="admin-form-label">HP</label>
                        <input
                          type="number"
                          id="hp_total"
                          name="hp_total"
                          value={formData.hp_total}
                          onChange={handleChange}
                          className="admin-form-input"
                          min="1"
                          max="255"
                          disabled={saving}
                        />
                        <div className="admin-stat-bar">
                          <div
                            className="admin-stat-fill hp"
                            style={{ width: `${Math.min(100, (formData.hp_total / 255) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="atk_total" className="admin-form-label">Attack</label>
                        <input
                          type="number"
                          id="atk_total"
                          name="atk_total"
                          value={formData.atk_total}
                          onChange={handleChange}
                          className="admin-form-input"
                          min="1"
                          max="255"
                          disabled={saving}
                        />
                        <div className="admin-stat-bar">
                          <div
                            className="admin-stat-fill attack"
                            style={{ width: `${Math.min(100, (formData.atk_total / 255) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="def_total" className="admin-form-label">Defense</label>
                        <input
                          type="number"
                          id="def_total"
                          name="def_total"
                          value={formData.def_total}
                          onChange={handleChange}
                          className="admin-form-input"
                          min="1"
                          max="255"
                          disabled={saving}
                        />
                        <div className="admin-stat-bar">
                          <div
                            className="admin-stat-fill defense"
                            style={{ width: `${Math.min(100, (formData.def_total / 255) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="spa_total" className="admin-form-label">Sp. Attack</label>
                        <input
                          type="number"
                          id="spa_total"
                          name="spa_total"
                          value={formData.spa_total}
                          onChange={handleChange}
                          className="admin-form-input"
                          min="1"
                          max="255"
                          disabled={saving}
                        />
                        <div className="admin-stat-bar">
                          <div
                            className="admin-stat-fill special-attack"
                            style={{ width: `${Math.min(100, (formData.spa_total / 255) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="spd_total" className="admin-form-label">Sp. Defense</label>
                        <input
                          type="number"
                          id="spd_total"
                          name="spd_total"
                          value={formData.spd_total}
                          onChange={handleChange}
                          className="admin-form-input"
                          min="1"
                          max="255"
                          disabled={saving}
                        />
                        <div className="admin-stat-bar">
                          <div
                            className="admin-stat-fill special-defense"
                            style={{ width: `${Math.min(100, (formData.spd_total / 255) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="admin-form-group">
                        <label htmlFor="spe_total" className="admin-form-label">Speed</label>
                        <input
                          type="number"
                          id="spe_total"
                          name="spe_total"
                          value={formData.spe_total}
                          onChange={handleChange}
                          className="admin-form-input"
                          min="1"
                          max="255"
                          disabled={saving}
                        />
                        <div className="admin-stat-bar">
                          <div
                            className="admin-stat-fill speed"
                            style={{ width: `${Math.min(100, (formData.spe_total / 255) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* IVs and EVs */}
                  <div className="admin-form-section">
                    <h2 className="admin-form-section-title">IVs and EVs</h2>

                    <div className="admin-form-row">
                      <div className="admin-form-column">
                        <h3 className="admin-form-subtitle">IVs (0-31)</h3>

                        <div className="admin-form-group">
                          <label htmlFor="hp_iv" className="admin-form-label">HP IV</label>
                          <input
                            type="number"
                            id="hp_iv"
                            name="hp_iv"
                            value={formData.hp_iv}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="31"
                            disabled={saving}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label htmlFor="atk_iv" className="admin-form-label">Attack IV</label>
                          <input
                            type="number"
                            id="atk_iv"
                            name="atk_iv"
                            value={formData.atk_iv}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="31"
                            disabled={saving}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label htmlFor="def_iv" className="admin-form-label">Defense IV</label>
                          <input
                            type="number"
                            id="def_iv"
                            name="def_iv"
                            value={formData.def_iv}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="31"
                            disabled={saving}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label htmlFor="spa_iv" className="admin-form-label">Sp. Attack IV</label>
                          <input
                            type="number"
                            id="spa_iv"
                            name="spa_iv"
                            value={formData.spa_iv}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="31"
                            disabled={saving}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label htmlFor="spd_iv" className="admin-form-label">Sp. Defense IV</label>
                          <input
                            type="number"
                            id="spd_iv"
                            name="spd_iv"
                            value={formData.spd_iv}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="31"
                            disabled={saving}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label htmlFor="spe_iv" className="admin-form-label">Speed IV</label>
                          <input
                            type="number"
                            id="spe_iv"
                            name="spe_iv"
                            value={formData.spe_iv}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="31"
                            disabled={saving}
                          />
                        </div>
                      </div>

                      <div className="admin-form-column">
                        <h3 className="admin-form-subtitle">EVs (0-252)</h3>

                        <div className="admin-form-group">
                          <label htmlFor="hp_ev" className="admin-form-label">HP EV</label>
                          <input
                            type="number"
                            id="hp_ev"
                            name="hp_ev"
                            value={formData.hp_ev}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="252"
                            disabled={saving}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label htmlFor="atk_ev" className="admin-form-label">Attack EV</label>
                          <input
                            type="number"
                            id="atk_ev"
                            name="atk_ev"
                            value={formData.atk_ev}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="252"
                            disabled={saving}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label htmlFor="def_ev" className="admin-form-label">Defense EV</label>
                          <input
                            type="number"
                            id="def_ev"
                            name="def_ev"
                            value={formData.def_ev}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="252"
                            disabled={saving}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label htmlFor="spa_ev" className="admin-form-label">Sp. Attack EV</label>
                          <input
                            type="number"
                            id="spa_ev"
                            name="spa_ev"
                            value={formData.spa_ev}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="252"
                            disabled={saving}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label htmlFor="spd_ev" className="admin-form-label">Sp. Defense EV</label>
                          <input
                            type="number"
                            id="spd_ev"
                            name="spd_ev"
                            value={formData.spd_ev}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="252"
                            disabled={saving}
                          />
                        </div>

                        <div className="admin-form-group">
                          <label htmlFor="spe_ev" className="admin-form-label">Speed EV</label>
                          <input
                            type="number"
                            id="spe_ev"
                            name="spe_ev"
                            value={formData.spe_ev}
                            onChange={handleChange}
                            className="admin-form-input"
                            min="0"
                            max="252"
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Moves */}
                <div className="admin-form-section">
                  <h2 className="admin-form-section-title">Moves</h2>

                  {formData.moveset.length === 0 ? (
                    <p className="admin-form-hint">No moves added yet. Moves will be automatically generated when the monster is initialized.</p>
                  ) : (
                    <div className="admin-moves-list">
                      {formData.moveset.map((move, index) => (
                        <div key={index} className="admin-move-item">
                          <input
                            type="text"
                            value={move}
                            onChange={(e) => handleMoveChange(index, e.target.value)}
                            className="admin-form-input"
                            placeholder="Move name"
                            disabled={saving}
                          />

                          <button
                            type="button"
                            onClick={() => removeMove(index)}
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
                    onClick={addMove}
                    className="button secondary"
                    disabled={saving || formData.moveset.length >= 4}
                  >
                    <i className="fas fa-plus"></i> Add Move
                  </button>
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
                      placeholder="e.g., Static"
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
                      placeholder="e.g., Lightning Rod"
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
                      placeholder="e.g., Volt Absorb"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Appearance Tab */}
              <div className={`admin-form-tab-content ${activeTab === 'appearance' ? 'active' : ''}`}>
                <div className="admin-form-grid">
                  {/* Image */}
                  <div className="admin-form-section">
                    <h2 className="admin-form-section-title">Image</h2>

                    <div className="admin-form-group">
                      <label htmlFor="img_link" className="admin-form-label">
                        Image URL
                      </label>
                      <input
                        type="text"
                        id="img_link"
                        name="img_link"
                        value={formData.img_link}
                        onChange={handleChange}
                        className="admin-form-input"
                        placeholder="https://example.com/image.png"
                        disabled={saving}
                      />
                      {formData.img_link && (
                        <div className="admin-form-image-preview">
                          <img
                            src={formData.img_link}
                            alt="Monster preview"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/100?text=Invalid+URL';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Physical Characteristics */}
                  <div className="admin-form-section">
                    <h2 className="admin-form-section-title">Physical Characteristics</h2>

                    <div className="admin-form-group">
                      <label htmlFor="gender" className="admin-form-label">
                        Gender
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="admin-form-select"
                        disabled={saving}
                      >
                        <option value="">Select Gender</option>
                        {genders.map(gender => (
                          <option key={gender} value={gender}>{gender}</option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="pronouns" className="admin-form-label">
                        Pronouns
                      </label>
                      <input
                        type="text"
                        id="pronouns"
                        name="pronouns"
                        value={formData.pronouns}
                        onChange={handleChange}
                        className="admin-form-input"
                        placeholder="e.g., he/him"
                        disabled={saving}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="height" className="admin-form-label">
                        Height
                      </label>
                      <input
                        type="text"
                        id="height"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        className="admin-form-input"
                        placeholder="e.g., 0.4 m"
                        disabled={saving}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="weight" className="admin-form-label">
                        Weight
                      </label>
                      <input
                        type="text"
                        id="weight"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        className="admin-form-input"
                        placeholder="e.g., 6.0 kg"
                        disabled={saving}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="nature" className="admin-form-label">
                        Nature
                      </label>
                      <select
                        id="nature"
                        name="nature"
                        value={formData.nature}
                        onChange={handleChange}
                        className="admin-form-select"
                        disabled={saving}
                      >
                        <option value="">Select Nature</option>
                        {natures.map(nature => (
                          <option key={nature} value={nature}>{nature}</option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="characteristic" className="admin-form-label">
                        Characteristic
                      </label>
                      <input
                        type="text"
                        id="characteristic"
                        name="characteristic"
                        value={formData.characteristic}
                        onChange={handleChange}
                        className="admin-form-input"
                        placeholder="e.g., Loves to eat"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                {/* Special Characteristics */}
                <div className="admin-form-section">
                  <h2 className="admin-form-section-title">Special Characteristics</h2>

                  <div className="admin-form-checkboxes">
                    <div className="admin-form-checkbox">
                      <input
                        type="checkbox"
                        id="shiny"
                        name="shiny"
                        checked={formData.shiny}
                        onChange={handleChange}
                        disabled={saving}
                      />
                      <label htmlFor="shiny">Shiny</label>
                    </div>

                    <div className="admin-form-checkbox">
                      <input
                        type="checkbox"
                        id="alpha"
                        name="alpha"
                        checked={formData.alpha}
                        onChange={handleChange}
                        disabled={saving}
                      />
                      <label htmlFor="alpha">Alpha</label>
                    </div>

                    <div className="admin-form-checkbox">
                      <input
                        type="checkbox"
                        id="shadow"
                        name="shadow"
                        checked={formData.shadow}
                        onChange={handleChange}
                        disabled={saving}
                      />
                      <label htmlFor="shadow">Shadow</label>
                    </div>

                    <div className="admin-form-checkbox">
                      <input
                        type="checkbox"
                        id="paradox"
                        name="paradox"
                        checked={formData.paradox}
                        onChange={handleChange}
                        disabled={saving}
                      />
                      <label htmlFor="paradox">Paradox</label>
                    </div>

                    <div className="admin-form-checkbox">
                      <input
                        type="checkbox"
                        id="pokerus"
                        name="pokerus"
                        checked={formData.pokerus}
                        onChange={handleChange}
                        disabled={saving}
                      />
                      <label htmlFor="pokerus">Pokérus</label>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="admin-form-section">
                  <h2 className="admin-form-section-title">Items</h2>

                  <div className="admin-form-group">
                    <label htmlFor="held_item" className="admin-form-label">
                      Held Item
                    </label>
                    <input
                      type="text"
                      id="held_item"
                      name="held_item"
                      value={formData.held_item}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="e.g., Light Ball"
                      disabled={saving}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="fav_berry" className="admin-form-label">
                      Favorite Berry
                    </label>
                    <input
                      type="text"
                      id="fav_berry"
                      name="fav_berry"
                      value={formData.fav_berry}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="e.g., Oran Berry"
                      disabled={saving}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="seal" className="admin-form-label">
                      Seal
                    </label>
                    <input
                      type="text"
                      id="seal"
                      name="seal"
                      value={formData.seal}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="e.g., Heart Seal"
                      disabled={saving}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="mark" className="admin-form-label">
                      Mark
                    </label>
                    <input
                      type="text"
                      id="mark"
                      name="mark"
                      value={formData.mark}
                      onChange={handleChange}
                      className="admin-form-input"
                      placeholder="e.g., Rare Mark"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Biography Tab */}
              <div className={`admin-form-tab-content ${activeTab === 'biography' ? 'active' : ''}`}>
                <div className="admin-form-grid">
                  {/* Biography */}
                  <div className="admin-form-section">
                    <h2 className="admin-form-section-title">Biography</h2>

                    <div className="admin-form-group">
                      <label htmlFor="tldr" className="admin-form-label">
                        TLDR (Short Description)
                      </label>
                      <input
                        type="text"
                        id="tldr"
                        name="tldr"
                        value={formData.tldr}
                        onChange={handleChange}
                        className="admin-form-input"
                        placeholder="A short description of the monster"
                        disabled={saving}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="bio" className="admin-form-label">
                        Biography
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        className="admin-form-textarea"
                        rows="6"
                        placeholder="Full biography of the monster"
                        disabled={saving}
                      ></textarea>
                    </div>
                  </div>

                  {/* Acquisition */}
                  <div className="admin-form-section">
                    <h2 className="admin-form-section-title">Acquisition</h2>

                    <div className="admin-form-group">
                      <label htmlFor="where_met" className="admin-form-label">
                        Where Met
                      </label>
                      <input
                        type="text"
                        id="where_met"
                        name="where_met"
                        value={formData.where_met}
                        onChange={handleChange}
                        className="admin-form-input"
                        placeholder="e.g., Viridian Forest"
                        disabled={saving}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="date_met" className="admin-form-label">
                        Date Met
                      </label>
                      <input
                        type="date"
                        id="date_met"
                        name="date_met"
                        value={formData.date_met}
                        onChange={handleChange}
                        className="admin-form-input"
                        disabled={saving}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="acquired" className="admin-form-label">
                        How Acquired
                      </label>
                      <input
                        type="text"
                        id="acquired"
                        name="acquired"
                        value={formData.acquired}
                        onChange={handleChange}
                        className="admin-form-input"
                        placeholder="e.g., Caught in a Poké Ball"
                        disabled={saving}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="friendship" className="admin-form-label">
                        Friendship (0-255)
                      </label>
                      <input
                        type="number"
                        id="friendship"
                        name="friendship"
                        value={formData.friendship}
                        onChange={handleChange}
                        className="admin-form-input"
                        min="0"
                        max="255"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                {/* Storage */}
                <div className="admin-form-section">
                  <h2 className="admin-form-section-title">Storage</h2>

                  <div className="admin-form-group">
                    <label htmlFor="box_number" className="admin-form-label">
                      Box Number
                    </label>
                    <input
                      type="number"
                      id="box_number"
                      name="box_number"
                      value={formData.box_number}
                      onChange={handleChange}
                      className="admin-form-input"
                      min="1"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="admin-form-actions">
                <Link
                  to="/admin/monsters"
                  className="button secondary"
                  disabled={saving}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="button primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i> {isEditMode ? 'Update Monster' : 'Create Monster'}
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

export default MonsterFormPage;
