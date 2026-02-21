import { useState, useEffect, useCallback, type SyntheticEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import fakemonService, {
  type Fakemon,
  type EvolutionEntry,
} from '../../services/fakemonService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { TypeBadge } from '../../components/common/TypeBadge';
import { BadgeGroup } from '../../components/common/BadgeGroup';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

// --- Stat helpers ---

interface ParsedStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

const STAT_CONFIG = [
  { key: 'hp' as const, label: 'HP', barClass: 'hp-bar' },
  { key: 'attack' as const, label: 'Atk', barClass: 'attack-bar' },
  { key: 'defense' as const, label: 'Def', barClass: 'defense-bar' },
  { key: 'spAttack' as const, label: 'SpA', barClass: 'sp-attack-bar' },
  { key: 'spDefense' as const, label: 'SpD', barClass: 'sp-defense-bar' },
  { key: 'speed' as const, label: 'Spe', barClass: 'speed-bar' },
];

function parseStats(mon: Fakemon): ParsedStats {
  return {
    hp: Number(mon.hp) || 0,
    attack: Number(mon.attack) || 0,
    defense: Number(mon.defense) || 0,
    spAttack: Number(mon.special_attack) || 0,
    spDefense: Number(mon.special_defense) || 0,
    speed: Number(mon.speed) || 0,
  };
}

function getStatTotal(stats: ParsedStats): number {
  return stats.hp + stats.attack + stats.defense + stats.spAttack + stats.spDefense + stats.speed;
}

function getStatColorClass(value: number): string {
  if (value >= 150) return ' stat-legendary';
  if (value >= 120) return ' stat-excellent';
  if (value >= 90) return ' stat-great';
  if (value >= 60) return ' stat-good';
  if (value >= 30) return ' stat-average';
  return ' stat-low';
}

// --- Type/ability helpers ---

function getTypes(mon: Fakemon | EvolutionEntry): string[] {
  return [mon.type1, mon.type2, mon.type3, mon.type4, mon.type5].filter(
    (t): t is string => !!t
  );
}

function getAbilities(mon: Fakemon): string[] {
  const abilities: string[] = [];
  if (mon.ability1) abilities.push(mon.ability1);
  if (mon.ability2) abilities.push(mon.ability2);
  if (mon.hidden_ability) abilities.push(`${mon.hidden_ability} (Hidden)`);
  return abilities;
}

function getImageSrc(src?: string): string {
  return src || '/images/default_mon.png';
}

function formatDexNumber(num: number): string {
  return String(num).padStart(3, '0');
}

// --- Evolution tree builder ---

interface EvolutionNode extends EvolutionEntry {
  children: EvolutionNode[];
}

function buildEvolutionTree(chain: EvolutionEntry[]): EvolutionNode[] {
  if (!chain || chain.length === 0) return [];

  const roots = chain.filter(
    evo => evo.evolves_from === null || evo.evolves_from === undefined,
  );
  if (roots.length === 0 && chain.length > 0) roots.push(chain[0]);

  const buildNode = (entry: EvolutionEntry): EvolutionNode => {
    const children = chain.filter(
      evo =>
        String(evo.evolves_from) === String(entry.number) &&
        String(evo.number) !== String(entry.number),
    );
    return { ...entry, children: children.map(buildNode) };
  };

  return roots.map(buildNode);
}

// --- Image error handler ---

function handleImageError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = '/images/default_mon.png';
}

// --- Component ---

export default function FakemonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [fakemon, setFakemon] = useState<Fakemon | null>(null);
  const [evolutionChain, setEvolutionChain] = useState<EvolutionEntry[]>([]);
  const [prevFakemon, setPrevFakemon] = useState<{ number: number; name: string } | null>(null);
  const [nextFakemon, setNextFakemon] = useState<{ number: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDocumentTitle(fakemon?.name ?? 'Fakemon');

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const [detailRes, evoRes] = await Promise.all([
        fakemonService.getFakemonByNumber(id),
        fakemonService.getEvolutionChain(id),
      ]);

      setFakemon(detailRes.fakemon ?? null);
      setPrevFakemon(detailRes.prevFakemon ?? null);
      setNextFakemon(detailRes.nextFakemon ?? null);
      setEvolutionChain(evoRes.evolutionChain ?? []);
    } catch {
      setError('Failed to load fakemon data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingSpinner message="Loading fakemon data..." />;

  if (error || !fakemon) {
    return (
      <ErrorMessage
        message={error || 'Fakemon not found.'}
        onRetry={fetchData}
        backButton={{ text: 'Back to Fakemon Dex', onClick: () => navigate('/fakedex') }}
      />
    );
  }

  const types = getTypes(fakemon);
  const abilities = getAbilities(fakemon);
  const stats = parseStats(fakemon);
  const bst = getStatTotal(stats);
  const displayNumber = formatDexNumber(fakemon.number);
  const imageSrc = getImageSrc(fakemon.image_url || fakemon.image_path);
  const evolutionTree = buildEvolutionTree(evolutionChain);
  const description = fakemon.full_description || fakemon.description;

  const renderEvolutionNode = (node: EvolutionNode) => {
    const isCurrent = node.number === fakemon.number;

    return (
      <div className="evo-tree-node" key={node.number}>
        <Link
          to={`/fakedex/${node.number}`}
          className={`evo-tree-entry${isCurrent ? ' evo-current' : ''}`}
        >
          <div className="evo-tree-image-wrap">
            <img
              src={getImageSrc(node.image_url || node.image_path)}
              alt={node.name}
              className="evo-tree-image"
              onError={handleImageError}
            />
          </div>
          <span className="evo-tree-name">{node.name}</span>
        </Link>

        {node.children.length > 0 && (
          <div className={`evo-tree-branches${node.children.length > 1 ? ' evo-branching' : ''}`}>
            {node.children.map(child => (
              <div className="evo-tree-branch" key={child.number}>
                <div className="evo-tree-connector">
                  <div className="evo-tree-line" />
                  <div className="evo-tree-arrow">
                    <i className="fa-solid fa-chevron-right" />
                  </div>
                  <span className="evo-tree-method">
                    {child.method === 'item' && <i className="fa-solid fa-gem" />}
                    {child.method === 'level' && <i className="fa-solid fa-arrow-up" />}
                    {child.method === 'condition' && <i className="fa-solid fa-star" />}
                    {child.method_detail || (child.level && child.level > 1 ? `Lv. ${child.level}` : '???')}
                  </span>
                </div>
                {renderEvolutionNode(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fakedex-container">
      {/* Hero Section */}
      <div className="fakemon-hero">
        <div className="fakemon-hero-image-wrap">
          <div className="fakemon-hero-glow" />
          <img
            src={imageSrc}
            alt={fakemon.name}
            className="fakemon-hero-image"
            onError={handleImageError}
          />
          {fakemon.artist_caption && (
            <div className="artist-caption">{fakemon.artist_caption}</div>
          )}
        </div>
        <div className="fakemon-hero-text">
          <span className="fakemon-number">#{displayNumber}</span>
          <h1 className="fakemon-name">{fakemon.name}</h1>
          {fakemon.classification && (
            <p className="fakemon-classification-subtitle">{fakemon.classification}</p>
          )}
          {fakemon.category && (
            <div className="fakemon-universe-tag">
              <span className={`category-tag category-${fakemon.category.toLowerCase().replace(/\s+/g, '-')}`}>
                {fakemon.category}
              </span>
            </div>
          )}
          <BadgeGroup gap="sm">
            {types.length > 0
              ? types.map(type => <TypeBadge key={type} type={type} size="md" />)
              : <TypeBadge type="Normal" size="md" />
            }
          </BadgeGroup>
        </div>
      </div>

      {/* Info Panel */}
      <div className="fakemon-info-panel">
        <div className="fakemon-panel-card">
          <h2 className="panel-heading">Abilities</h2>
          <div className="abilities-pills">
            {abilities.length > 0 ? abilities.map((ability, i) => {
              const isHidden = ability.includes('(Hidden)');
              return (
                <span
                  key={i}
                  className={`ability-pill${isHidden ? ' ability-hidden-pill' : ''}`}
                >
                  {isHidden ? ability.replace(' (Hidden)', '') : ability}
                  {isHidden && <span className="hidden-tag">Hidden</span>}
                </span>
              );
            }) : (
              <span className="ability-pill">Unknown</span>
            )}
          </div>
        </div>

        <div className="fakemon-panel-card">
          <h2 className="panel-heading">Details</h2>
          <div className="detail-pairs">
            {fakemon.height && (
              <div className="detail-pair">
                <span className="detail-key">Height</span>
                <span className="detail-val">{fakemon.height}</span>
              </div>
            )}
            {fakemon.weight && (
              <div className="detail-pair">
                <span className="detail-key">Weight</span>
                <span className="detail-val">{fakemon.weight}</span>
              </div>
            )}
            {fakemon.habitat && (
              <div className="detail-pair">
                <span className="detail-key">Habitat</span>
                <span className="detail-val">{fakemon.habitat}</span>
              </div>
            )}
            {fakemon.rarity && (
              <div className="detail-pair">
                <span className="detail-key">Rarity</span>
                <span className="detail-val">{fakemon.rarity}</span>
              </div>
            )}
          </div>
        </div>

        {description && (
          <div className="fakemon-description-full">
            <h2 className="panel-heading">Description</h2>
            <p>{description}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="fakemon-stats-compact">
        <h2 className="panel-heading">Base Stats</h2>
        <div className="stats-grid">
          {STAT_CONFIG.map(stat => {
            const value = stats[stat.key];
            return (
              <div className="stat-row" key={stat.key}>
                <span className="stat-label">{stat.label}</span>
                <span className={`stat-value${getStatColorClass(value)}`}>{value}</span>
                <div className="stat-bar-track">
                  <div
                    className={`stat-bar-fill ${stat.barClass}`}
                    style={{ width: `${(value / 255) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="stat-row stat-total-row">
            <span className="stat-label">Total</span>
            <span className="stat-value stat-total-value">{bst}</span>
            <div className="stat-bar-track stat-total-track" />
          </div>
        </div>
      </div>

      {/* Evolution */}
      <div className="fakemon-evolution-section">
        <h2 className="panel-heading">Evolution</h2>
        {evolutionChain.length === 0 ? (
          <div className="evo-none">
            <i className="fa-solid fa-ban" />
            <span>This Fakemon does not evolve.</span>
          </div>
        ) : (
          <div className="evo-tree">
            {evolutionTree.map(root => renderEvolutionNode(root))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fakemon-navigation">
        {prevFakemon ? (
          <Link to={`/fakedex/${prevFakemon.number}`} className="button secondary">
            <i className="fa-solid fa-chevron-left" />
            <span>#{formatDexNumber(prevFakemon.number)} {prevFakemon.name}</span>
          </Link>
        ) : <span />}
        <Link to="/fakedex" className="button secondary">
          <i className="fa-solid fa-th" />
          <span>Fakemon Dex</span>
        </Link>
        {nextFakemon ? (
          <Link to={`/fakedex/${nextFakemon.number}`} className="button secondary">
            <span>#{formatDexNumber(nextFakemon.number)} {nextFakemon.name}</span>
            <i className="fa-solid fa-chevron-right" />
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
