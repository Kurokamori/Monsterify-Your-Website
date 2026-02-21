import { useState } from 'react';
import { Card } from '@components/common/Card';
import { TypeBadge } from '@components/common/TypeBadge';
import { AttributeBadge } from '@components/common/AttributeBadge';
import { BadgeGroup } from '@components/common/BadgeGroup';
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete';
import { RewardItem } from '@components/common/RewardItem';
import { getItemImageUrl, handleItemImageError } from '@utils/imageUtils';
import type {
  ActivityReward,
  TownTrainer,
} from './types';

/** Extra per-reward metadata (e.g. from GameCorner claimed_by_monster_name) */
export interface RewardExtraData {
  claimed_by_monster_name?: string;
  claimed_by_type?: string;
}

export interface ActivityRewardGridProps {
  rewards: ActivityReward[];
  trainers: TownTrainer[];
  selectedTrainers: Record<string | number, string | number>;
  onTrainerSelect: (rewardId: string | number, trainerId: string | number | null) => void;
  onClaim: (rewardId: string | number) => void;
  onForfeit?: (rewardId: string | number) => void;
  claimingReward?: string | number | null;
  speciesImages?: Record<string, { image_url: string }>;
  /** Item name → image URL mapping (fetched from database) */
  itemImages?: Record<string, string | null>;
  monsterNames?: Record<string | number, string>;
  onMonsterNameChange?: (rewardId: string | number, name: string) => void;
  rewardExtras?: Record<string | number, RewardExtraData>;
}

/**
 * Normalize a reward so that both camelCase (backend) and snake_case keys work.
 */
function normalizeReward(raw: ActivityReward): ActivityReward {
  const r = raw as ActivityReward & Record<string, unknown>;
  return {
    ...r,
    reward_data: r.reward_data ?? (r.rewardData as ActivityReward['reward_data']) ?? ({} as never),
    claimed_by: r.claimed_by ?? (r.claimedBy as ActivityReward['claimed_by']),
    claimed_at: r.claimed_at ?? (r.claimedAt as string),
    assigned_to: r.assigned_to ?? (r.assignedTo as ActivityReward['assigned_to']),
  } as ActivityReward;
}

/** Safe accessor for reward_data as a generic record */
function rd(reward: ActivityReward): Record<string, unknown> {
  return (reward.reward_data ?? {}) as Record<string, unknown>;
}

/** Get all species image entries from reward data */
function getSpeciesImages(
  data: Record<string, unknown>,
  externalImages?: Record<string, { image_url: string }>,
): { species: string; url: string | null }[] {
  const entries: { species: string; url: string | null }[] = [];

  for (let i = 1; i <= 3; i++) {
    const species = data[`species${i}`] as string | undefined;
    if (!species) continue;

    let url = (data[`species${i}_image`] as string | null) || null;

    // Fall back to external species images map
    if (!url && externalImages?.[species]) {
      url = externalImages[species].image_url;
    }

    // For species1, also check general image fields
    if (!url && i === 1) {
      url = (data.img_link || data.image_url || data.monster_image) as string | null;
    }

    entries.push({ species, url });
  }

  // Fallback if no species fields but has a generic species field
  if (entries.length === 0 && data.species) {
    entries.push({ species: data.species as string, url: null });
  }

  return entries;
}

/** Format snake_case / kebab-case to Title Case */
function formatName(name: string): string {
  return name
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/** Build a "Claimed by X" or "Claimed by X's MonsterName" string */
function getClaimedByLabel(
  reward: ActivityReward,
  trainers: TownTrainer[],
  extras?: RewardExtraData,
): string {
  // Forfeited rewards have claimed_by of -1 or 'Garden-Forfeit'
  if (reward.claimed_by === -1 || reward.claimed_by === 'Garden-Forfeit') {
    return 'Forfeited to the Bazar';
  }

  const trainer = reward.claimed_by
    ? trainers.find(t => t.id === reward.claimed_by)
    : null;
  const trainerName = trainer?.name || 'Unknown';

  if (extras?.claimed_by_type === 'monster' && extras?.claimed_by_monster_name) {
    return `${trainerName}'s ${extras.claimed_by_monster_name}`;
  }

  return trainerName;
}

export function ActivityRewardGrid({
  rewards,
  trainers,
  selectedTrainers,
  onTrainerSelect,
  onClaim,
  onForfeit,
  claimingReward,
  speciesImages,
  itemImages,
  monsterNames,
  onMonsterNameChange,
  rewardExtras,
}: ActivityRewardGridProps) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<{ url: string; species: string } | null>(null);

  const normalized = rewards.map(normalizeReward);
  const monsterRewards = normalized.filter(r => r.type === 'monster');
  const otherRewards = normalized.filter(r => r.type !== 'monster');

  const handleImgError = (key: string) => {
    setImgErrors(prev => ({ ...prev, [key]: true }));
  };

  return (
    <div className="activity-reward-grid">
      {/* Items & Other Rewards */}
      {otherRewards.length > 0 && (
        <div className="activity-reward-grid__section">
          <div className="activity-reward-grid__section-header">
            <i className="fas fa-box"></i>
            <h2>Items & Rewards</h2>
          </div>
          <div className="activity-reward-grid__items">
            {otherRewards.map(reward => {
              const data = rd(reward);
              const itemName = data.name as string | undefined;
              const itemCategory = data.category as string | undefined;
              const quantity = (data.quantity as number) || 1;
              const isItem = reward.type === 'item' && !!itemName;

              return (
                <Card key={reward.id} className={`activity-reward-grid__card${reward.claimed ? ' activity-reward-grid__card--claimed' : ''}`} variant="compact">
                  <div className="activity-reward-grid__card-inner">
                    {isItem ? (
                      <div className="activity-reward-grid__item-display">
                        <img
                          src={itemImages?.[itemName] || getItemImageUrl({ name: itemName, category: itemCategory })}
                          alt={itemName}
                          className="activity-reward-grid__item-image"
                          onError={(e) => handleItemImageError(e, itemCategory)}
                        />
                        <div className="activity-reward-grid__item-info">
                          <span className="activity-reward-grid__item-name">{formatName(itemName)}</span>
                          {quantity > 1 && (
                            <span className="activity-reward-grid__item-qty">x{quantity}</span>
                          )}
                          {reward.rarity && (
                            <span className={`badge ${reward.rarity} xs`}>
                              {reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <RewardItem
                        reward={{
                          type: reward.type,
                          rarity: reward.rarity,
                          claimed: reward.claimed,
                          amount: (data.amount ?? data.levels ?? data.points ?? data.quantity) as number | undefined,
                          label: (data.title as string) || undefined,
                        }}
                      />
                    )}

                    <div className="activity-reward-grid__actions">
                      {reward.claimed ? (
                        <div className="activity-reward-grid__claimed">
                          <div className="badge success">
                            <i className="fas fa-check-circle"></i> Claimed
                          </div>
                          {reward.claimed_by && (
                            <span className="activity-reward-grid__claimed-by">
                              by {getClaimedByLabel(reward, trainers, rewardExtras?.[reward.id])}
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <TrainerAutocomplete
                            trainers={trainers}
                            selectedTrainerId={selectedTrainers[reward.id]}
                            onChange={(id) => onTrainerSelect(reward.id, id)}
                            label=""
                            placeholder="Select trainer"
                          />
                          <div className="activity-reward-grid__buttons">
                            <button
                              className="button primary sm"
                              onClick={() => onClaim(reward.id)}
                              disabled={claimingReward === reward.id}
                            >
                              {claimingReward === reward.id ? (
                                <><i className="fas fa-spinner fa-spin"></i> Claiming...</>
                              ) : (
                                <><i className="fas fa-hand-paper"></i> Claim</>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Monster Rewards */}
      {monsterRewards.length > 0 && (
        <div className="activity-reward-grid__section">
          <div className="activity-reward-grid__section-header">
            <i className="fas fa-dragon"></i>
            <h2>Monsters</h2>
          </div>
          <div className="activity-reward-grid__monsters">
            {monsterRewards.map(reward => {
              const data = rd(reward);
              const speciesEntries = getSpeciesImages(data, speciesImages);
              const speciesDisplay = speciesEntries.map(e => e.species).join(' / ') || 'Monster';
              const level = data.level as number | undefined;
              const types = [
                data.type1, data.type2, data.type3, data.type4, data.type5,
              ].filter(Boolean) as string[];

              return (
                <Card key={reward.id} className={`activity-reward-grid__monster-card${reward.claimed ? ' activity-reward-grid__card--claimed' : ''}`} variant="compact">
                  <div className="activity-reward-grid__card-inner">
                    <div className="activity-reward-grid__monster-content">
                      {/* Species images — show up to 3 */}
                      <div className={`activity-reward-grid__species-images activity-reward-grid__species-images--${Math.max(Math.min(speciesEntries.length, 3), 1)}`}>
                        {speciesEntries.length === 0 && (
                          <div className="activity-reward-grid__species-fallback">
                            <i className="fas fa-dragon"></i>
                          </div>
                        )}
                        {speciesEntries.map((entry, idx) => {
                          const errKey = `${reward.id}-sp${idx}`;
                          return entry.url && !imgErrors[errKey] ? (
                            <img
                              key={idx}
                              src={entry.url}
                              alt={entry.species}
                              className="activity-reward-grid__species-img activity-reward-grid__species-img--clickable"
                              onError={() => handleImgError(errKey)}
                              onClick={() => setLightbox({ url: entry.url!, species: entry.species })}
                              title={`View ${entry.species}`}
                            />
                          ) : (
                            <div key={idx} className="activity-reward-grid__species-fallback">
                              <i className="fas fa-dragon"></i>
                              <span className="activity-reward-grid__species-fallback-name">{entry.species}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="activity-reward-grid__monster-info">
                        <h3 className="activity-reward-grid__monster-name">{speciesDisplay}</h3>
                        {level != null && (
                          <span className="activity-reward-grid__monster-level">Level {level}</span>
                        )}

                        {types.length > 0 && (
                          <BadgeGroup gap="xs">
                            {types.map((type, idx) => (
                              <TypeBadge key={idx} type={type} size="sm" />
                            ))}
                          </BadgeGroup>
                        )}

                        {data.attribute ? (
                          <AttributeBadge attribute={data.attribute as string} size="sm" />
                        ) : null}

                        {reward.rarity && (
                          <span className={`badge ${reward.rarity} sm`}>
                            {reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="activity-reward-grid__actions">
                      {reward.claimed ? (
                        <div className="activity-reward-grid__claimed">
                          <div className="badge success">
                            <i className="fas fa-check-circle"></i> Claimed
                          </div>
                          {reward.claimed_by && (
                            <span className="activity-reward-grid__claimed-by">
                              by {getClaimedByLabel(reward, trainers, rewardExtras?.[reward.id])}
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          <TrainerAutocomplete
                            trainers={trainers}
                            selectedTrainerId={selectedTrainers[reward.id]}
                            onChange={(id) => onTrainerSelect(reward.id, id)}
                            label=""
                            placeholder="Select trainer"
                          />
                          {onMonsterNameChange && (
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Monster name (optional)"
                              value={monsterNames?.[reward.id] || ''}
                              onChange={e => onMonsterNameChange(reward.id, e.target.value)}
                            />
                          )}
                          <div className="activity-reward-grid__buttons">
                            <button
                              className="button primary sm"
                              onClick={() => onClaim(reward.id)}
                              disabled={claimingReward === reward.id}
                            >
                              {claimingReward === reward.id ? (
                                <><i className="fas fa-spinner fa-spin"></i> Claiming...</>
                              ) : (
                                <><i className="fas fa-hand-paper"></i> Claim</>
                              )}
                            </button>
                            {onForfeit && (
                              <button
                                className="button danger sm"
                                onClick={() => onForfeit(reward.id)}
                              >
                                <i className="fas fa-times"></i> Forfeit
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {lightbox && (
        <div
          className="activity-reward-grid__lightbox"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.species}
        >
          <div className="activity-reward-grid__lightbox-content" onClick={e => e.stopPropagation()}>
            <button
              className="activity-reward-grid__lightbox-close"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              <i className="fas fa-times"></i>
            </button>
            <img
              src={lightbox.url}
              alt={lightbox.species}
              className="activity-reward-grid__lightbox-img"
            />
            <p className="activity-reward-grid__lightbox-caption">{lightbox.species}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityRewardGrid;
