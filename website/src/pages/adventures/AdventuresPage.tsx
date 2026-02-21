import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { TabContainer, Tab } from '../../components/common/TabContainer';
import { AdventureList } from '../../components/adventures/AdventureList';
import { AdventureCreationForm } from '../../components/adventures/AdventureCreationForm';
import { Modal } from '../../components/common/Modal';
import type { Adventure } from '../../components/adventures/types';
import EventsPage from './EventsPage';
import MissionsPage from './missions/MissionsPage';
import BossViewPage from './boss/BossViewPage';
import FactionQuestsPage from './FactionQuestsPage';

const AdventuresOverview = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const openCreateModal = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/adventures' } });
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleAdventureCreated = (adventure: Adventure) => {
    setIsCreateModalOpen(false);
    navigate(`/adventures/${adventure.id}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-small)' }}>
        <button
          className="button primary"
          onClick={openCreateModal}
        >
          <i className="fas fa-plus"></i> Create Adventure
        </button>
      </div>
      <AdventureList
        status="all"
        showFilters={true}
        trainerId={currentUser?.id ?? null}
      />
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Adventure"
        size="large"
      >
        <AdventureCreationForm onAdventureCreated={handleAdventureCreated} />
      </Modal>
    </div>
  );
};

const VALID_TABS = ['adventures', 'events', 'missions', 'boss', 'faction-quests'];

const AdventuresPage = () => {
  useDocumentTitle('Adventures');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'adventures';

  const handleTabChange = (tabKey: string) => {
    if (tabKey === 'adventures') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabKey });
    }
  };

  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/adventures' } });
    return null;
  }

  const tabs: Tab[] = [
    {
      key: 'adventures',
      label: 'Adventures',
      icon: 'fas fa-map-marked-alt',
      content: <AdventuresOverview />
    },
    {
      key: 'events',
      label: 'Events',
      icon: 'fas fa-calendar-alt',
      content: <EventsPage />
    },
    {
      key: 'missions',
      label: 'Missions',
      icon: 'fas fa-scroll',
      content: <MissionsPage />
    },
    {
      key: 'boss',
      label: 'Current Boss',
      icon: 'fas fa-dragon',
      content: <BossViewPage />
    },
    {
      key: 'faction-quests',
      label: 'Faction Quests',
      icon: 'fas fa-shield-alt',
      content: <FactionQuestsPage />
    }
  ];

  return (
    <div className="adventures-page">
      <div className="adventures-page__header">
        <h1>Adventures</h1>
        <p>Embark on exciting journeys, complete missions, and battle powerful bosses</p>
      </div>
      <TabContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        variant="underline"
        fullWidth
      />
    </div>
  );
};

export default AdventuresPage;
