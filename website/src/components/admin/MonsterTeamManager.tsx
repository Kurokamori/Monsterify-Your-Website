import { useState, useEffect, useCallback } from 'react';
import { MonsterForm } from './MonsterForm';
import api from '../../services/api';

interface MonsterTeamMember {
  id: number;
  name: string;
  species?: string[];
  types?: string[];
  attribute?: string;
  image?: string;
  position: number;
  level?: number;
}

interface PersonSummary {
  id: number;
  name: string;
  alias?: string;
  images?: string[];
}

interface MonsterTeamManagerProps {
  person: PersonSummary;
  onClose: () => void;
  onTeamUpdated: () => void;
}

const ATTRIBUTE_COLORS: Record<string, string> = {
  virus: '#8B4513', vaccine: '#4CAF50', data: '#2196F3', free: '#9C27B0', variable: '#FF9800'
};

const ATTRIBUTE_ICONS: Record<string, string> = {
  virus: 'fas fa-bug', vaccine: 'fas fa-shield-alt', data: 'fas fa-database',
  free: 'fas fa-infinity', variable: 'fas fa-exchange-alt'
};

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

function getTypeColor(type: string): string { return TYPE_COLORS[type?.toLowerCase()] || '#999'; }
function getAttributeColor(attr: string): string { return ATTRIBUTE_COLORS[attr?.toLowerCase()] || '#757575'; }
function getAttributeIcon(attr: string): string { return ATTRIBUTE_ICONS[attr?.toLowerCase()] || 'fas fa-question'; }

export function MonsterTeamManager({ person, onClose, onTeamUpdated }: MonsterTeamManagerProps) {
  const [team, setTeam] = useState<MonsterTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMonsterForm, setShowMonsterForm] = useState(false);
  const [editingMonster, setEditingMonster] = useState<MonsterTeamMember | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/faction-people/${person.id}/team`);
      setTeam(response.data.team || []);
    } catch {
      setError('Failed to load monster team');
    } finally {
      setLoading(false);
    }
  }, [person.id]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleAddMonster = () => {
    if (team.length >= 4) { alert('Maximum 4 monsters per team'); return; }
    setEditingMonster(null);
    setShowMonsterForm(true);
  };

  const handleEditMonster = (monster: MonsterTeamMember) => {
    setEditingMonster(monster);
    setShowMonsterForm(true);
  };

  const handleDeleteMonster = async (monsterId: number) => {
    if (!window.confirm('Are you sure you want to delete this monster?')) return;
    try {
      await api.delete(`/admin/monsters/${monsterId}`);
      fetchTeam();
      onTeamUpdated();
    } catch {
      alert('Failed to delete monster');
    }
  };

  const handleMonsterSaved = () => {
    setShowMonsterForm(false);
    setEditingMonster(null);
    fetchTeam();
    onTeamUpdated();
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="spinner-container"><i className="fas fa-spinner fa-spin"></i><p>Loading monster team...</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="tree-header">
          <h2><i className="fas fa-dragon"></i> {person.name}&apos;s Monster Team</h2>
          <button className="button close no-flex" onClick={onClose}>×</button>
        </div>

        <div className="mtm-team-info">
          <div className="mtm-person-summary">
            <div className="person-card__image">
              {person.images && person.images.length > 0 ? (
                <img src={person.images[0]} alt={person.name} />
              ) : (
                <div className="image-placeholder"><i className="fas fa-user"></i></div>
              )}
            </div>
            <div className="mtm-person-details">
              <h3>{person.name}</h3>
              <p>&quot;{person.alias}&quot;</p>
              <div className="badge neutral sm">{team.length}/4 monsters</div>
            </div>
          </div>
          <button className="button primary lg" onClick={handleAddMonster} disabled={team.length >= 4}>
            <i className="fas fa-plus"></i> Add Monster {team.length < 4 && `(${4 - team.length} slots left)`}
          </button>
        </div>

        {error && (<div className="alert error"><i className="fas fa-exclamation-triangle"></i> {error}</div>)}

        <div className="mtm-team-grid">
          {team.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-dragon"></i>
              <h3>No Monsters Yet</h3>
              <p>{person.name} doesn&apos;t have any team monsters yet.</p>
              <button className="button primary" onClick={handleAddMonster}>Add First Monster</button>
            </div>
          ) : (
            team.map(monster => (
              <div key={monster.id} className="monster-card">
                <div className="tree-header">
                  <div className="monster-team-card__image">
                    {monster.image ? (<img src={monster.image} alt={monster.name} />) : (
                      <div className="image-placeholder"><i className="fas fa-dragon"></i></div>
                    )}
                  </div>
                  <div className="monster-team-card__name-group">
                    <h4>{monster.name}</h4>
                    <div className="badge neutral xs">Position {monster.position}</div>
                  </div>
                </div>
                <div className="monster-team-card__details">
                  {monster.species && monster.species.length > 0 && (
                    <div className="monster-team-card__row">
                      <label>Species:</label>
                      <div className="monster-team-card__species-list">
                        {monster.species.slice(0, 3).map((species, idx) => (<span key={idx} className="badge xs">{species}</span>))}
                        {monster.species.length > 3 && <span className="badge neutral xs">+{monster.species.length - 3}</span>}
                      </div>
                    </div>
                  )}
                  {monster.types && monster.types.length > 0 && (
                    <div className="monster-team-card__row">
                      <label>Types:</label>
                      <div className="monster-team-card__types-list">
                        {monster.types.slice(0, 5).map((type, idx) => (
                          <span key={idx} className="badge--type badge xs" style={{ backgroundColor: getTypeColor(type) }}>{type}</span>
                        ))}
                        {monster.types.length > 5 && <span className="badge neutral xs">+{monster.types.length - 5}</span>}
                      </div>
                    </div>
                  )}
                  {monster.attribute && (
                    <div className="monster-team-card__row">
                      <label>Attribute:</label>
                      <div className="badge--attribute badge xs" style={{ backgroundColor: getAttributeColor(monster.attribute) }}>
                        <i className={getAttributeIcon(monster.attribute)}></i> <span>{monster.attribute}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mtm-monster-actions">
                  <button className="button primary sm" onClick={() => handleEditMonster(monster)} title="Edit Monster">
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button className="button danger sm" onClick={() => handleDeleteMonster(monster.id)} title="Delete Monster">
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showMonsterForm && (
          <MonsterForm
            monster={editingMonster}
            personId={person.id}
            position={editingMonster ? editingMonster.position : team.length + 1}
            onSave={handleMonsterSaved}
            onCancel={() => { setShowMonsterForm(false); setEditingMonster(null); }}
          />
        )}
      </div>
    </div>
  );
}

