import { Link } from 'react-router-dom';

interface RewardItem {
  item_id?: number;
  item_name?: string;
  quantity?: number;
}

interface MonsterRoll {
  enabled: boolean;
}

interface PromptRewards {
  levels?: number;
  coins?: number;
  items?: RewardItem[];
  monster_roll?: MonsterRoll;
  [key: string]: unknown;
}

export interface Prompt {
  id: string | number;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  category?: string;
  image_url?: string;
  prompt_text?: string;
  requirements?: string;
  prerequisites?: string;
  rewards?: string | PromptRewards;
  event_name?: string;
  start_date?: string;
  end_date?: string;
  active_months?: string;
  is_currently_available?: boolean;
  max_submissions_per_trainer?: number;
  submission_count?: number;
  approved_count?: number;
  pending_count?: number;
  tags?: string | string[];
  target_type?: string;
}

interface PromptCardProps {
  prompt: Prompt;
  showSubmissionButton?: boolean;
  showStatistics?: boolean;
  onSubmit?: (prompt: Prompt) => void;
  trainerId?: string | number;
}

const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '#28a745';
    case 'medium': return '#ffc107';
    case 'hard': return '#fd7e14';
    case 'expert': return '#dc3545';
    default: return '#6c757d';
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'general': return '#007bff';
    case 'monthly': return '#6f42c1';
    case 'progress': return '#20c997';
    case 'event': return '#e83e8c';
    default: return '#6c757d';
  }
};

const formatRewards = (rewards?: string | PromptRewards): string => {
  if (!rewards) return 'No rewards specified';

  const rewardObj: PromptRewards = typeof rewards === 'string' ? JSON.parse(rewards) : rewards;
  const parts: string[] = [];

  if (rewardObj.levels) parts.push(`${rewardObj.levels} levels`);
  if (rewardObj.coins) parts.push(`${rewardObj.coins} coins`);
  if (rewardObj.items && rewardObj.items.length > 0) {
    parts.push(`${rewardObj.items.length} item${rewardObj.items.length > 1 ? 's' : ''}`);
  }
  if (rewardObj.monster_roll && rewardObj.monster_roll.enabled) {
    parts.push('Monster roll');
  }

  return parts.length > 0 ? parts.join(', ') : 'Custom rewards';
};

export function PromptCard({
  prompt,
  showSubmissionButton = true,
  showStatistics = false,
  onSubmit,
  trainerId,
}: PromptCardProps) {
  const isAvailable = prompt.is_currently_available;
  const isExpired = prompt.type === 'event' && prompt.end_date ? new Date(prompt.end_date) < new Date() : false;

  return (
    <div className={`prompt-card ${!isAvailable ? 'unavailable' : ''}${isExpired ? 'expired' : ''}`}>
      {/* Header */}
      <div className="prompt-card-header">
        <div className="prompt-title-section">
          <h3 className="submission__prompt-title">{prompt.title}</h3>
          <div className="prompt-badges">
            <span
              className="badge badge--type"
              style={{ backgroundColor: getTypeColor(prompt.type) }}
            >
              {prompt.type}
            </span>
            <span
              className="badge"
              style={{ backgroundColor: getDifficultyColor(prompt.difficulty) }}
            >
              {prompt.difficulty}
            </span>
            {prompt.category && (
              <span className="badge">
                {prompt.category}
              </span>
            )}
          </div>
        </div>

        {prompt.image_url && (
          <div className="npc-avatar">
            <img src={prompt.image_url} alt={prompt.title} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="prompt-card-content">
        <p className="submission__prompt-description">{prompt.description}</p>

        {prompt.prompt_text && (
          <div className="prompt-text">
            <h4>Prompt Details:</h4>
            <p>{prompt.prompt_text}</p>
          </div>
        )}

        {prompt.requirements && (
          <div className="prompt-text">
            <h4>Requirements:</h4>
            <p>{prompt.prerequisites || 'See detailed requirements'}</p>
          </div>
        )}

        <div className="prompt-text">
          <h4>Rewards:</h4>
          <p>{formatRewards(prompt.rewards)}</p>
        </div>

        {prompt.type === 'event' && (
          <div className="prompt-event-info">
            <p><strong>Event:</strong> {prompt.event_name}</p>
            <p><strong>Duration:</strong> {prompt.start_date && new Date(prompt.start_date).toLocaleDateString()} - {prompt.end_date && new Date(prompt.end_date).toLocaleDateString()}</p>
          </div>
        )}

        {prompt.type === 'monthly' && prompt.active_months && (
          <div className="prompt-event-info">
            <p><strong>Active Months:</strong> {prompt.active_months}</p>
          </div>
        )}

        {showStatistics && (
          <div className="prompt-statistics">
            <div className="stat-item">
              <span className="stat-label">Total Submissions:</span>
              <span className="stat-value">{prompt.submission_count || 0}</span>
            </div>
            {prompt.approved_count !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Approved:</span>
                <span className="stat-value">{prompt.approved_count}</span>
              </div>
            )}
            {prompt.pending_count !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Pending:</span>
                <span className="stat-value">{prompt.pending_count}</span>
              </div>
            )}
          </div>
        )}

        {prompt.max_submissions_per_trainer && (
          <div className="prompt-limits">
            <p><small>Maximum {prompt.max_submissions_per_trainer} submission{prompt.max_submissions_per_trainer > 1 ? 's' : ''} per trainer</small></p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="rewards-actions">
        {!isAvailable && (
          <div className="availability-notice">
            {isExpired ? 'This event has ended' : 'Currently not available'}
          </div>
        )}

        {showSubmissionButton && isAvailable && trainerId && (
          <button
            className="button primary"
            onClick={() => onSubmit && onSubmit(prompt)}
          >
            Submit to Prompt
          </button>
        )}

        <Link
          to={`/prompts/${prompt.id}`}
          className="button secondary ghost"
        >
          View Details
        </Link>
      </div>

      {/* Tags */}
      {prompt.tags && (
        <div className="prompt-tags">
          {(typeof prompt.tags === 'string' ? JSON.parse(prompt.tags) as string[] : prompt.tags).map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

