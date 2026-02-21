import { useState, useEffect, useMemo } from 'react';
import { MonsterTeamCard } from './MonsterTeamCard';
import api from '../../services/api';

interface TeamMonster {
  id: number | string;
  name: string;
  image?: string;
  species?: string[];
  types?: string[];
  attribute?: string;
}

interface Person {
  id: number | string;
  name?: string;
  alias: string;
  role?: string;
  images?: string[];
  blurb?: string;
  short_bio?: string;
  long_bio?: string;
  available_assistance?: string;
  standing_requirement: number;
  standing_reward: number;
  met_at?: string;
  team?: TeamMonster[];
}

interface PersonFullViewProps {
  person: Person;
  trainerId?: number | string;
  onClose: () => void;
}

interface BioSection {
  key: string;
  label: string;
  content: string | undefined;
}

export const PersonFullView = ({ person, trainerId, onClose }: PersonFullViewProps) => {
  const [fullPersonData, setFullPersonData] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeBioSection, setActiveBioSection] = useState('tldr');

  useEffect(() => {
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

    fetchFullPersonData();
  }, [person.id, trainerId]);

  const bioSections = useMemo((): BioSection[] => {
    if (!fullPersonData) return [];

    return [
      { key: 'tldr', label: 'TL;DR', content: fullPersonData.blurb },
      { key: 'short', label: 'Short Bio', content: fullPersonData.short_bio },
      { key: 'long', label: 'Long Bio', content: fullPersonData.long_bio },
      { key: 'role', label: 'Role', content: fullPersonData.role },
      { key: 'assistance', label: 'Available Assistance', content: fullPersonData.available_assistance }
    ].filter(section => section.content);
  }, [fullPersonData]);

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="person-full-view" onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: 'var(--spacing-large)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
            <p>Loading person details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!fullPersonData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="person-full-view" onClick={(e) => e.stopPropagation()}>
          <div className="alert error" style={{ margin: 'var(--spacing-medium)' }}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>Failed to load person details</p>
            <button onClick={onClose} className="button secondary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const activeBioContent = bioSections.find(s => s.key === activeBioSection)?.content;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="person-full-view" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{fullPersonData.name}</h2>
          <button className="button ghost" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="person-full-view__header">
          <div className="person-images">
            {fullPersonData.images && fullPersonData.images.length > 0 ? (
              <>
                <div className="person-images__main">
                  <img
                    src={fullPersonData.images[activeImageIndex]}
                    alt={`${fullPersonData.name} - Image ${activeImageIndex + 1}`}
                  />
                </div>
                {fullPersonData.images.length > 1 && (
                  <div className="person-images__thumbnails">
                    {fullPersonData.images.map((image, index) => (
                      <button
                        key={index}
                        className={[
                          'person-images__thumbnail',
                          index === activeImageIndex && 'person-images__thumbnail--active'
                        ].filter(Boolean).join(' ')}
                        onClick={() => setActiveImageIndex(index)}
                      >
                        <img src={image} alt={`${fullPersonData.name} - Thumbnail ${index + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="person-images__main">
                <img src="/images/placeholder-person.png" alt={fullPersonData.name} />
              </div>
            )}
          </div>

          <div className="person-basic-info">
            <h3>{fullPersonData.name}</h3>
            <p className="person-basic-info__role">{fullPersonData.role}</p>
            {fullPersonData.met_at && (
              <div className="person-basic-info__met-date">
                <i className="fas fa-calendar"></i>
                <span>Met on {new Date(fullPersonData.met_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="person-biography">
          <div className="person-biography__tabs">
            {bioSections.map(section => (
              <button
                key={section.key}
                className={[
                  'person-biography__tab',
                  activeBioSection === section.key && 'person-biography__tab--active'
                ].filter(Boolean).join(' ')}
                onClick={() => setActiveBioSection(section.key)}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="person-biography__content">
            {activeBioContent && (
              <p>{activeBioContent}</p>
            )}
          </div>
        </div>

        {fullPersonData.team && fullPersonData.team.length > 0 && (
          <div className="person-team">
            <h4>
              <i className="fas fa-users"></i>
              Main Team
            </h4>
            <div className="person-team__grid">
              {fullPersonData.team.map(monster => (
                <MonsterTeamCard key={monster.id} monster={monster} />
              ))}
            </div>
          </div>
        )}

        <div className="person-stats">
          <div className="person-stats__stat">
            <i className="fas fa-chart-line"></i>
            <span>Standing Required: {Math.abs(fullPersonData.standing_requirement)}</span>
          </div>
          <div className="person-stats__stat">
            <i className="fas fa-gift"></i>
            <span>Standing Reward: {fullPersonData.standing_reward}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
