import React, { useState, useEffect } from 'react';
import PersonDetailModal from './PersonDetailModal';
import PersonFullView from './PersonFullView';

const KnownPeople = ({ faction, trainerId, standing, onStandingChange }) => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [modalType, setModalType] = useState(null); // 'detail' or 'full'

  useEffect(() => {
    fetchFactionPeople();
  }, [faction.id, trainerId]);

  const fetchFactionPeople = async () => {
    try {
      setLoading(true);
      const url = trainerId 
        ? `/api/factions/${faction.id}/people?trainerId=${trainerId}`
        : `/api/factions/${faction.id}/people`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setPeople(data.people);
      }
    } catch (error) {
      console.error('Error fetching faction people:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonClick = (person) => {
    setSelectedPerson(person);
    if (person.has_met) {
      setModalType('full');
    } else if (person.can_meet) {
      setModalType('detail');
    }
  };

  const handlePersonMet = () => {
    // Refresh the people list after someone is met
    fetchFactionPeople();
    setSelectedPerson(null);
    setModalType(null);
    // Notify parent component to refresh standing
    if (onStandingChange) {
      onStandingChange();
    }
  };

  const getPersonDisplayInfo = (person) => {
    if (person.has_met) {
      return {
        image: person.images && person.images.length > 0 ? person.images[0] : '/images/placeholder-person.png',
        name: person.name,
        subtitle: person.role,
        canClick: true
      };
    } else if (person.can_meet) {
      return {
        image: '/images/silhouette.png',
        name: person.alias,
        subtitle: `Standing required: ${Math.abs(person.standing_requirement)}`,
        canClick: true
      };
    } else {
      return {
        image: '/images/silhouette.png',
        name: person.alias,
        subtitle: `Standing required: ${Math.abs(person.standing_requirement)}`,
        canClick: false
      };
    }
  };

  if (loading) {
    return <div className="known-people-loading">Loading faction people...</div>;
  }

  if (!people || people.length === 0) {
    return (
      <div className="known-people-empty">
        <h3>Known People</h3>
        <p>No known people in this faction yet.</p>
      </div>
    );
  }

  return (
    <div className="known-people">
      <h3>Known People</h3>
      <div className="people-grid">
        {people.map(person => {
          const displayInfo = getPersonDisplayInfo(person);
          
          return (
            <div
              key={person.id}
              className={`person-card ${displayInfo.canClick ? 'clickable' : 'locked'} ${person.has_met ? 'met' : person.can_meet ? 'can-meet' : 'locked'}`}
              onClick={() => displayInfo.canClick && handlePersonClick(person)}
            >
              <div className="person-image">
                <img src={displayInfo.image} alt={displayInfo.name} />
                {person.has_met && (
                  <div className="met-badge">
                    <i className="fas fa-check"></i>
                  </div>
                )}
                {!person.has_met && person.can_meet && (
                  <div className="can-meet-badge">
                    <i className="fas fa-handshake"></i>
                  </div>
                )}
                {!person.can_meet && (
                  <div className="locked-overlay">
                    <i className="fas fa-lock"></i>
                  </div>
                )}
              </div>
              <div className="person-info">
                <h4 className="person-name">{displayInfo.name}</h4>
                <p className="person-subtitle">{displayInfo.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPerson && modalType === 'detail' && (
        <PersonDetailModal
          person={selectedPerson}
          trainerId={trainerId}
          onClose={() => {
            setSelectedPerson(null);
            setModalType(null);
          }}
          onPersonMet={handlePersonMet}
        />
      )}

      {selectedPerson && modalType === 'full' && (
        <PersonFullView
          person={selectedPerson}
          trainerId={trainerId}
          onClose={() => {
            setSelectedPerson(null);
            setModalType(null);
          }}
        />
      )}
    </div>
  );
};

export default KnownPeople;