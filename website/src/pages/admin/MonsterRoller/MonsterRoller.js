import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import ErrorMessage from '../../../components/common/ErrorMessage';
import AdminTrainerSelector from '../../../components/admin/AdminTrainerSelector';
import MonsterCard from '../../../components/monsters/MonsterCard';

const MonsterRoller = () => {
  // State for form inputs
  const [formData, setFormData] = useState({
    tables: ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals'],
    // Species slots
    species1: '',
    species2: '',
    species3: '',
    includeSpecies1: [],
    excludeSpecies1: [],
    includeSpecies2: [],
    excludeSpecies2: [],
    includeSpecies3: [],
    excludeSpecies3: [],
    // Type slots
    type1: '',
    type2: '',
    type3: '',
    type4: '',
    type5: '',
    includeType1: [],
    excludeType1: [],
    includeType2: [],
    excludeType2: [],
    includeType3: [],
    excludeType3: [],
    includeType4: [],
    excludeType4: [],
    includeType5: [],
    excludeType5: [],
    // Other fields
    attribute: '',
    rank: '',
    stage: '',
    legendary: '',
    mythical: '',
    families: '',
    levelRequired: '',
    ndex: '',
    evolvesFrom: '',
    evolvesTo: '',
    breedingResults: '',
    includeName: [],
    excludeName: [],
    includeAttributes: [],
    excludeAttributes: [],
    includeRanks: [],
    excludeRanks: [],
    includeStages: [],
    excludeStages: [],
    // Quantity settings
    species_min: 1,
    species_max: 2, // Default to max 2 species
    types_min: 1,
    types_max: 3, // Default to max 3 types
    seed: '',
    count: 1
  });

  // State for options
  const [options, setOptions] = useState({
    names: [],
    types: [],
    attributes: [],
    ranks: [],
    stages: [],
    families: [],
    tables: [],
    tableSchemas: {}
  });

  // State for results
  const [results, setResults] = useState([]);

  // State for loading and error
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for add to trainer
  const [addToTrainer, setAddToTrainer] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Fetch options on component mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setOptionsLoading(true);
        setError(null);

        const response = await api.get('/monster-roller/options');
        setOptions(response.data.data);

        // Update formData with available tables
        setFormData(prev => ({
          ...prev,
          tables: response.data.data.tables
        }));
      } catch (err) {
        console.error('Error fetching options:', err);
        setError('Failed to load options. Please try again later.');
      } finally {
        setOptionsLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked ? true : ''
    }));
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);

    setFormData(prev => ({
      ...prev,
      [name]: selectedValues
    }));
  };

  // Handle table selection changes
  const handleTableChange = (e) => {
    const { value, checked } = e.target;

    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          tables: [...prev.tables, value]
        };
      } else {
        return {
          ...prev,
          tables: prev.tables.filter(table => table !== value)
        };
      }
    });
  };

  // Handle trainer selection
  const handleTrainerChange = (trainerId) => {
    setSelectedTrainer(trainerId);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setResults([]);

      // Prepare data for API
      const apiData = { ...formData };

      // Remove empty string values
      Object.keys(apiData).forEach(key => {
        if (apiData[key] === '') {
          delete apiData[key];
        }
      });

      // Call appropriate API endpoint
      let response;
      if (addToTrainer && selectedTrainer) {
        response = await api.post('/monster-roller/roll/trainer', {
          ...apiData,
          trainerId: selectedTrainer
        });
      } else {
        response = await api.post('/monster-roller/roll/many', apiData);
      }

      // Set results
      setResults(response.data.data);

      // Update seed for repeatable rolls
      setFormData(prev => ({
        ...prev,
        seed: response.data.seed
      }));
    } catch (err) {
      console.error('Error rolling monsters:', err);
      setError('Failed to roll monsters. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      tables: options.tables || ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals'],
      // Species slots
      species1: '',
      species2: '',
      species3: '',
      includeSpecies1: [],
      excludeSpecies1: [],
      includeSpecies2: [],
      excludeSpecies2: [],
      includeSpecies3: [],
      excludeSpecies3: [],
      // Type slots
      type1: '',
      type2: '',
      type3: '',
      type4: '',
      type5: '',
      includeType1: [],
      excludeType1: [],
      includeType2: [],
      excludeType2: [],
      includeType3: [],
      excludeType3: [],
      includeType4: [],
      excludeType4: [],
      includeType5: [],
      excludeType5: [],
      // Other fields
      attribute: '',
      rank: '',
      stage: '',
      legendary: '',
      mythical: '',
      families: '',
      levelRequired: '',
      ndex: '',
      evolvesFrom: '',
      evolvesTo: '',
      breedingResults: '',
      includeName: [],
      excludeName: [],
      includeAttributes: [],
      excludeAttributes: [],
      includeRanks: [],
      excludeRanks: [],
      includeStages: [],
      excludeStages: [],
      // Quantity settings
      species_min: 1,
      species_max: 2, // Default to max 2 species
      types_min: 1,
      types_max: 3, // Default to max 3 types
      seed: '',
      count: 1
    });
    setResults([]);
    setError(null);
  };

  if (optionsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="monster-roller-container">
      <h1>Monster Roller</h1>
      <p className="monster-roller-description">
        Use this tool to roll monsters with specific parameters. You can roll multiple monsters at once
        and optionally add them to a trainer's collection.
      </p>

      {error && <ErrorMessage message={error} />}

      <div className="monster-roller-content">
        <form onSubmit={handleSubmit} className="monster-roller-form">
          <div className="form-section">
            <h3>Monster Tables</h3>
            <div className="checkbox-group">
              {options.tables.map(table => (
                <label key={table} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={table}
                    checked={formData.tables.includes(table)}
                    onChange={handleTableChange}
                  />
                  {table.charAt(0).toUpperCase() + table.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Species Settings</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="species1">Species 1</label>
                <select
                  id="species1"
                  name="species1"
                  value={formData.species1}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="species2">Species 2</label>
                <select
                  id="species2"
                  name="species2"
                  value={formData.species2}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="species3">Species 3</label>
                <select
                  id="species3"
                  name="species3"
                  value={formData.species3}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="includeSpecies1">Include Species 1</label>
                <select
                  id="includeSpecies1"
                  name="includeSpecies1"
                  multiple
                  value={formData.includeSpecies1}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>

              <div className="form-group">
                <label htmlFor="excludeSpecies1">Exclude Species 1</label>
                <select
                  id="excludeSpecies1"
                  name="excludeSpecies1"
                  multiple
                  value={formData.excludeSpecies1}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="includeSpecies2">Include Species 2</label>
                <select
                  id="includeSpecies2"
                  name="includeSpecies2"
                  multiple
                  value={formData.includeSpecies2}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>

              <div className="form-group">
                <label htmlFor="excludeSpecies2">Exclude Species 2</label>
                <select
                  id="excludeSpecies2"
                  name="excludeSpecies2"
                  multiple
                  value={formData.excludeSpecies2}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="includeSpecies3">Include Species 3</label>
                <select
                  id="includeSpecies3"
                  name="includeSpecies3"
                  multiple
                  value={formData.includeSpecies3}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>

              <div className="form-group">
                <label htmlFor="excludeSpecies3">Exclude Species 3</label>
                <select
                  id="excludeSpecies3"
                  name="excludeSpecies3"
                  multiple
                  value={formData.excludeSpecies3}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Type Settings</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type1">Type 1</label>
                <select
                  id="type1"
                  name="type1"
                  value={formData.type1}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
                    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
                    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="type2">Type 2</label>
                <select
                  id="type2"
                  name="type2"
                  value={formData.type2}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
                    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
                    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="type3">Type 3</label>
                <select
                  id="type3"
                  name="type3"
                  value={formData.type3}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
                    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
                    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type4">Type 4</label>
                <select
                  id="type4"
                  name="type4"
                  value={formData.type4}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
                    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
                    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="type5">Type 5</label>
                <select
                  id="type5"
                  name="type5"
                  value={formData.type5}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
                    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
                    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="includeType1">Include Type 1</label>
                <select
                  id="includeType1"
                  name="includeType1"
                  multiple
                  value={formData.includeType1}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
                    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
                    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>

              <div className="form-group">
                <label htmlFor="excludeType1">Exclude Type 1</label>
                <select
                  id="excludeType1"
                  name="excludeType1"
                  multiple
                  value={formData.excludeType1}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
                    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
                    'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <select
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="includeName">Include Names</label>
                <select
                  id="includeName"
                  name="includeName"
                  multiple
                  value={formData.includeName}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>

              <div className="form-group">
                <label htmlFor="excludeName">Exclude Names</label>
                <select
                  id="excludeName"
                  name="excludeName"
                  multiple
                  value={formData.excludeName}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.names.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Attributes & Rarity</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="attribute">Attribute</label>
                <select
                  id="attribute"
                  name="attribute"
                  value={formData.attribute}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {options.attributes.map(attribute => (
                    <option key={attribute} value={attribute}>{attribute}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="rank">Rank</label>
                <select
                  id="rank"
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {options.ranks.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="stage">Stage</label>
                <select
                  id="stage"
                  name="stage"
                  value={formData.stage}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {options.stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="legendary">Legendary</label>
                <select
                  id="legendary"
                  name="legendary"
                  value={formData.legendary}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="mythical">Mythical</label>
                <select
                  id="mythical"
                  name="mythical"
                  value={formData.mythical}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="families">Digimon Families</label>
                <select
                  id="families"
                  name="families"
                  value={formData.families}
                  onChange={handleInputChange}
                >
                  <option value="">Any</option>
                  {options.families.map(family => (
                    <option key={family} value={family}>{family}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="includeAttributes">Include Attributes</label>
                <select
                  id="includeAttributes"
                  name="includeAttributes"
                  multiple
                  value={formData.includeAttributes}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.attributes.map(attribute => (
                    <option key={attribute} value={attribute}>{attribute}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>

              <div className="form-group">
                <label htmlFor="excludeAttributes">Exclude Attributes</label>
                <select
                  id="excludeAttributes"
                  name="excludeAttributes"
                  multiple
                  value={formData.excludeAttributes}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.attributes.map(attribute => (
                    <option key={attribute} value={attribute}>{attribute}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="includeRanks">Include Ranks</label>
                <select
                  id="includeRanks"
                  name="includeRanks"
                  multiple
                  value={formData.includeRanks}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.ranks.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>

              <div className="form-group">
                <label htmlFor="excludeRanks">Exclude Ranks</label>
                <select
                  id="excludeRanks"
                  name="excludeRanks"
                  multiple
                  value={formData.excludeRanks}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.ranks.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="includeStages">Include Stages</label>
                <select
                  id="includeStages"
                  name="includeStages"
                  multiple
                  value={formData.includeStages}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>

              <div className="form-group">
                <label htmlFor="excludeStages">Exclude Stages</label>
                <select
                  id="excludeStages"
                  name="excludeStages"
                  multiple
                  value={formData.excludeStages}
                  onChange={handleMultiSelectChange}
                  className="multi-select"
                >
                  {options.stages.map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
                <small>Hold Ctrl/Cmd to select multiple</small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Additional Parameters</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="levelRequired">Level Required (Digimon)</label>
                <input
                  type="number"
                  id="levelRequired"
                  name="levelRequired"
                  value={formData.levelRequired}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Any"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ndex">Pokedex Number</label>
                <input
                  type="number"
                  id="ndex"
                  name="ndex"
                  value={formData.ndex}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Any"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="evolvesFrom">Evolves From</label>
                <input
                  type="text"
                  id="evolvesFrom"
                  name="evolvesFrom"
                  value={formData.evolvesFrom}
                  onChange={handleInputChange}
                  placeholder="Any"
                />
              </div>

              <div className="form-group">
                <label htmlFor="evolvesTo">Evolves To</label>
                <input
                  type="text"
                  id="evolvesTo"
                  name="evolvesTo"
                  value={formData.evolvesTo}
                  onChange={handleInputChange}
                  placeholder="Any"
                />
              </div>

              <div className="form-group">
                <label htmlFor="breedingResults">Breeding Results</label>
                <input
                  type="text"
                  id="breedingResults"
                  name="breedingResults"
                  value={formData.breedingResults}
                  onChange={handleInputChange}
                  placeholder="Any"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Species & Types Quantity Settings</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="species_min">Min Species</label>
                <input
                  type="number"
                  id="species_min"
                  name="species_min"
                  value={formData.species_min}
                  onChange={handleInputChange}
                  min="1"
                  max="3"
                />
                <small>Minimum number of species (1-3)</small>
              </div>

              <div className="form-group">
                <label htmlFor="species_max">Max Species</label>
                <input
                  type="number"
                  id="species_max"
                  name="species_max"
                  value={formData.species_max}
                  onChange={handleInputChange}
                  min="1"
                  max="3"
                />
                <small>Maximum number of species (1-3)</small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="types_min">Min Types</label>
                <input
                  type="number"
                  id="types_min"
                  name="types_min"
                  value={formData.types_min}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                />
                <small>Minimum number of types (1-5)</small>
              </div>

              <div className="form-group">
                <label htmlFor="types_max">Max Types</label>
                <input
                  type="number"
                  id="types_max"
                  name="types_max"
                  value={formData.types_max}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                />
                <small>Maximum number of types (1-5)</small>
              </div>
            </div>

            <div className="form-info">
              <p>
                <strong>How the Monster Roller works:</strong>
              </p>
              <ul>
                <li>A random number of species slots (between Min and Max) will be filled, creating occasional fusions</li>
                <li>A random number of types (between Min and Max) will be selected from the 18 standard Pokémon types</li>
                <li>A random attribute (Data, Virus, Vaccine, Variable, Free) will be selected</li>
              </ul>
              <p>
                <strong>Default Parameters:</strong>
              </p>
              <ul>
                <li>Max 2 species and max 3 types</li>
                <li>Pokémon: Only Base Stage or Doesn't Evolve, no legendaries or mythicals</li>
                <li>Nexomon & Yo-kai: Only Base Stage or Doesn't Evolve</li>
                <li>Digimon: Only Baby I, Baby II, and Child ranks</li>
              </ul>
            </div>
          </div>

          <div className="form-section">
            <h3>Roll Options</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="seed">Seed (for repeatable rolls)</label>
                <input
                  type="text"
                  id="seed"
                  name="seed"
                  value={formData.seed}
                  onChange={handleInputChange}
                  placeholder="Leave blank for random seed"
                />
              </div>

              <div className="form-group">
                <label htmlFor="count">Count</label>
                <input
                  type="number"
                  id="count"
                  name="count"
                  value={formData.count}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={addToTrainer}
                    onChange={() => setAddToTrainer(!addToTrainer)}
                  />
                  Add to Trainer
                </label>
              </div>

              {addToTrainer && (
                <div className="trainer-selector-container">
                  <AdminTrainerSelector
                    selectedTrainerId={selectedTrainer}
                    onChange={handleTrainerChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="button success" disabled={loading}>
              {loading ? 'Rolling...' : 'Roll Monsters'}
            </button>
            <button type="button" className="button secondary" onClick={handleReset} disabled={loading}>
              Reset Form
            </button>
          </div>
        </form>

        <div className="monster-roller-results">
          <h2>Results</h2>

          {loading ? (
            <LoadingSpinner />
          ) : results.length > 0 ? (
            <div className="monster-results-grid">
              {results.map((monster, index) => (
                <MonsterCard key={index} monster={monster} />
              ))}
            </div>
          ) : (
            <p className="no-results">No monsters rolled yet. Adjust parameters and click "Roll Monsters".</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonsterRoller;
