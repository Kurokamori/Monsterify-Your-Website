import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../components/common/StateContainer';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import api from '../../services/api';
import '../../styles/adventures/factions.css';

interface Faction {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon_image?: string;
  banner_image?: string;
}

interface Trainer {
  id: number;
  name: string;
}

const FactionQuestsPage = () => {
  useDocumentTitle('Faction Quests');

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [selectedTrainer, setSelectedTrainer] = useState<number | null>(null);
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user trainers
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!currentUser?.discord_id) return;

      try {
        const response = await api.get(`/trainers/user/${currentUser.discord_id}`);
        const trainers = response.data.data || [];
        setUserTrainers(trainers);
        if (trainers.length > 0) {
          setSelectedTrainer(trainers[0].id);
        }
      } catch (err) {
        console.error('Error fetching user trainers:', err);
        setError('Failed to load trainers');
      }
    };

    fetchUserTrainers();
  }, [currentUser]);

  // Fetch factions
  const fetchFactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/factions');
      setFactions(response.data.data || response.data.factions || []);
    } catch (err) {
      console.error('Error fetching factions:', err);
      setError('Failed to load factions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactions();
  }, [fetchFactions]);

  const handleFactionClick = (factionId: number) => {
    if (!selectedTrainer) {
      setError('Please select a trainer first');
      return;
    }
    navigate(`/adventures/faction-quests/${factionId}?trainerId=${selectedTrainer}`);
  };

  return (
    <div className="faction-detail-container">
      <div className="faction-quests-header">
        <h1>Faction Quests</h1>
        <p>Choose your allegiances and build your reputation with the various factions across the archipelago</p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-medium)' }}>
        <select
          value={selectedTrainer ?? ''}
          onChange={(e) => setSelectedTrainer(Number(e.target.value))}
          className="select"
        >
          <option value="" disabled>Select a trainer</option>
          {userTrainers.map(trainer => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      <AutoStateContainer
        loading={loading}
        error={null}
        data={factions}
        onRetry={fetchFactions}
        emptyIcon="fas fa-shield-alt"
        emptyMessage="No factions found."
      >
        {!selectedTrainer && (
          <div className="state-container__empty">
            <i className="fas fa-user state-container__empty-icon"></i>
            <p className="state-container__empty-message">Please select a trainer to view faction standings and quests.</p>
          </div>
        )}

        {selectedTrainer && (
          <div className="factions-grid">
            {factions.map((faction) => (
              <div
                key={faction.id}
                className="faction-prism"
                onClick={() => handleFactionClick(faction.id)}
                style={{ '--faction-color': faction.color } as React.CSSProperties}
              >
                <div
                  className="faction-card-background"
                  style={{
                    backgroundImage: `url(/images/factions/${faction.banner_image || faction.icon_image})`
                  }}
                ></div>
                <div className="faction-card-content">
                  <div className="faction-card-icon">
                    <div className="faction-icon">
                      <img
                        src={`/images/factions/${faction.icon_image}`}
                        alt={faction.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'block';
                        }}
                      />
                      <div className="faction-icon-placeholder" style={{ display: 'none' }}>
                        {faction.name.charAt(0)}
                      </div>
                    </div>
                  </div>
                  <div className="faction-content">
                    <h3 className="faction-name">{faction.name}</h3>
                    <p className="faction-description-preview">
                      {faction.description || 'Explore the mysteries and challenges of this faction...'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AutoStateContainer>

      <div className="faction-quests-info">
        <div className="faction-info">
          <h3>About Faction Quests</h3>
          <p>
            Build relationships with the various factions across the archipelago. Each faction offers unique rewards,
            titles, and store items based on your standing with them. Be careful though - gaining favor with one
            faction may affect your standing with their rivals!
          </p>
        </div>

        <div className="faction-info">
          <h3>Standing System</h3>
          <ul>
            <li>Standing ranges from -1000 (Nemesis) to +1000 (Champion)</li>
            <li>Earn titles by reaching standing thresholds and completing tributes</li>
            <li>Higher standing unlocks better items in faction stores</li>
            <li>Faction relationships affect each other - allies boost each other, enemies detract</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FactionQuestsPage;
