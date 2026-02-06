import React, { useState, useEffect } from 'react';
import MonsterTeamCard from './MonsterTeamCard';
import api from '../../services/api';

const PersonFullView = ({ person, trainerId, onClose }) => {
  const [fullPersonData, setFullPersonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeBioSection, setActiveBioSection] = useState('tldr');

  useEffect(() => {
    fetchFullPersonData();
  }, [person.id, trainerId]);

  const fetchFullPersonData = async () => {
    try {
      setLoading(true);
      const url = trainerId 
        ? `/api/factions/people/${person.id}?trainerId=${trainerId}`
        : `/api/factions/people/${person.id}`;
      
      const response = await api.get(url);
      
      if (response.data.success) {
        setFullPersonData(response.data.person);
      }
    } catch (error) {
      console.error('Error fetching full person data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="person-full-view-overlay" onClick={onClose}>
        <div className="person-full-view loading" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading person details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!fullPersonData) {
    return (
      <div className="person-full-view-overlay" onClick={onClose}>
        <div className="person-full-view error" onClick={(e) => e.stopPropagation()}>
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Failed to load person details</p>
            <button onClick={onClose} className="button close">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const bioSections = [
    { key: 'tldr', label: 'TL;DR', content: fullPersonData.blurb },
    { key: 'short', label: 'Short Bio', content: fullPersonData.short_bio },
    { key: 'long', label: 'Long Bio', content: fullPersonData.long_bio },
    { key: 'role', label: 'Role', content: fullPersonData.role },
    { key: 'assistance', label: 'Available Assistance', content: fullPersonData.available_assistance }
  ].filter(section => section.content);

  return (
    <div className="person-full-view-overlay" onClick={onClose}>
      <div className="person-full-view" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{fullPersonData.name}</h2>
          <button className="button close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="person-header">
            <div className="person-images">
              {fullPersonData.images && fullPersonData.images.length > 0 ? (
                <>
                  <div className="main-image">
                    <img 
                      src={fullPersonData.images[activeImageIndex]} 
                      alt={`${fullPersonData.name} - Image ${activeImageIndex + 1}`} 
                    />
                  </div>
                  {fullPersonData.images.length > 1 && (
                    <div className="image-thumbnails">
                      {fullPersonData.images.map((image, index) => (
                        <button
                          key={index}
                          className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                          onClick={() => setActiveImageIndex(index)}
                        >
                          <img src={image} alt={`${fullPersonData.name} - Thumbnail ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="main-image">
                  <img src="/images/placeholder-person.png" alt={fullPersonData.name} />
                </div>
              )}
            </div>

            <div className="person-basic-info">
              <h3>{fullPersonData.name}</h3>
              <p className="person-role">{fullPersonData.role}</p>
              {fullPersonData.met_at && (
                <div className="met-date">
                  <i className="fas fa-calendar"></i>
                  <span>Met on {new Date(fullPersonData.met_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="person-biography">
            <div className="bio-tabs">
              {bioSections.map(section => (
                <button
                  key={section.key}
                  className={`bio-tab ${activeBioSection === section.key ? 'active' : ''}`}
                  onClick={() => setActiveBioSection(section.key)}
                >
                  {section.label}
                </button>
              ))}
            </div>

            <div className="bio-content">
              {bioSections.find(s => s.key === activeBioSection)?.content && (
                <div className="bio-section">
                  <p>{bioSections.find(s => s.key === activeBioSection).content}</p>
                </div>
              )}
            </div>
          </div>

          {fullPersonData.team && fullPersonData.team.length > 0 && (
            <div className="person-team">
              <h4>
                <i className="fas fa-users"></i>
                Main Team
              </h4>
              <div className="team-grid">
                {fullPersonData.team.map(monster => (
                  <MonsterTeamCard key={monster.id} monster={monster} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="person-stats">
            <div className="stat">
              <i className="fas fa-chart-line"></i>
              <span>Standing Required: {Math.abs(fullPersonData.standing_requirement)}</span>
            </div>
            <div className="stat">
              <i className="fas fa-gift"></i>
              <span>Standing Reward: {fullPersonData.standing_reward}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonFullView;