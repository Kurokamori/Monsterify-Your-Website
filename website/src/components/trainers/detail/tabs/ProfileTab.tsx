import { Link } from 'react-router-dom';
import { TypeBadge } from '@components/common/TypeBadge';
import { MarkdownRenderer } from '@components/common/MarkdownRenderer';
import { YouTubeSection } from '../shared/YouTubeSection';
import { calculateDisplayAge } from '../useTrainerDetail';
import type { Trainer, TrainerSecret, AdditionalReference } from '@components/trainers/types/Trainer';
import type { FeaturedMonster } from '../useTrainerDetail';
import { formatBirthday, getZodiacEmoji, getChineseZodiacEmoji } from '@utils/zodiacUtils';

interface ProfileTabProps {
  trainer: Trainer;
  featuredMonsters: (FeaturedMonster | null)[];
  featuredMonstersCollapsed: boolean;
  setFeaturedMonstersCollapsed: (v: boolean) => void;
  monstersCount: number;
  setActiveTab: (tab: string) => void;
  handleImageClick: (src: string, alt: string) => void;
}

export const ProfileTab = ({
  trainer,
  featuredMonsters,
  featuredMonstersCollapsed,
  setFeaturedMonstersCollapsed,
  monstersCount,
  setActiveTab,
  handleImageClick,
}: ProfileTabProps) => {
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/images/default_mon.png';
  };

  // Parse secrets
  let secrets: TrainerSecret[] = [];
  if (trainer.secrets) {
    try {
      secrets = typeof trainer.secrets === 'string'
        ? JSON.parse(trainer.secrets)
        : trainer.secrets;
      if (!Array.isArray(secrets)) secrets = [];
    } catch {
      secrets = [];
    }
  }

  // Parse additional refs
  let additionalRefs: AdditionalReference[] = [];
  if (trainer.additional_refs) {
    try {
      additionalRefs = typeof trainer.additional_refs === 'string'
        ? JSON.parse(trainer.additional_refs)
        : trainer.additional_refs;
      if (!Array.isArray(additionalRefs)) additionalRefs = [];
    } catch {
      additionalRefs = [];
    }
  }

  // Parse mega info
  let megaInfo: Record<string, string | undefined> = {};
  if (trainer.mega_info) {
    try {
      megaInfo = typeof trainer.mega_info === 'string'
        ? JSON.parse(trainer.mega_info)
        : (trainer.mega_info as unknown as Record<string, string>);
    } catch { /* skip */ }
  }
  const megaRef = megaInfo.mega_ref || trainer.mega_ref;
  const megaArtist = megaInfo.mega_artist || trainer.mega_artist;
  const megaSpecies1 = megaInfo.mega_species1 || trainer.mega_species1;
  const megaSpecies2 = megaInfo.mega_species2 || trainer.mega_species2;
  const megaSpecies3 = megaInfo.mega_species3 || trainer.mega_species3;
  const megaType1 = megaInfo.mega_type1 || trainer.mega_type1;
  const megaType2 = megaInfo.mega_type2 || trainer.mega_type2;
  const megaType3 = megaInfo.mega_type3 || trainer.mega_type3;
  const megaType4 = megaInfo.mega_type4 || trainer.mega_type4;
  const megaType5 = megaInfo.mega_type5 || trainer.mega_type5;
  const megaType6 = megaInfo.mega_type6 || trainer.mega_type6;
  const megaAbility = megaInfo.mega_ability || trainer.mega_ability;
  const hasMega = megaSpecies1 || megaType1 || megaAbility || megaRef;

  const activeFeatured = featuredMonsters.filter(fm => fm !== null);

  const trainerExt = trainer as unknown as Record<string, unknown>;
  const favTypes = [trainer.fav_type1, trainer.fav_type2, trainer.fav_type3, trainer.fav_type4, trainer.fav_type5, trainer.fav_type6].filter(Boolean) as string[];

  return (
    <div className="town-square">
      {/* Featured Monsters */}
      {activeFeatured.length > 0 && (
        <div className="trainer-detail__stats-section">
          <div className="collapsible-header" onClick={() => setFeaturedMonstersCollapsed(!featuredMonstersCollapsed)}>
            <h2>Featured Monsters</h2>
            <i className={`fas fa-chevron-${featuredMonstersCollapsed ? 'down' : 'up'}`}></i>
          </div>
          {!featuredMonstersCollapsed && (
            <>
              <div className="catalogue-grid">
                {activeFeatured.map((monster) => (
                  <Link to={`/monsters/${monster!.id}`} className="trainer-detail__monster-card" key={monster!.id}>
                    <div className="monster-image-container">
                      <img
                        src={monster!.img_link || (monster as unknown as Record<string, string>)?.image_url || '/images/default_mon.png'}
                        alt={monster!.name}
                        className="monster-image"
                        onError={handleImgError}
                      />
                    </div>
                    <div className="monster-info-featured">
                      <h2 className="monster-name">{monster!.name}</h2>
                      <p className="monster-level">Level: {monster!.level}</p>
                    </div>
                    <div className="badge">
                      {[monster!.type1, monster!.type2, monster!.type3, monster!.type4, monster!.type5]
                        .filter(Boolean)
                        .map((type, idx) => (
                          <span key={idx} className={`badge type-${(type as string).toLowerCase()}`}></span>
                        ))}
                    </div>
                  </Link>
                ))}
              </div>
              {monstersCount > 0 && (
                <div className="container center horizontal">
                  <button className="button secondary" onClick={() => setActiveTab('pc')}>
                    View All {monstersCount} Monsters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Quote */}
      {trainer.quote && (
        <div className="trainer-quote-section">
          <div className="quote-content">
            <p>"{trainer.quote}"</p>
          </div>
        </div>
      )}

      {/* Personal Information */}
      {(trainer.full_name || trainer.title || trainer.nickname || trainer.age || trainer.gender || trainer.pronouns || trainer.sexuality || trainer.race || trainer.height || trainer.weight) && (
        <div className="trainer-detail__stats-section">
          <h2>Personal Information</h2>
          {(trainer.full_name || trainer.title) && (
            <div className="personal-hero-section">
              {trainer.full_name && <h3 className="full-name">{trainer.full_name}</h3>}
              {trainer.title && <h4 className="title">{trainer.title}</h4>}
            </div>
          )}
          {(trainer.nickname || trainer.age) && (
            <div className="personal-sub-hero">
              {trainer.nickname && <span className="nickname">"{trainer.nickname}"</span>}
              {trainer.age && <span className="age">Age: {calculateDisplayAge(trainer.age, trainer.birthday)}</span>}
            </div>
          )}
          {(trainer.gender || trainer.pronouns || trainer.sexuality || trainer.race) && (
            <div className="personal-info-row">
              {trainer.gender && (
                <div className="inventory-item">
                  <span className="detail-label">Gender</span>
                  <span className="detail-value">{trainer.gender}</span>
                </div>
              )}
              {trainer.pronouns && (
                <div className="inventory-item">
                  <span className="detail-label">Pronouns</span>
                  <span className="detail-value">{trainer.pronouns}</span>
                </div>
              )}
              {trainer.sexuality && (
                <div className="inventory-item">
                  <span className="detail-label">Sexuality</span>
                  <span className="detail-value">{trainer.sexuality}</span>
                </div>
              )}
              {trainer.race && (
                <div className="inventory-item">
                  <span className="detail-label">Race</span>
                  <span className="detail-value">{trainer.race}</span>
                </div>
              )}
            </div>
          )}
          {(trainer.height || trainer.weight) && (
            <div className="personal-info-row">
              {trainer.height && (
                <div className="inventory-item">
                  <span className="detail-label">Height</span>
                  <span className="detail-value">{trainer.height}</span>
                </div>
              )}
              {trainer.weight && (
                <div className="inventory-item">
                  <span className="detail-label">Weight</span>
                  <span className="detail-value">{trainer.weight}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Theme */}
      {trainer.theme && trainer.theme.trim() !== '' && trainer.theme !== '{"",""}' && (
        <div className="trainer-detail__stats-section">
          <h2>Theme</h2>
          <div className="trainer-theme-container">
            <YouTubeSection label="Theme" value={trainer.theme} />
          </div>
        </div>
      )}

      {/* Voice Claim */}
      {trainer.voice_claim && (
        <div className="trainer-detail__stats-section">
          <h2>Voice Claim</h2>
          <div className="trainer-theme-container">
            <YouTubeSection label="Voice Claim" value={trainer.voice_claim} />
          </div>
        </div>
      )}

      {/* Character Information */}
      {(trainer.strengths || trainer.weaknesses || trainer.likes || trainer.dislikes || trainer.flaws || trainer.values || trainer.quirks) && (
        <div className="trainer-detail__stats-section">
          <h2>Character Information</h2>
          <div className="trainer-details-grid-other">
            {[
              { label: 'Character Strengths', value: trainer.strengths },
              { label: 'Character Weaknesses', value: trainer.weaknesses },
              { label: 'Character Likes', value: trainer.likes },
              { label: 'Character Dislikes', value: trainer.dislikes },
              { label: 'Flaws', value: trainer.flaws },
              { label: 'Core Values', value: trainer.values },
              { label: 'Quirks', value: trainer.quirks },
            ].filter(item => item.value).map(item => (
              <div className="inventory-item" key={item.label}>
                <span className="detail-label">{item.label}</span>
                <span className="detail-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Information */}
      {(trainerExt.job || trainer.occupation || trainer.birthday || trainer.zodiac || trainer.chinese_zodiac || trainer.fav_berry || trainer.birthplace || trainer.residence || trainerExt.region || trainer.fav_type1) && (
        <div className="trainer-detail__stats-section">
          <h2>Other Information</h2>
          <div className="trainer-stats">
            {(trainer.birthday || trainer.zodiac || trainer.chinese_zodiac) && (
              <div className="info-group birthday-group">
                <h3 className="group-title">Birthday & Zodiac</h3>
                <div className="auth-form">
                  {trainer.birthday && (
                    <div className="inventory-item">
                      <span className="detail-label">Birthday</span>
                      <span className="detail-value">{formatBirthday(trainer.birthday)}</span>
                    </div>
                  )}
                  {trainer.zodiac && (
                    <div className="inventory-item">
                      <span className="detail-label">Zodiac Sign</span>
                      <span className="detail-value">{getZodiacEmoji(trainer.zodiac)} {trainer.zodiac}</span>
                    </div>
                  )}
                  {trainer.chinese_zodiac && (
                    <div className="inventory-item">
                      <span className="detail-label">Chinese Zodiac</span>
                      <span className="detail-value">{getChineseZodiacEmoji(trainer.chinese_zodiac)} {trainer.chinese_zodiac}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!!(trainerExt.job || trainer.occupation || trainer.birthplace || trainer.residence || trainerExt.region) && (
              <div className="info-group location-group">
                <h3 className="group-title">Location & Work</h3>
                <div className="auth-form">
                  {(trainerExt.job || trainer.occupation) && (
                    <div className="inventory-item">
                      <span className="detail-label">Occupation</span>
                      <span className="detail-value">{(trainerExt.job as string) || trainer.occupation}</span>
                    </div>
                  )}
                  {trainer.birthplace && (
                    <div className="inventory-item">
                      <span className="detail-label">Birthplace</span>
                      <span className="detail-value">{trainer.birthplace}</span>
                    </div>
                  )}
                  {trainer.residence && (
                    <div className="inventory-item">
                      <span className="detail-label">Residence</span>
                      <span className="detail-value">{trainer.residence}</span>
                    </div>
                  )}
                  {!!trainerExt.region && (
                    <div className="inventory-item">
                      <span className="detail-label">Region</span>
                      <span className="detail-value">{String(trainerExt.region)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(trainer.fav_berry || favTypes.length > 0) && (
              <div className="info-group favorites-group">
                <h3 className="group-title">Favorites</h3>
                <div className="auth-form">
                  {trainer.fav_berry && (
                    <div className="inventory-item">
                      <span className="detail-label">Favorite Berry</span>
                      <span className="detail-value">{trainer.fav_berry}</span>
                    </div>
                  )}
                  {favTypes.length > 0 && (
                    <div className="inventory-item fav-types-item">
                      <span className="detail-label">Favorite Types</span>
                      <div className="types-grid">
                        {favTypes.map((type, i) => (
                          <TypeBadge key={i} type={type} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mega Evolution Preview */}
      {hasMega && (
        <div className="trainer-detail__stats-section">
          <h2>Mega Evolution</h2>
          <div className="trainer-mega-info">
            {megaSpecies1 && (
              <div className="mega-detail-item">
                <span className="detail-label">Mega Form</span>
                <span className="detail-value">
                  {[megaSpecies1, megaSpecies2, megaSpecies3].filter(Boolean).join(' / ')}
                </span>
              </div>
            )}
            {megaRef && (
              <div className="mega-image-container">
                <img
                  src={megaRef}
                  alt={`${trainer.name} Mega Form`}
                  className="mega-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/images/default_trainer.png';
                  }}
                />
                {megaArtist && <div className="image-credit">Art by: {megaArtist}</div>}
              </div>
            )}
            {megaType1 && (
              <div className="mega-types">
                <span className="detail-label">Mega Types</span>
                <div className="trainer-types">
                  {[megaType1, megaType2, megaType3, megaType4, megaType5, megaType6]
                    .filter(Boolean)
                    .map((type, i) => (
                      <TypeBadge key={i} type={type!} fullWidth />
                    ))}
                </div>
              </div>
            )}
            {megaAbility && (
              <div className="mega-detail-item">
                <span className="detail-label">Mega Ability</span>
                <span className="detail-value">{megaAbility}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional References Preview */}
      {additionalRefs.length > 0 && (
        <div className="trainer-detail__stats-section">
          <h2>Additional References</h2>
          <div className="additional-refs-container">
            <div className="button">
              {additionalRefs.map((ref, index) => (
                <div className="adopt-card" key={ref.id || index}>
                  {ref.url && (
                    <div className="additional-ref-image">
                      <img
                        src={ref.url}
                        alt={ref.title || `Reference ${index + 1}`}
                        onClick={() => handleImageClick(ref.url, ref.title || `Reference ${index + 1}`)}
                        style={{ cursor: 'pointer' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/images/default_trainer.png';
                        }}
                      />
                    </div>
                  )}
                  <div className="additional-ref-info">
                    {ref.title && <h3>{ref.title}</h3>}
                    {ref.description && <p>{ref.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Secrets */}
      {secrets.length > 0 && (
        <div className="trainer-detail__stats-section">
          <h2>Secrets</h2>
          <div className="secrets-container">
            <div className="secrets-grid">
              {secrets.map((secret, index) => (
                <div className="secret-card" key={secret.id || index}>
                  <div className="secret-info">
                    {secret.title && <h3>{secret.title}</h3>}
                    {secret.description && <p>{secret.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Biography */}
      {trainer.biography && (
        <div className="trainer-detail__stats-section">
          <h2>Biography</h2>
          <div className="trainer-bio">
            <MarkdownRenderer content={trainer.biography} disableCodeBlocks />
          </div>
        </div>
      )}
    </div>
  );
};
