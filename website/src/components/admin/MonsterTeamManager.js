import React, { useState, useEffect } from 'react';
import MonsterForm from './MonsterForm';
import api from '../../services/api';

const MonsterTeamManager = ({ person, onClose, onTeamUpdated }) => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMonsterForm, setShowMonsterForm] = useState(false);
  const [editingMonster, setEditingMonster] = useState(null);

  useEffect(() => {
    fetchTeam();
  }, [person.id]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/faction-people/${person.id}/team`);
      setTeam(response.data.team || []);
    } catch (err) {
      console.error('Error fetching team:', err);
      setError('Failed to load monster team');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMonster = () => {
    if (team.length >= 4) {
      alert('Maximum 4 monsters per team');
      return;
    }
    setEditingMonster(null);
    setShowMonsterForm(true);
  };

  const handleEditMonster = (monster) => {
    setEditingMonster(monster);
    setShowMonsterForm(true);
  };

  const handleDeleteMonster = async (monsterId) => {
    if (!window.confirm('Are you sure you want to delete this monster?')) {
      return;
    }

    try {
      await api.delete(`/admin/monsters/${monsterId}`);
      fetchTeam();
      onTeamUpdated();
    } catch (err) {
      console.error('Error deleting monster:', err);
      alert('Failed to delete monster');
    }
  };

  const handleMonsterSaved = () => {
    setShowMonsterForm(false);
    setEditingMonster(null);
    fetchTeam();
    onTeamUpdated();
  };

  const getAttributeColor = (attribute) => {
    switch (attribute?.toLowerCase()) {
      case 'virus': return '#8B4513';
      case 'vaccine': return '#4CAF50';
      case 'data': return '#2196F3';
      case 'free': return '#9C27B0';
      case 'variable': return '#FF9800';
      default: return '#757575';
    }
  };

  const getAttributeIcon = (attribute) => {
    switch (attribute?.toLowerCase()) {
      case 'virus': return 'fas fa-bug';
      case 'vaccine': return 'fas fa-shield-alt';
      case 'data': return 'fas fa-database';
      case 'free': return 'fas fa-infinity';
      case 'variable': return 'fas fa-exchange-alt';
      default: return 'fas fa-question';
    }
  };

  const getTypeColor = (type) => {
    const typeColors = {
      // Digimon-style types
      dragon: '#7B68EE',
      beast: '#8B4513',
      bird: '#87CEEB',
      aquan: '#4682B4',
      machine: '#696969',
      holy: '#FFD700',
      dark: '#483D8B',
      plant: '#228B22',
      insect: '#9ACD32',
      
      // Pokemon-style types  
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
      
      // Other common types
      light: '#FFFFE0',
      shadow: '#36454F',
      neutral: '#C0C0C0'
    };
    return typeColors[type?.toLowerCase()] || '#999';
  };

  if (loading) {
    return (
      <div className="monster-team-manager-overlay">
        <div className="monster-team-manager loading">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading monster team...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="monster-team-manager-overlay">
      <div className="monster-team-manager">
        <div className="tree-header">
          <h2>
            <i className="fas fa-dragon"></i>
            {person.name}'s Monster Team
          </h2>
          <button className="button close" onClick={onClose}>×</button>
        </div>

        <div className="team-info">
          <div className="person-summary">
            <div className="person-avatar">
              {person.images && person.images.length > 0 ? (
                <img src={person.images[0]} alt={person.name} />
              ) : (
                <div className="placeholder-avatar">
                  <i className="fas fa-user"></i>
                </div>
              )}
            </div>
            <div className="person-details">
              <h3>{person.name}</h3>
              <p>"{person.alias}"</p>
              <div className="team-stats">
                <span>{team.length}/4 monsters</span>
              </div>
            </div>
          </div>

          <button
            className="button primary lg lift"
            onClick={handleAddMonster}
            disabled={team.length >= 4}
          >
            <i className="fas fa-plus"></i>
            Add Monster {team.length < 4 && `(${4 - team.length} slots left)`}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}

        <div className="button">
          {team.length === 0 ? (
            <div className="empty-team">
              <i className="fas fa-dragon"></i>
              <h3>No Monsters Yet</h3>
              <p>{person.name} doesn't have any team monsters yet.</p>
              <button 
                className="button primary"
                onClick={handleAddMonster}
              >
                Add First Monster
              </button>
            </div>
          ) : (
            team.map(monster => (
              <div key={monster.id} className="monster-card">
                <div className="tree-header">
                  <div className="monster-image">
                    {monster.image ? (
                      <img src={monster.image} alt={monster.name} />
                    ) : (
                      <div className="placeholder-image">
                        <i className="fas fa-dragon"></i>
                      </div>
                    )}
                  </div>
                  <div className="monster-info">
                    <h4>{monster.name}</h4>
                    <div className="position-badge">
                      Position {monster.position}
                    </div>
                  </div>
                </div>

                <div className="monster-details">
                  {monster.species && monster.species.length > 0 && (
                    <div className="detail-group">
                      <label>Species:</label>
                      <div className="species-tags">
                        {monster.species.slice(0, 3).map((species, index) => (
                          <span key={index} className="species-tag">
                            {species}
                          </span>
                        ))}
                        {monster.species.length > 3 && (
                          <span className="more-tag">+{monster.species.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {monster.types && monster.types.length > 0 && (
                    <div className="detail-group">
                      <label>Types:</label>
                      <div className="types-tags">
                        {monster.types.slice(0, 5).map((type, index) => (
                          <span 
                            key={index} 
                            className="type-tag"
                            style={{ backgroundColor: getTypeColor(type) }}
                          >
                            {type}
                          </span>
                        ))}
                        {monster.types.length > 5 && (
                          <span className="more-tag">+{monster.types.length - 5}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {monster.attribute && (
                    <div className="detail-group">
                      <label>Attribute:</label>
                      <div 
                        className="attribute-badge"
                        style={{ backgroundColor: getAttributeColor(monster.attribute) }}
                      >
                        <i className={getAttributeIcon(monster.attribute)}></i>
                        <span>{monster.attribute}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="monster-actions">
                  <button
                    className="button primary sm"
                    onClick={() => handleEditMonster(monster)}
                    title="Edit Monster"
                  >
                    <i className="fas fa-edit"></i>
                    Edit
                  </button>
                  <button
                    className="button danger sm"
                    onClick={() => handleDeleteMonster(monster.id)}
                    title="Delete Monster"
                  >
                    <i className="fas fa-trash"></i>
                    Delete
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
            onCancel={() => {
              setShowMonsterForm(false);
              setEditingMonster(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MonsterTeamManager;