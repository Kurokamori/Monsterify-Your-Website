import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import fakemonService from '../../services/fakemonService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import useDocumentTitle from '../../hooks/useDocumentTitle';

// --- Helper functions ---

const getStatTotal = (stats) => {
  if (!stats) return 0;
  return (stats.hp || 0) + (stats.attack || 0) + (stats.defense || 0) +
    (stats.spAttack || 0) + (stats.spDefense || 0) + (stats.speed || 0);
};

const getStatColorClass = (value) => {
  if (value >= 150) return 'stat-legendary';
  if (value >= 120) return 'stat-excellent';
  if (value >= 90) return 'stat-great';
  if (value >= 60) return 'stat-good';
  if (value >= 30) return 'stat-average';
  return 'stat-low';
};

const buildEvolutionTree = (chain) => {
  if (!chain || chain.length === 0) return [];

  // Find root(s) - entries with no evolves_from
  const roots = chain.filter(evo =>
    evo.evolves_from === null || evo.evolves_from === undefined || evo.evolves_from === ''
  );

  // If no explicit root found (legacy data), treat first entry as root
  if (roots.length === 0 && chain.length > 0) {
    roots.push(chain[0]);
  }

  const buildNode = (entry) => {
    const children = chain.filter(evo =>
      String(evo.evolves_from) === String(entry.number) && String(evo.number) !== String(entry.number)
    );
    return {
      ...entry,
      children: children.map(child => buildNode(child))
    };
  };

  return roots.map(root => buildNode(root));
};

const STAT_CONFIG = [
  { key: 'hp', label: 'HP', barClass: 'hp-bar' },
  { key: 'attack', label: 'Atk', barClass: 'attack-bar' },
  { key: 'defense', label: 'Def', barClass: 'defense-bar' },
  { key: 'spAttack', label: 'SpA', barClass: 'sp-attack-bar' },
  { key: 'spDefense', label: 'SpD', barClass: 'sp-defense-bar' },
  { key: 'speed', label: 'Spe', barClass: 'speed-bar' },
];

// --- Component ---

const FakemonDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fakemon, setFakemon] = useState(null);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [prevFakemon, setPrevFakemon] = useState(null);
  const [nextFakemon, setNextFakemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useDocumentTitle(fakemon ? fakemon.name : 'Fakemon');

  useEffect(() => {
    fetchFakemonData();
  }, [id]);

  const fetchFakemonData = async () => {
    try {
      setLoading(true);
      const fakemonResponse = await fakemonService.getFakemonByNumber(id);
      setFakemon(fakemonResponse.fakemon || null);
      setPrevFakemon(fakemonResponse.prevFakemon || null);
      setNextFakemon(fakemonResponse.nextFakemon || null);

      const evolutionResponse = await fakemonService.getEvolutionChain(id);
      setEvolutionChain(evolutionResponse.evolutionChain || []);
    } catch (err) {
      console.error(`Error fetching fakemon ${id}:`, err);
      setError('Failed to load fakemon data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const processFakemon = (mon) => {
    if (!mon) return null;

    const types = mon.types || [mon.type1, mon.type2, mon.type3, mon.type4, mon.type5]
      .filter(Boolean);

    const abilities = [];
    if (mon.ability1) abilities.push(mon.ability1);
    if (mon.ability2) abilities.push(mon.ability2);
    if (mon.hidden_ability) abilities.push(`${mon.hidden_ability} (Hidden)`);

    let stats;
    if (mon.hp !== undefined && mon.attack !== undefined) {
      stats = {
        hp: parseInt(mon.hp, 10) || 50,
        attack: parseInt(mon.attack, 10) || 50,
        defense: parseInt(mon.defense, 10) || 50,
        spAttack: parseInt(mon.special_attack, 10) || 50,
        spDefense: parseInt(mon.special_defense, 10) || 50,
        speed: parseInt(mon.speed, 10) || 50
      };
    } else if (typeof mon.stats === 'string') {
      try {
        const parsed = JSON.parse(mon.stats);
        stats = {
          hp: parseInt(parsed.hp, 10) || 50,
          attack: parseInt(parsed.attack, 10) || 50,
          defense: parseInt(parsed.defense, 10) || 50,
          spAttack: parseInt(parsed.spAttack || parsed.special_attack, 10) || 50,
          spDefense: parseInt(parsed.spDefense || parsed.special_defense, 10) || 50,
          speed: parseInt(parsed.speed, 10) || 50
        };
      } catch (e) {
        stats = { hp: 50, attack: 50, defense: 50, spAttack: 50, spDefense: 50, speed: 50 };
      }
    } else if (mon.stats && typeof mon.stats === 'object') {
      stats = {
        hp: parseInt(mon.stats.hp, 10) || 50,
        attack: parseInt(mon.stats.attack, 10) || 50,
        defense: parseInt(mon.stats.defense, 10) || 50,
        spAttack: parseInt(mon.stats.spAttack || mon.stats.special_attack, 10) || 50,
        spDefense: parseInt(mon.stats.spDefense || mon.stats.special_defense, 10) || 50,
        speed: parseInt(mon.stats.speed, 10) || 50
      };
    } else {
      stats = { hp: 50, attack: 50, defense: 50, spAttack: 50, spDefense: 50, speed: 50 };
    }

    return {
      ...mon,
      types: types.length > 0 ? types : ['Normal'],
      abilities: abilities.length > 0 ? abilities : ['Unknown'],
      stats,
      displayNumber: String(mon.number || 0).padStart(3, '0'),
      image_path: mon.image_url || mon.image_path || 'https://via.placeholder.com/300/1e2532/d6a339?text=No+Image'
    };
  };

  const processEvolutionChain = (chain) => {
    if (!chain || chain.length === 0) return [];
    return chain.map(evo => {
      const types = evo.types || [evo.type1, evo.type2, evo.type3, evo.type4, evo.type5]
        .filter(Boolean);
      return {
        ...evo,
        types: types.length > 0 ? types : ['Normal'],
        image_path: evo.image_url || evo.image_path || 'https://via.placeholder.com/100/1e2532/d6a339?text=No+Image',
        method: evo.method || null,
        method_detail: evo.method_detail || null,
        evolves_from: evo.evolves_from !== undefined ? evo.evolves_from : null
      };
    });
  };

  const displayFakemon = processFakemon(fakemon);
  const displayEvolutionChain = processEvolutionChain(evolutionChain);
  const evolutionTree = buildEvolutionTree(displayEvolutionChain);

  // Recursive evolution tree renderer
  const renderEvolutionNode = (node, isRoot = false) => {
    const isCurrent = node.number === displayFakemon?.number;

    return (
      <div className="evo-tree-node" key={node.number}>
        <Link
          to={`/fakedex/${node.number}`}
          className={`evo-tree-entry ${isCurrent ? 'evo-current' : ''}`}
        >
          <div className="evo-tree-image-wrap">
            <img
              src={node.image_path}
              alt={node.name}
              className="evo-tree-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/default_mon.png';
              }}
            />
          </div>
          <span className="evo-tree-name">{node.name}</span>
        </Link>

        {node.children && node.children.length > 0 && (
          <div className={`evo-tree-branches ${node.children.length > 1 ? 'evo-branching' : ''}`}>
            {node.children.map(child => (
              <div className="evo-tree-branch" key={child.number}>
                <div className="evo-tree-connector">
                  <div className="evo-tree-arrow-line">
                    <div className="evo-tree-line"></div>
                    <div className="evo-tree-arrow">
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </div>
                  <span className="evo-tree-method">
                    {child.method === 'item' && <i className="fas fa-gem"></i>}
                    {child.method === 'level' && <i className="fas fa-arrow-up"></i>}
                    {child.method === 'condition' && <i className="fas fa-star"></i>}
                    {child.method_detail || (child.level > 1 ? `Lv. ${child.level}` : '???')}
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

  if (loading) {
    return <LoadingSpinner message="Loading fakemon data..." />;
  }

  if (error || !displayFakemon) {
    return (
      <ErrorMessage
        message={error || 'Fakemon not found.'}
        onRetry={fetchFakemonData}
        backButton={{
          text: 'Back to Fakemon Dex',
          onClick: () => navigate('/fakedex')
        }}
      />
    );
  }

  return (
    <div className="fakemon-detail-container">
      {/* Hero Section */}
      <div className="fakemon-hero">
        <div className="fakemon-hero-image-wrap">
          <div className="fakemon-hero-glow"></div>
          <img
            src={displayFakemon.image_path}
            alt={displayFakemon.name}
            className="fakemon-hero-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/default_mon.png';
            }}
          />
          {displayFakemon.artist_caption && (
            <div className="artist-caption">{displayFakemon.artist_caption}</div>
          )}
        </div>
        <div className="fakemon-hero-info">
          <span className="fakemon-number">#{displayFakemon.displayNumber}</span>
          <h1 className="fakemon-name">{displayFakemon.name}</h1>
          {displayFakemon.classification && (
            <p className="fakemon-category-subtitle">{displayFakemon.classification}</p>
          )}
          {displayFakemon.category && (
            <div className="fakemon-universe-tag">
              <span className={`category-tag category-${displayFakemon.category.toLowerCase().replace(/\s+/g, '-')}`}>
                {displayFakemon.category}
              </span>
            </div>
          )}
          <div className="fakemon-types">
            {displayFakemon.types.map((type, index) => (
              <span className={`type-badge type-${type.toLowerCase()}`} key={index}>
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="fakemon-info-panel">
        <div className="fakemon-panel-section">
          <h2 className="panel-heading">Abilities</h2>
          <div className="abilities-pills">
            {displayFakemon.abilities.map((ability, index) => (
              <span
                className={`ability-pill ${ability.includes('(Hidden)') ? 'ability-hidden-pill' : ''}`}
                key={index}
              >
                {ability.includes('(Hidden)')
                  ? ability.replace(' (Hidden)', '')
                  : ability}
                {ability.includes('(Hidden)') && (
                  <span className="hidden-tag">Hidden</span>
                )}
              </span>
            ))}
          </div>
        </div>
        <div className="fakemon-panel-section">
          <h2 className="panel-heading">Details</h2>
          <div className="detail-pairs">
            {displayFakemon.height && (
              <div className="detail-pair">
                <span className="detail-key">Height</span>
                <span className="detail-val">{displayFakemon.height}</span>
              </div>
            )}
            {displayFakemon.weight && (
              <div className="detail-pair">
                <span className="detail-key">Weight</span>
                <span className="detail-val">{displayFakemon.weight}</span>
              </div>
            )}
            {displayFakemon.habitat && (
              <div className="detail-pair">
                <span className="detail-key">Habitat</span>
                <span className="detail-val">{displayFakemon.habitat}</span>
              </div>
            )}
            {displayFakemon.rarity && (
              <div className="detail-pair">
                <span className="detail-key">Rarity</span>
                <span className="detail-val">{displayFakemon.rarity}</span>
              </div>
            )}
          </div>
        </div>
        {(displayFakemon.full_description || displayFakemon.description) && (
          <div className="fakemon-description-full">
            <h2 className="panel-heading">Description</h2>
            <p>{displayFakemon.full_description || displayFakemon.description}</p>
          </div>
        )}
      </div>

      {/* Compact Stats */}
      <div className="fakemon-stats-compact">
        <h2 className="panel-heading">Base Stats</h2>
        <div className="stats-grid">
          {STAT_CONFIG.map(stat => {
            const value = displayFakemon.stats?.[stat.key] || 0;
            return (
              <div className="stat-row" key={stat.key}>
                <span className="stat-label">{stat.label}</span>
                <span className={`stat-value ${getStatColorClass(value)}`}>{value}</span>
                <div className="stat-bar-track">
                  <div
                    className={`stat-bar-fill ${stat.barClass}`}
                    style={{ width: `${(value / 255) * 100}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
          <div className="stat-row stat-total-row">
            <span className="stat-label">Total</span>
            <span className="stat-value stat-total-value">{getStatTotal(displayFakemon.stats)}</span>
            <div className="stat-bar-track stat-total-track"></div>
          </div>
        </div>
      </div>

      {/* Evolution Section - Always Visible */}
      <div className="fakemon-evolution-section">
        <h2 className="panel-heading">Evolution</h2>
        {displayEvolutionChain.length === 0 ? (
          <div className="evo-none">
            <i className="fas fa-ban"></i>
            <span>This Fakemon does not evolve.</span>
          </div>
        ) : (
          <div className="evo-tree">
            {evolutionTree.map(root => renderEvolutionNode(root, true))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fakemon-navigation">
        {prevFakemon && (
          <Link to={`/fakedex/${prevFakemon.number}`} className="nav-button prev-button">
            <i className="fas fa-chevron-left"></i>
            <span>#{String(prevFakemon.number).padStart(3, '0')} {prevFakemon.name}</span>
          </Link>
        )}
        <Link to="/fakedex" className="nav-button back-button">
          <i className="fas fa-th"></i>
          <span>Fakemon Dex</span>
        </Link>
        {nextFakemon && (
          <Link to={`/fakedex/${nextFakemon.number}`} className="nav-button next-button">
            <span>#{String(nextFakemon.number).padStart(3, '0')} {nextFakemon.name}</span>
            <i className="fas fa-chevron-right"></i>
          </Link>
        )}
      </div>
    </div>
  );
};

export default FakemonDetailPage;
