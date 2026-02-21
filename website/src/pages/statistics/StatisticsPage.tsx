import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { TabContainer } from '@components/common';
import type { Tab } from '@components/common';
import MonsterStatsTab from './MonsterStatsTab';
import TrainerLeaderboardTab from './TrainerLeaderboardTab';
import PlayerLeaderboardTab from './PlayerLeaderboardTab';
import AchievementStatsTab from './AchievementStatsTab';

const StatisticsPage = () => {
  useDocumentTitle('Statistics');

  const tabs: Tab[] = [
    {
      key: 'monsters',
      label: 'Monster Stats',
      icon: 'fas fa-dragon',
      content: <MonsterStatsTab />,
    },
    {
      key: 'trainer-leaderboard',
      label: 'Trainer Leaderboard',
      icon: 'fas fa-crown',
      content: <TrainerLeaderboardTab />,
    },
    {
      key: 'player-leaderboard',
      label: 'Player Leaderboard',
      icon: 'fas fa-users',
      content: <PlayerLeaderboardTab />,
    },
    {
      key: 'achievements',
      label: 'Achievement Statistics',
      icon: 'fas fa-trophy',
      content: <AchievementStatsTab />,
    },
  ];

  return (
    <div className="statistics-page">
      <div className="statistics-page__header">
        <h1 className="statistics-page__title">Statistics</h1>
        <p className="statistics-page__subtitle">
          Browse game-wide statistics, leaderboards, and achievements
        </p>
      </div>
      <TabContainer
        tabs={tabs}
        variant="pills"
        fullWidth
        lazy
        keepMounted
      />
    </div>
  );
};

export default StatisticsPage;
