import { LoadingSpinner } from '@components/common/LoadingSpinner';

interface TrainerReward {
  trainerId: number;
  levels: number;
  coins: number;
}

interface MonsterReward {
  monsterId: number;
  name?: string;
  levels: number;
}

interface MissionInfo {
  title: string;
  current_progress: number;
  required_progress: number;
}

interface MissionProgress {
  amount?: number;
  message?: string;
  updatedMissions?: MissionInfo[];
  completedMissions?: MissionInfo[];
}

interface BossResult {
  damage: number;
  boss?: {
    name: string;
    currentHealth: number;
    totalHealth: number;
    healthPercentage: number;
    wasDefeated?: boolean;
  };
}

interface BossDamage {
  amount?: number;
  results?: BossResult[];
}

interface GardenPoints {
  amount?: number;
}

interface SubmissionRewards {
  trainers?: TrainerReward[];
  monsters?: MonsterReward[];
  levels?: number;
  coins?: number;
  trainerId?: number;
  monsterId?: number;
  cappedLevels?: number;
  gardenPoints?: GardenPoints | number;
  missionProgress?: MissionProgress | number;
  bossDamage?: BossDamage | number;
}

interface SubmissionSuccessResult {
  rewards?: SubmissionRewards;
}

interface SubmissionSuccessDisplayProps {
  result: SubmissionSuccessResult | null;
  redirectMessage: string;
  loading?: boolean;
}

export function SubmissionSuccessDisplay({ result, redirectMessage, loading }: SubmissionSuccessDisplayProps) {
  const rewards = result?.rewards;

  const gardenPointsValue = typeof rewards?.gardenPoints === 'object'
    ? (rewards.gardenPoints.amount ?? 0)
    : (rewards?.gardenPoints ?? 0);

  return (
    <div className="submission-success">
      <div className="success-icon">
        <i className="fas fa-check-circle"></i>
      </div>
      <h2>Submission Successful!</h2>
      <p>Your submission has been received and processed successfully!</p>

      {rewards && (
        <div className="rewards-summary">
          <h3>Rewards Earned</h3>
          <div className="rewards-grid">
            {/* Trainer Rewards (art submissions) */}
            {rewards.trainers && rewards.trainers.length > 0 && (
              <div className="submission__reward-item">
                <h4><i className="fas fa-user"></i> Trainer Rewards</h4>
                <ul>
                  {rewards.trainers.map((trainer, index) => (
                    <li key={index}>
                      {trainer.levels} levels and {trainer.coins} coins for trainer #{trainer.trainerId}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Monster Rewards (art submissions) */}
            {rewards.monsters && rewards.monsters.length > 0 && (
              <div className="submission__reward-item">
                <h4><i className="fas fa-dragon"></i> Monster Rewards</h4>
                <ul>
                  {rewards.monsters.map((monster, index) => (
                    <li key={index}>
                      {monster.levels} levels for {monster.name || `monster #${monster.monsterId}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Writing Rewards (levels/coins for writing submissions) */}
            {rewards.levels !== undefined && (
              <div className="submission__reward-item">
                <h4><i className="fas fa-book"></i> Writing Rewards</h4>
                <p>
                  {rewards.levels} levels and {rewards.coins} coins
                  {rewards.trainerId && ` for trainer #${rewards.trainerId}`}
                  {rewards.monsterId && ` for monster #${rewards.monsterId}`}
                </p>
                {rewards.cappedLevels !== undefined && rewards.cappedLevels > 0 && (
                  <p className="capped-levels">
                    {rewards.cappedLevels} levels were capped (level 100 reached)
                  </p>
                )}
              </div>
            )}

            {/* Garden Points */}
            <div className="submission__reward-item">
              <h4><i className="fas fa-seedling"></i> Garden Points</h4>
              <p>{gardenPointsValue} points</p>
            </div>

            {/* Mission Progress */}
            <div className="submission__reward-item">
              <h4><i className="fas fa-tasks"></i> Mission Progress</h4>
              <MissionProgressDisplay progress={rewards.missionProgress} />
            </div>

            {/* Boss Damage */}
            <div className="submission__reward-item">
              <h4><i className="fas fa-fist-raised"></i> Boss Damage</h4>
              <BossDamageDisplay damage={rewards.bossDamage} />
            </div>
          </div>
        </div>
      )}

      <p>{redirectMessage}</p>
      {loading && <LoadingSpinner />}
    </div>
  );
}

function MissionProgressDisplay({ progress }: { progress?: MissionProgress | number }) {
  if (typeof progress === 'object' && progress) {
    return (
      <div>
        <p>{progress.amount ?? 0} progress</p>
        {progress.message && (
          <p className="reward-detail">{progress.message}</p>
        )}
        {progress.updatedMissions && progress.updatedMissions.length > 0 && (
          <div>
            <p className="reward-detail">Updated missions:</p>
            <ul>
              {progress.updatedMissions.map((mission, index) => (
                <li key={index}>{mission.title}: {mission.current_progress}/{mission.required_progress}</li>
              ))}
            </ul>
          </div>
        )}
        {progress.completedMissions && progress.completedMissions.length > 0 && (
          <div>
            <p className="reward-detail">Completed missions:</p>
            <ul>
              {progress.completedMissions.map((mission, index) => (
                <li key={index}>{mission.title} - Ready to claim rewards!</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return <p>{progress ?? 0} progress</p>;
}

function BossDamageDisplay({ damage }: { damage?: BossDamage | number }) {
  if (typeof damage === 'object' && damage) {
    return (
      <div>
        <p>{damage.amount ?? 0} damage</p>
        {damage.results && damage.results.length > 0 && (
          <div>
            {damage.results.map((result, index) => (
              <div key={index}>
                <p className="reward-detail">
                  Dealt {result.damage} damage to {result.boss?.name ?? 'Boss'}
                </p>
                {result.boss && (
                  <p className="reward-detail">
                    Boss Health: {result.boss.currentHealth}/{result.boss.totalHealth}
                    ({result.boss.healthPercentage}%)
                    {result.boss.wasDefeated && <span className="boss-defeated"> - DEFEATED!</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <p>{damage ?? 0} damage</p>;
}
