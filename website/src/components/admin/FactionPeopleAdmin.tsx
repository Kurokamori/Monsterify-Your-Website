import { useState, useEffect, useCallback } from 'react';
import { PersonForm } from './PersonForm';
import { MonsterTeamManager } from './MonsterTeamManager';
import api from '../../services/api';

interface Faction {
  id: number;
  name: string;
  color?: string;
}

interface PersonData {
  id: number;
  name: string;
  alias?: string;
  faction_id: number;
  faction_name?: string;
  standing_requirement: number;
  standing_reward: number;
  role?: string;
  blurb?: string;
  images?: string[];
}

export function FactionPeopleAdmin() {
  const [people, setPeople] = useState<PersonData[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFaction, setSelectedFaction] = useState('');
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonData | null>(null);
  const [showTeamManager, setShowTeamManager] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PersonData | null>(null);

  const fetchFactions = useCallback(async () => {
    try {
      const response = await api.get('/factions');
      setFactions(response.data.factions || []);
    } catch {
      setError('Failed to load factions');
    }
  }, []);

  const fetchPeople = useCallback(async () => {
    try {
      setLoading(true);
      const url = selectedFaction
        ? `/admin/faction-people?factionId=${selectedFaction}`
        : '/admin/faction-people';
      const response = await api.get(url);
      setPeople(response.data.people || []);
    } catch {
      setError('Failed to load faction people');
    } finally {
      setLoading(false);
    }
  }, [selectedFaction]);

  useEffect(() => { fetchFactions(); }, [fetchFactions]);
  useEffect(() => { fetchPeople(); }, [fetchPeople]);

  const handleCreatePerson = () => { setEditingPerson(null); setShowPersonForm(true); };
  const handleEditPerson = (person: PersonData) => { setEditingPerson(person); setShowPersonForm(true); };

  const handleDeletePerson = async (personId: number) => {
    if (!window.confirm('Are you sure you want to delete this person? This will also delete their monster team.')) return;
    try {
      await api.delete(`/admin/faction-people/${personId}`);
      fetchPeople();
    } catch {
      alert('Failed to delete person');
    }
  };

  const handlePersonSaved = () => { setShowPersonForm(false); setEditingPerson(null); fetchPeople(); };
  const handleManageTeam = (person: PersonData) => { setSelectedPerson(person); setShowTeamManager(true); };

  const getFactionName = (factionId: number) => factions.find(f => f.id === factionId)?.name || 'Unknown Faction';
  const getFactionColor = (factionId: number) => factions.find(f => f.id === factionId)?.color || '#6c757d';

  if (loading && people.length === 0) {
    return (
      <div className="faction-people-admin loading">
        <div className="loading-spinner"><i className="fas fa-spinner fa-spin"></i><p>Loading faction people...</p></div>
      </div>
    );
  }

  return (
    <div className="faction-people-admin">
      <div className="option-row">
        <h1><i className="fas fa-users"></i> Faction People Management</h1>
        <button className="button primary" onClick={handleCreatePerson}>
          <i className="fas fa-plus"></i> Create New Person
        </button>
      </div>

      <div className="admin-filters">
        <div className="set-item">
          <label htmlFor="faction-filter">Filter by Faction:</label>
          <select id="faction-filter" value={selectedFaction}
            onChange={(e) => setSelectedFaction(e.target.value)} className="form-input">
            <option value="">All Factions</option>
            {factions.map(faction => (
              <option key={faction.id} value={faction.id}>{faction.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (<div className="alert error"><i className="fas fa-exclamation-triangle"></i> {error}</div>)}

      <div className="people-grid">
        {people.length === 0 ? (
          <div className="no-npcs">
            <i className="fas fa-user-friends"></i>
            <h3>No People Found</h3>
            <p>{selectedFaction ? 'No people found for the selected faction.' : 'No faction people have been created yet.'}</p>
            <button className="button primary" onClick={handleCreatePerson}>Create First Person</button>
          </div>
        ) : (
          people.map(person => (
            <div key={person.id} className="person-card">
              <div className="person-header">
                <div className="image-container">
                  {person.images && person.images.length > 0 ? (
                    <img src={person.images[0]} alt={person.name} />
                  ) : (
                    <div className="image-placeholder"><i className="fas fa-user"></i></div>
                  )}
                </div>
                <div className="person-info">
                  <h3>{person.name}</h3>
                  <p className="person-alias">&quot;{person.alias}&quot;</p>
                  <div className="faction-badge" style={{ backgroundColor: getFactionColor(person.faction_id) }}>
                    {person.faction_name || getFactionName(person.faction_id)}
                  </div>
                </div>
              </div>
              <div className="person-details">
                <div className="detail-row"><label>Standing Requirement:</label> <span className="standing-value">{person.standing_requirement}</span></div>
                <div className="detail-row"><label>Standing Reward:</label> <span className="faction-admin__reward-value">{person.standing_reward}</span></div>
                <div className="detail-row"><label>Role:</label> <span>{person.role || 'Not specified'}</span></div>
                {person.blurb && (<div className="task-steps"><label>Blurb:</label><p>{person.blurb}</p></div>)}
              </div>
              <div className="person-actions">
                <button className="button secondary sm" onClick={() => handleManageTeam(person)} title="Manage Monster Team">
                  <i className="fas fa-dragon"></i> Team
                </button>
                <button className="button primary sm" onClick={() => handleEditPerson(person)} title="Edit Person">
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button className="button danger sm" onClick={() => handleDeletePerson(person.id)} title="Delete Person">
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showPersonForm && (
        <PersonForm person={editingPerson} factions={factions}
          onSave={handlePersonSaved} onCancel={() => { setShowPersonForm(false); setEditingPerson(null); }} />
      )}

      {showTeamManager && selectedPerson && (
        <MonsterTeamManager person={selectedPerson}
          onClose={() => { setShowTeamManager(false); setSelectedPerson(null); }}
          onTeamUpdated={() => { /* refresh if needed */ }} />
      )}
    </div>
  );
}

