import { useState, useEffect } from 'react';
import api from '../../services/api';

interface MonsterData {
  id?: number;
  name?: string;
  species?: string | string[];
  types?: string | string[];
  attribute?: string;
  image?: string;
  position?: number;
  level?: number;
  hp_total?: number; hp_iv?: number; hp_ev?: number;
  atk_total?: number; atk_iv?: number; atk_ev?: number;
  def_total?: number; def_iv?: number; def_ev?: number;
  spa_total?: number; spa_iv?: number; spa_ev?: number;
  spd_total?: number; spd_iv?: number; spd_ev?: number;
  spe_total?: number; spe_iv?: number; spe_ev?: number;
  friendship?: number;
  moveset?: string;
}

interface MonsterFormProps {
  monster?: MonsterData | null;
  personId?: number;
  position?: number;
  onSave: () => void;
  onCancel: () => void;
}

interface FormState {
  name: string;
  species: string[];
  types: string[];
  attribute: string;
  image: string;
  position: number;
  level: number;
  hp_total: number; hp_iv: number; hp_ev: number;
  atk_total: number; atk_iv: number; atk_ev: number;
  def_total: number; def_iv: number; def_ev: number;
  spa_total: number; spa_iv: number; spa_ev: number;
  spd_total: number; spd_iv: number; spd_ev: number;
  spe_total: number; spe_iv: number; spe_ev: number;
  friendship: number;
  moveset: string;
}

const ATTRIBUTES = [
  { value: 'virus', label: 'Virus', icon: 'fas fa-bug', color: '#8B4513' },
  { value: 'vaccine', label: 'Vaccine', icon: 'fas fa-shield-alt', color: '#4CAF50' },
  { value: 'data', label: 'Data', icon: 'fas fa-database', color: '#2196F3' },
  { value: 'free', label: 'Free', icon: 'fas fa-infinity', color: '#9C27B0' },
  { value: 'variable', label: 'Variable', icon: 'fas fa-exchange-alt', color: '#FF9800' }
];

const COMMON_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
  'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
  'Steel', 'Fairy'
];

const TYPE_COLORS: Record<string, string> = {
  normal: 'var(--normal-type)',
  fire: 'var(--fire-type)',
  water: 'var(--water-type)',
  electric: 'var(--electric-type)',
  grass: 'var(--grass-type)',
  ice: 'var(--ice-type)',
  fighting: 'var(--fighting-type)',
  poison: 'var(--poison-type)',
  ground: 'var(--ground-type)',
  flying: 'var(--flying-type)',
  psychic: 'var(--psychic-type)',
  bug: 'var(--bug-type)',
  rock: 'var(--rock-type)',
  ghost: 'var(--ghost-type)',
  dragon: 'var(--dragon-type)',
  dark: 'var(--dark-type)',
  steel: 'var(--steel-type)',
  fairy: 'var(--fairy-type)',
  light: 'var(--light-type)',
  cosmic: 'var(--cosmic-type)'
};

function getTypeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] || '#999';
}

function randomIV(): number {
  return Math.floor(Math.random() * 32);
}

function parseArrayField(value: unknown): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return []; }
  }
  return [];
}

function getDefaultFormState(position?: number): FormState {
  return {
    name: '', species: [], types: [], attribute: '', image: '',
    position: position || 1, level: 1,
    hp_total: 50, hp_iv: randomIV(), hp_ev: 0,
    atk_total: 50, atk_iv: randomIV(), atk_ev: 0,
    def_total: 50, def_iv: randomIV(), def_ev: 0,
    spa_total: 50, spa_iv: randomIV(), spa_ev: 0,
    spd_total: 50, spd_iv: randomIV(), spd_ev: 0,
    spe_total: 50, spe_iv: randomIV(), spe_ev: 0,
    friendship: 70, moveset: '[]'
  };
}

export function MonsterForm({ monster, personId, position, onSave, onCancel }: MonsterFormProps) {
  const [formData, setFormData] = useState<FormState>(() => getDefaultFormState(position));
  const [newSpecies, setNewSpecies] = useState('');
  const [newType, setNewType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (monster) {
      const species = parseArrayField(monster.species);
      const types = parseArrayField(monster.types);
      setFormData({
        name: monster.name || '', species, types,
        attribute: monster.attribute || '', image: monster.image || '',
        position: monster.position || position || 1, level: monster.level || 1,
        hp_total: monster.hp_total || 50, hp_iv: monster.hp_iv ?? randomIV(), hp_ev: monster.hp_ev || 0,
        atk_total: monster.atk_total || 50, atk_iv: monster.atk_iv ?? randomIV(), atk_ev: monster.atk_ev || 0,
        def_total: monster.def_total || 50, def_iv: monster.def_iv ?? randomIV(), def_ev: monster.def_ev || 0,
        spa_total: monster.spa_total || 50, spa_iv: monster.spa_iv ?? randomIV(), spa_ev: monster.spa_ev || 0,
        spd_total: monster.spd_total || 50, spd_iv: monster.spd_iv ?? randomIV(), spd_ev: monster.spd_ev || 0,
        spe_total: monster.spe_total || 50, spe_iv: monster.spe_iv ?? randomIV(), spe_ev: monster.spe_ev || 0,
        friendship: monster.friendship || 70, moveset: monster.moveset || '[]'
      });
    }
  }, [monster, position]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSpecies = () => {
    if (!newSpecies.trim()) return;
    if (formData.species.length >= 3) { setError('Maximum 3 species allowed'); return; }
    setFormData(prev => ({ ...prev, species: [...prev.species, newSpecies.trim()] }));
    setNewSpecies('');
    setError(null);
  };

  const handleRemoveSpecies = (index: number) => {
    setFormData(prev => ({ ...prev, species: prev.species.filter((_, i) => i !== index) }));
  };

  const handleAddType = (typeToAdd: string) => {
    if (formData.types.includes(typeToAdd)) { setError('Type already added'); return; }
    if (formData.types.length >= 5) { setError('Maximum 5 types allowed'); return; }
    setFormData(prev => ({ ...prev, types: [...prev.types, typeToAdd] }));
    setError(null);
  };

  const handleAddCustomType = () => {
    if (!newType.trim()) return;
    handleAddType(newType.trim());
    setNewType('');
  };

  const handleRemoveType = (index: number) => {
    setFormData(prev => ({ ...prev, types: prev.types.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Monster name is required'); return; }
    if (!formData.attribute) { setError('Attribute is required'); return; }
    if (formData.species.length === 0) { setError('At least one species is required'); return; }
    if (formData.types.length === 0) { setError('At least one type is required'); return; }

    try {
      setLoading(true);
      setError(null);
      const submitData = {
        name: formData.name.trim(), species: formData.species, types: formData.types,
        attribute: formData.attribute, image: formData.image.trim() || null,
        position: formData.position, level: formData.level,
        hp_total: formData.hp_total, hp_iv: formData.hp_iv, hp_ev: formData.hp_ev,
        atk_total: formData.atk_total, atk_iv: formData.atk_iv, atk_ev: formData.atk_ev,
        def_total: formData.def_total, def_iv: formData.def_iv, def_ev: formData.def_ev,
        spa_total: formData.spa_total, spa_iv: formData.spa_iv, spa_ev: formData.spa_ev,
        spd_total: formData.spd_total, spd_iv: formData.spd_iv, spd_ev: formData.spd_ev,
        spe_total: formData.spe_total, spe_iv: formData.spe_iv, spe_ev: formData.spe_ev,
        friendship: formData.friendship, moveset: formData.moveset
      };
      if (monster?.id) {
        await api.put(`/admin/monsters/${monster.id}`, submitData);
      } else {
        await api.post(`/admin/faction-people/${personId}/team`, submitData);
      }
      onSave();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Failed to save monster');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-lg">
        <div className="tree-header">
          <h3><i className="fas fa-dragon"></i> {monster ? 'Edit Monster' : 'Add New Monster'}</h3>
          <button className="button close no-flex" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="monster-form">
          <div className="form-sections">
            {/* Basic Info */}
            <div className="form-section">
              <h4>Basic Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Monster Name <span className="required-indicator">*</span></label>
                  <input type="text" id="name" name="name" value={formData.name}
                    onChange={handleInputChange} className="form-input" placeholder="Enter monster name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="position">Position</label>
                  <select id="position" name="position" value={formData.position} onChange={handleInputChange} className="form-input">
                    <option value={1}>Position 1</option>
                    <option value={2}>Position 2</option>
                    <option value={3}>Position 3</option>
                    <option value={4}>Position 4</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="image">Monster Image URL</label>
                <input type="url" id="image" name="image" value={formData.image}
                  onChange={handleInputChange} className="form-input" placeholder="https://example.com/monster-image.jpg" />
              </div>
            </div>

            {/* Attribute */}
            <div className="form-section">
              <h4>Attribute <span className="required-indicator">*</span></h4>
              <div className="attributes-grid">
                {ATTRIBUTES.map(attr => (
                  <label key={attr.value} className={`attribute-option ${formData.attribute === attr.value ? 'selected' : ''}`}>
                    <input type="radio" name="attribute" value={attr.value}
                      checked={formData.attribute === attr.value} onChange={handleInputChange} />
                    <div className="ability-pill" style={{ borderColor: attr.color }}>
                      <i className={attr.icon} style={{ color: attr.color }}></i>
                      <span>{attr.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Species */}
            <div className="form-section">
              <h4>Species (1-3 required) <span className="required-indicator">*</span></h4>
              <div className="tag-input-row">
                <input type="text" value={newSpecies} onChange={(e) => setNewSpecies(e.target.value)}
                  className="form-input" placeholder="Enter species name"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSpecies(); } }} />
                <button type="button" className="button primary sm" onClick={handleAddSpecies}
                  disabled={formData.species.length >= 3}>
                  <i className="fas fa-plus"></i> Add
                </button>
              </div>
              <div className="tags-container">
                {formData.species.map((species, index) => (
                  <span key={index} className="tag species-tag">
                    {species}
                    <button type="button" className="tag-remove" onClick={() => handleRemoveSpecies(index)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Types */}
            <div className="form-section">
              <h4>Types (1-5 required) <span className="required-indicator">*</span></h4>
              <div className="types-section">
                <div className="common-types">
                  <h5>Common Types:</h5>
                  <div className="types-grid">
                    {COMMON_TYPES.map(type => (
                      <button key={type} type="button"
                        className={`type-btn ${formData.types.includes(type) ? 'selected' : ''}`}
                        style={{
                          backgroundColor: formData.types.includes(type) ? getTypeColor(type) : '#f8f9fa',
                          color: formData.types.includes(type) ? 'white' : '#333'
                        }}
                        onClick={() => formData.types.includes(type)
                          ? handleRemoveType(formData.types.indexOf(type))
                          : handleAddType(type)
                        }
                        disabled={!formData.types.includes(type) && formData.types.length >= 5}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="custom-type">
                  <h5>Custom Type:</h5>
                  <div className="tag-input-row">
                    <input type="text" value={newType} onChange={(e) => setNewType(e.target.value)}
                      className="form-input" placeholder="Enter custom type"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomType(); } }} />
                    <button type="button" className="button primary sm" onClick={handleAddCustomType}
                      disabled={formData.types.length >= 5}>
                      <i className="fas fa-plus"></i> Add
                    </button>
                  </div>
                </div>
                <div className="selected-types">
                  <h5>Selected Types:</h5>
                  <div className="tags-container">
                    {formData.types.map((type, index) => (
                      <span key={index} className="tag type-tag" style={{ backgroundColor: getTypeColor(type) }}>
                        {type}
                        <button type="button" className="tag-remove" onClick={() => handleRemoveType(index)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert error">
              <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="button secondary" onClick={onCancel} disabled={loading}>Cancel</button>
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? (<><i className="fas fa-spinner fa-spin"></i> Saving...</>) : (<><i className="fas fa-save"></i> {monster ? 'Update Monster' : 'Add Monster'}</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

