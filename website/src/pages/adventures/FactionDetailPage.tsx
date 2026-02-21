import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../components/common/StateContainer';
import { TabContainer, Tab } from '../../components/common/TabContainer';
import {
  FactionStandingDisplay,
  FactionStore,
  FactionSubmissionModal,
  TributeSubmissionModal,
  KnownPeople
} from '../../components/factions';
import api from '../../services/api';
import '../../styles/adventures/factions.css';

interface Faction {
  id: number;
  name: string;
  description?: string;
  color?: string;
  banner_image?: string;
  icon_image?: string;
  relationships?: FactionRelationship[];
}

interface FactionRelationship {
  related_faction_id: number;
  related_faction_name: string;
  relationship_type: string;
}

interface FactionTitle {
  id: number;
  name: string;
  description: string;
  standing_requirement: number;
  is_positive: boolean;
  requires_tribute?: boolean;
  tribute_status?: 'pending' | 'rejected' | 'approved' | null;
}

interface FactionStanding {
  standing: number;
  current_title_name?: string;
  current_title_description?: string;
  availableTitles?: FactionTitle[];
}

interface Trainer {
  id: number;
  name: string;
}

const FactionDetailPage = () => {
  const { factionId } = useParams<{ factionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [faction, setFaction] = useState<Faction | null>(null);
  const [allFactions, setAllFactions] = useState<Faction[]>([]);
  const [standing, setStanding] = useState<FactionStanding | null>(null);
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTributeModal, setShowTributeModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  useDocumentTitle(faction ? faction.name : 'Faction');

  // Get trainer ID from URL params
  useEffect(() => {
    const trainerId = searchParams.get('trainerId');
    if (trainerId) {
      setSelectedTrainer(parseInt(trainerId));
    }
  }, [searchParams]);

  // Fetch user trainers
  useEffect(() => {
    const fetchUserTrainers = async () => {
      if (!currentUser?.discord_id) return;

      try {
        const response = await api.get(`/trainers/user/${currentUser.discord_id}`);
        const trainers = response.data.data || [];
        setUserTrainers(trainers);
        if (!selectedTrainer && trainers.length > 0) {
          setSelectedTrainer(trainers[0].id);
        }
      } catch (err) {
        console.error('Error fetching user trainers:', err);
        setError('Failed to load trainers');
      }
    };

    fetchUserTrainers();
  }, [currentUser, selectedTrainer]);

  // Fetch factions
  const fetchFactionData = useCallback(async () => {
    if (!factionId) return;
    try {
      setLoading(true);

      const [allFactionsResponse, factionResponse] = await Promise.all([
        api.get('/factions'),
        api.get(`/factions/${factionId}`)
      ]);

      setAllFactions(allFactionsResponse.data.data || allFactionsResponse.data.factions || []);
      setFaction(factionResponse.data.data || factionResponse.data.faction);
    } catch (err) {
      console.error('Error fetching faction:', err);
      setError('Failed to load faction details');
    } finally {
      setLoading(false);
    }
  }, [factionId]);

  useEffect(() => {
    fetchFactionData();
  }, [fetchFactionData]);

  // Fetch standing
  const fetchStanding = useCallback(async () => {
    if (!selectedTrainer || !factionId) return;
    try {
      const response = await api.get(`/factions/trainers/${selectedTrainer}/${factionId}/standing`);
      const raw = response.data.data || response.data.standing || response.data;
      // The API returns { standing: { id, standing: number, ... }, availableTitles }
      // Normalize so the component gets { standing: number, current_title_name, availableTitles }
      if (raw?.standing && typeof raw.standing === 'object') {
        setStanding({
          standing: raw.standing.standing ?? 0,
          current_title_name: raw.standing.current_title_name,
          current_title_description: raw.standing.current_title_description,
          availableTitles: raw.availableTitles,
        });
      } else {
        setStanding(raw);
      }
    } catch (err) {
      console.error('Error fetching standing:', err);
    }
  }, [selectedTrainer, factionId]);

  useEffect(() => {
    fetchStanding();
  }, [fetchStanding]);

  const handleTrainerChange = (trainerId: number) => {
    setSelectedTrainer(trainerId);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('trainerId', String(trainerId));
    navigate(`/adventures/faction-quests/${factionId}?${newSearchParams.toString()}`, { replace: true });
  };

  const navigateToFaction = (direction: 'left' | 'right') => {
    if (!allFactions.length || !faction) return;

    const currentIndex = allFactions.findIndex(f => f.id === faction.id);
    const nextIndex = direction === 'left'
      ? (currentIndex === 0 ? allFactions.length - 1 : currentIndex - 1)
      : (currentIndex === allFactions.length - 1 ? 0 : currentIndex + 1);

    const nextFaction = allFactions[nextIndex];
    if (nextFaction) {
      navigate(`/adventures/faction-quests/${nextFaction.id}?${searchParams.toString()}`);
    }
  };

  const handleSubmissionComplete = () => {
    setShowSubmissionModal(false);
    fetchStanding();
  };

  const tabs: Tab[] = faction && selectedTrainer ? [
    {
      key: 'overview',
      label: 'Overview',
      icon: 'fas fa-info-circle',
      content: (
        <div>
          <div className="boss-actions" style={{ marginBottom: 'var(--spacing-medium)' }}>
            <button
              className="button primary"
              onClick={() => setShowSubmissionModal(true)}
            >
              <i className="fas fa-scroll"></i> Make Submission
            </button>
            <button
              className="button primary"
              onClick={() => setShowTributeModal(true)}
            >
              <i className="fas fa-gift"></i> Make Tribute
            </button>
          </div>

          <div className="faction-info">
            <h3>About {faction.name}</h3>
            <p>{faction.description}</p>

            {faction.relationships && faction.relationships.length > 0 && (
              <div className="relationships-section">
                <h4>Faction Relationships</h4>
                <div className="relationships-grid">
                  {faction.relationships.map(rel => (
                    <div key={rel.related_faction_id} className={`relationship-item ${rel.relationship_type}`}>
                      <span className="relationship-faction">{rel.related_faction_name}</span>
                      <span className="relationship-type">{rel.relationship_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'store',
      label: 'Faction Store',
      icon: 'fas fa-store',
      content: (
        <FactionStore
          factionId={factionId!}
          trainerId={selectedTrainer}
          faction={faction}
        />
      )
    },
    {
      key: 'individuals',
      label: 'Known Individuals',
      icon: 'fas fa-users',
      content: (
        <KnownPeople
          faction={faction}
          trainerId={selectedTrainer}
          standing={standing ?? undefined}
          onStandingChange={fetchStanding}
        />
      )
    }
  ] : [];

  return (
    <AutoStateContainer
      loading={loading}
      error={error}
      isEmpty={!faction}
      onRetry={fetchFactionData}
      loadingMessage="Loading faction details..."
      emptyIcon="fas fa-shield-alt"
      emptyMessage="Faction not found."
    >
      {faction && (
        <div className="faction-detail-container">
          {/* Faction Banner */}
          <div
            className="faction-banner"
            style={{
              backgroundImage: `url(/images/factions/${faction.banner_image})`,
              borderColor: faction.color
            }}
          >
            <div className="banner-overlay">
              <div className="faction-navigation">
                <button
                  className="button icon"
                  onClick={() => navigateToFaction('left')}
                  title="Previous Faction"
                >
                  &#8249;
                </button>
                <h1 className="faction-title" style={{ color: faction.color }}>
                  {faction.name}
                </h1>
                <button
                  className="button icon"
                  onClick={() => navigateToFaction('right')}
                  title="Next Faction"
                >
                  &#8250;
                </button>
              </div>
              <p className="faction-description">{faction.description}</p>
            </div>
          </div>

          {/* Trainer Selection */}
          <div style={{ padding: 'var(--spacing-small)', textAlign: 'center' }}>
            <label htmlFor="trainer-select" style={{ marginRight: 'var(--spacing-xsmall)', color: 'var(--text-color-muted)' }}>
              Viewing as:
            </label>
            <select
              id="trainer-select"
              value={selectedTrainer ?? ''}
              onChange={(e) => handleTrainerChange(parseInt(e.target.value))}
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

          {selectedTrainer && (
            <>
              <FactionStandingDisplay
                standing={standing}
                faction={faction}
                trainerId={selectedTrainer}
              />

              <TabContainer
                tabs={tabs}
                defaultTab="overview"
                variant="underline"
                fullWidth
              />
            </>
          )}

          {/* Tribute Submission Modal */}
          {showTributeModal && selectedTrainer && (
            <TributeSubmissionModal
              faction={faction}
              trainerId={selectedTrainer}
              standing={standing ?? undefined}
              onClose={() => setShowTributeModal(false)}
              onSubmit={() => {
                setShowTributeModal(false);
                fetchStanding();
              }}
            />
          )}

          {/* Faction Submission Modal */}
          {showSubmissionModal && selectedTrainer && (
            <FactionSubmissionModal
              faction={faction}
              trainerId={selectedTrainer}
              onClose={() => setShowSubmissionModal(false)}
              onSubmit={handleSubmissionComplete}
            />
          )}
        </div>
      )}
    </AutoStateContainer>
  );
};

export default FactionDetailPage;
