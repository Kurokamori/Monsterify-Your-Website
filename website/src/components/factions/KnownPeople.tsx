import { useState, useEffect, useCallback } from 'react';
import { PersonDetailModal } from './PersonDetailModal';
import { PersonFullView } from './PersonFullView';

interface Person {
  id: number | string;
  name?: string;
  alias: string;
  role?: string;
  images?: string[];
  blurb?: string;
  meeting_prompt?: string;
  standing_requirement: number;
  standing_reward: number;
  has_met?: boolean;
  can_meet?: boolean;
}

interface Faction {
  id: number | string;
  name: string;
}

interface FactionStanding {
  standing: number;
}

interface KnownPeopleProps {
  faction: Faction;
  trainerId?: number | string;
  standing?: FactionStanding;
  onStandingChange?: () => void;
}

type ModalType = 'detail' | 'full' | null;

export const KnownPeople = ({
  faction,
  trainerId,
  onStandingChange
}: KnownPeopleProps) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);

  const fetchFactionPeople = useCallback(async () => {
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
  }, [faction.id, trainerId]);

  useEffect(() => {
    fetchFactionPeople();
  }, [fetchFactionPeople]);

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
    if (person.has_met) {
      setModalType('full');
    } else if (person.can_meet) {
      setModalType('detail');
    }
  };

  const handlePersonMet = () => {
    fetchFactionPeople();
    setSelectedPerson(null);
    setModalType(null);
    if (onStandingChange) {
      onStandingChange();
    }
  };

  const handleCloseModal = () => {
    setSelectedPerson(null);
    setModalType(null);
  };

  const getPersonDisplayInfo = (person: Person) => {
    if (person.has_met) {
      return {
        image: person.images && person.images.length > 0 ? person.images[0] : '/images/placeholder-person.png',
        name: person.name || person.alias,
        subtitle: person.role || '',
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
    return (
      <div className="known-people__empty">
        <p>Loading faction people...</p>
      </div>
    );
  }

  if (!people || people.length === 0) {
    return (
      <div className="known-people">
        <h3>Known People</h3>
        <div className="known-people__empty">
          <p>No known people in this faction yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="known-people">
      <h3>Known People</h3>
      <div className="known-people__grid">
        {people.map(person => {
          const displayInfo = getPersonDisplayInfo(person);

          return (
            <div
              key={person.id}
              className={[
                'person-card',
                displayInfo.canClick && 'person-card--clickable',
                !displayInfo.canClick && 'person-card--locked',
                person.has_met && 'person-card--met',
                !person.has_met && person.can_meet && 'person-card--can-meet'
              ].filter(Boolean).join(' ')}
              onClick={() => displayInfo.canClick && handlePersonClick(person)}
            >
              <div className="person-card__image">
                <img src={displayInfo.image} alt={displayInfo.name} />
                {person.has_met && (
                  <div className="person-card__badge person-card__badge--met">
                    <i className="fas fa-check"></i>
                  </div>
                )}
                {!person.has_met && person.can_meet && (
                  <div className="person-card__badge person-card__badge--can-meet">
                    <i className="fas fa-handshake"></i>
                  </div>
                )}
                {!person.can_meet && (
                  <div className="person-card__locked-overlay">
                    <i className="fas fa-lock"></i>
                  </div>
                )}
              </div>
              <div className="person-card__info">
                <h4 className="person-card__name">{displayInfo.name}</h4>
                <p className="person-card__subtitle">{displayInfo.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPerson && modalType === 'detail' && trainerId && (
        <PersonDetailModal
          person={selectedPerson}
          trainerId={trainerId}
          onClose={handleCloseModal}
          onPersonMet={handlePersonMet}
        />
      )}

      {selectedPerson && modalType === 'full' && (
        <PersonFullView
          person={selectedPerson}
          trainerId={trainerId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
