import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import '../../styles/factions/quests.css';

interface GiftItem {
  type: string;
  items?: { name: string; quantity: number }[];
  category?: string;
  quantity?: number;
}

interface FactionPrompt {
  id: number;
  name: string;
  description: string | null;
  modifier: number;
  standingRequirement: number;
  submissionGiftItems: GiftItem[] | null;
  isActive: boolean;
}

interface FactionQuestsProps {
  factionId: string | number;
  trainerId: number;
  standing: number;
  faction: { name: string; color?: string };
}

const QUEST_TIERS = [
  { threshold: 0, label: 'Open Quests', icon: 'fas fa-scroll', rankName: 'Newcomer' },
  { threshold: 200, label: 'Initiate Quests', icon: 'fas fa-seedling', rankName: 'Initiate' },
  { threshold: 400, label: 'Apprentice Quests', icon: 'fas fa-book', rankName: 'Apprentice' },
  { threshold: 600, label: 'Adept Quests', icon: 'fas fa-star', rankName: 'Adept' },
  { threshold: 800, label: 'Expert Quests', icon: 'fas fa-crown', rankName: 'Expert' },
];

export const FactionQuests = ({ factionId, trainerId, standing, faction }: FactionQuestsProps) => {
  const [prompts, setPrompts] = useState<FactionPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/factions/${factionId}/prompts`);
        setPrompts(response.data.data || []);
      } catch (err) {
        console.error('Error fetching prompts:', err);
        setError('Failed to load quests');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, [factionId, trainerId]);

  const groupedPrompts = useMemo(() => {
    const groups: Record<number, FactionPrompt[]> = {};
    for (const tier of QUEST_TIERS) {
      groups[tier.threshold] = [];
    }
    for (const prompt of prompts) {
      const tier = prompt.standingRequirement ?? 0;
      if (!groups[tier]) {
        groups[tier] = [];
      }
      groups[tier].push(prompt);
    }
    return groups;
  }, [prompts]);

  const currentStanding = Math.abs(standing);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--spacing-large)' }}>
        <i className="fas fa-spinner fa-spin"></i> Loading quests...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert error">
        <i className="fas fa-exclamation-triangle"></i> {error}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="quest-empty">
        <i className="fas fa-scroll"></i>
        <p>No quests available for this faction yet.</p>
      </div>
    );
  }

  return (
    <div className="quest-container">
      <div className="quest-intro">
        <p>
          Complete themed quests to earn standing with <strong>{faction.name}</strong>.
          Higher-tier quests unlock as your standing grows and offer greater rewards.
        </p>
        <div className="quest-standing-badge">
          <i className="fas fa-shield-alt"></i>
          <span>Your Standing: <strong>{currentStanding}</strong></span>
        </div>
      </div>

      {QUEST_TIERS.map(tier => {
        const tierPrompts = groupedPrompts[tier.threshold] || [];
        if (tierPrompts.length === 0) return null;

        const isUnlocked = currentStanding >= tier.threshold;

        return (
          <div key={tier.threshold} className={`quest-tier ${isUnlocked ? 'quest-tier--unlocked' : 'quest-tier--locked'}`}>
            <div className="quest-tier__header">
              <div className="quest-tier__title">
                <i className={tier.icon}></i>
                <h3>{tier.label}</h3>
                {tier.threshold > 0 && (
                  <span className="quest-tier__requirement">({tier.threshold}+ standing)</span>
                )}
              </div>
              <span className={`badge ${isUnlocked ? 'success' : 'secondary'}`}>
                <i className={`fas ${isUnlocked ? 'fa-lock-open' : 'fa-lock'}`}></i>
                {isUnlocked ? ' Unlocked' : ' Locked'}
              </span>
            </div>

            <div className="quest-grid">
              {tierPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className={`quest-card card ${!isUnlocked ? 'quest-card--locked' : ''}`}
                >
                  <div className="quest-card__header">
                    <h4 className="quest-card__name">{prompt.name}</h4>
                    <span
                      className="badge badge--accent"
                      style={isUnlocked && faction.color ? { borderColor: faction.color } : undefined}
                    >
                      +{prompt.modifier} Bonus
                    </span>
                  </div>

                  {prompt.description && (
                    <p className="quest-card__description">{prompt.description}</p>
                  )}

                  {!isUnlocked && (
                    <div className="quest-card__locked-overlay">
                      <i className="fas fa-lock"></i>
                      <span>Requires {tier.threshold} standing</span>
                    </div>
                  )}

                  {isUnlocked && prompt.submissionGiftItems && prompt.submissionGiftItems.length > 0 && (
                    <div className="quest-card__rewards">
                      <span className="quest-card__rewards-label">
                        <i className="fas fa-gift"></i> Rewards:
                      </span>
                      {prompt.submissionGiftItems.map((gift, i) => (
                        <span key={i} className="quest-card__reward-item">
                          {gift.type === 'specific' && gift.items?.map((item, j) => (
                            <span key={j} className="badge secondary sm">
                              {item.quantity}x {item.name}
                            </span>
                          ))}
                          {gift.type === 'random_category' && (
                            <span className="badge secondary sm">
                              {gift.quantity}x from {gift.category}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
