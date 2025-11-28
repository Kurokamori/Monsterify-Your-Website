import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import fakemonService from '../../services/fakemonService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const FakemonDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fakemon, setFakemon] = useState(null);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set document title based on fakemon name
  useDocumentTitle(fakemon ? fakemon.name : 'Fakemon');

  useEffect(() => {
    fetchFakemonData();
  }, [id]);

  const fetchFakemonData = async () => {
    try {
      setLoading(true);

      // Fetch fakemon details
      const fakemonResponse = await fakemonService.getFakemonByNumber(id);
      setFakemon(fakemonResponse.fakemon || null);

      // Fetch evolution chain
      const evolutionResponse = await fakemonService.getEvolutionChain(id);
      setEvolutionChain(evolutionResponse.evolutionChain || []);

    } catch (err) {
      console.error(`Error fetching fakemon ${id}:`, err);
      setError('Failed to load fakemon data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback data for development
  const fallbackFakemon = {
    number: id,
    name: 'Leafeon',
    image_path: 'https://via.placeholder.com/300/1e2532/d6a339?text=Fakemon',
    types: ['Grass'],
    description: 'A leafy evolution of Eevee that thrives in forests and gardens.',
    height: '1.0 m',
    weight: '25.5 kg',
    category: 'Verdant Pokémon',
    abilities: ['Leaf Guard', 'Chlorophyll (Hidden)'],
    stats: {
      hp: 65,
      attack: 110,
      defense: 130,
      spAttack: 60,
      spDefense: 65,
      speed: 95
    },
    evolutions: ['Eevee', 'Leafeon'],
    habitat: 'Forests and lush gardens',
    rarity: 'Uncommon',
    artist: 'Jane Doe',
    artist_caption: 'Art by Jane Doe'
  };


  // Process fakemon data to ensure it has the required structure
  const processFakemon = (mon) => {
    if (!mon) return fallbackFakemon;

    // Create types array from type1, type2, etc. fields if needed
    const types = mon.types || [mon.type1, mon.type2, mon.type3, mon.type4, mon.type5]
      .filter(Boolean); // Remove null/undefined values

    // Create abilities array from ability1, ability2, hidden_ability fields
    const abilities = [];
    if (mon.ability1) abilities.push(mon.ability1);
    if (mon.ability2) abilities.push(mon.ability2);
    if (mon.hidden_ability) abilities.push(`${mon.hidden_ability} (Hidden)`);

    // Handle stats - use individual columns if available, otherwise parse JSON
    let stats;
    if (mon.hp !== undefined && mon.attack !== undefined) {
      // Use individual stat columns
      stats = {
        hp: mon.hp || 50,
        attack: mon.attack || 50,
        defense: mon.defense || 50,
        spAttack: mon.special_attack || 50,
        spDefense: mon.special_defense || 50,
        speed: mon.speed || 50
      };
    } else if (typeof mon.stats === 'string') {
      // Parse JSON stats (legacy support)
      try {
        stats = JSON.parse(mon.stats);
      } catch (e) {
        console.error('Error parsing stats:', e);
        stats = {
          hp: 50,
          attack: 50,
          defense: 50,
          spAttack: 50,
          spDefense: 50,
          speed: 50
        };
      }
    } else if (mon.stats && typeof mon.stats === 'object') {
      stats = mon.stats;
    } else {
      stats = {
        hp: 50,
        attack: 50,
        defense: 50,
        spAttack: 50,
        spDefense: 50,
        speed: 50
      };
    }

    return {
      ...mon,
      types: types.length > 0 ? types : ['Normal'],
      abilities: abilities.length > 0 ? abilities : ['Unknown'],
      stats: stats,
      // Format number with leading zeros
      displayNumber: String(mon.number || 0).padStart(3, '0'),
      // Use image_url if available, otherwise use image_path
      image_path: mon.image_url || mon.image_path || 'https://via.placeholder.com/300/1e2532/d6a339?text=No+Image'
    };
  };

  // Process evolution chain data
  const processEvolutionChain = (chain) => {
    if (!chain || chain.length === 0) return [];

    return chain.map(evo => {
      // Create types array from type1, type2, etc. fields if needed
      const types = evo.types || [evo.type1, evo.type2, evo.type3, evo.type4, evo.type5]
        .filter(Boolean); // Remove null/undefined values

      return {
        ...evo,
        types: types.length > 0 ? types : ['Normal'],
        // Use image_url if available, otherwise use image_path
        image_path: evo.image_url || evo.image_path || 'https://via.placeholder.com/100/1e2532/d6a339?text=No+Image'
      };
    });
  };

  const displayFakemon = processFakemon(fakemon);
  const displayEvolutionChain = processEvolutionChain(evolutionChain);

  if (loading) {
    return <LoadingSpinner message="Loading fakemon data..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
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
      <div className="fakemon-detail-header">
        <div className="fakemon-image-container">
          <img
            src={displayFakemon.image_path}
            alt={displayFakemon.name}
            className="fakemon-detail-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/default_mon.png';
            }}
          />
          {displayFakemon.artist_caption && (
            <div className="artist-caption">
              {displayFakemon.artist_caption}
            </div>
          )}
        </div>
        <div className="fakemon-header-info">
          <div className="fakemon-number-name">
            <span className="fakemon-number">#{displayFakemon.displayNumber || String(displayFakemon.number || 0).padStart(3, '0')}</span>
            <h1 className="fakemon-name">{displayFakemon.name}</h1>
          </div>
          <div className="fakemon-types">
            {displayFakemon.types && displayFakemon.types.length > 0 ? (
              displayFakemon.types.map((type, index) => (
                <span className={`type-badge type-${type.toLowerCase()}`} key={index}>
                  {type}
                </span>
              ))
            ) : (
              <span className="type-badge type-normal">Normal</span>
            )}
          </div>
          <p className="fakemon-description">{displayFakemon.description}</p>
          <div className="fakemon-basic-info">
            {displayFakemon.category && (
              <div className="info-item">
                <span className="info-label">Category</span>
                <span className="info-value">{displayFakemon.category}</span>
              </div>
            )}
            {displayFakemon.height && (
              <div className="info-item">
                <span className="info-label">Height</span>
                <span className="info-value">{displayFakemon.height}</span>
              </div>
            )}
            {displayFakemon.weight && (
              <div className="info-item">
                <span className="info-label">Weight</span>
                <span className="info-value">{displayFakemon.weight}</span>
              </div>
            )}
            {displayFakemon.habitat && (
              <div className="info-item">
                <span className="info-label">Habitat</span>
                <span className="info-value">{displayFakemon.habitat}</span>
              </div>
            )}
            {displayFakemon.rarity && (
              <div className="info-item">
                <span className="info-label">Rarity</span>
                <span className="info-value">{displayFakemon.rarity}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fakemon-detail-content">
        <div className="fakemon-info-section">
          <div className="info-section">
            <h2>Abilities</h2>
            <div className="abilities-list">
              {displayFakemon.abilities && displayFakemon.abilities.map((ability, index) => (
                <div className="ability-item" key={index}>
                  {ability.includes('(Hidden)') ? (
                    <>
                      <span className="ability-name">{ability.replace('(Hidden)', '')}</span>
                      <span className="ability-hidden">Hidden</span>
                    </>
                  ) : (
                    <span className="ability-name">{ability}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="info-section">
            <h2>Details</h2>
            <p className="fakemon-full-description">
              {displayFakemon.full_description || displayFakemon.description}
            </p>
          </div>
        </div>

        <div className="fakemon-stats-section">
          <h2>Base Stats</h2>
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-label">HP</span>
              <div className="stat-bar-container">
                <div
                  className="stat-bar hp-bar"
                  style={{ width: `${((displayFakemon.stats?.hp || 50) / 255) * 100}%` }}
                ></div>
              </div>
              <span className="stat-value">{displayFakemon.stats?.hp || 50}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Attack</span>
              <div className="stat-bar-container">
                <div
                  className="stat-bar attack-bar"
                  style={{ width: `${((displayFakemon.stats?.attack || 50) / 255) * 100}%` }}
                ></div>
              </div>
              <span className="stat-value">{displayFakemon.stats?.attack || 50}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Defense</span>
              <div className="stat-bar-container">
                <div
                  className="stat-bar defense-bar"
                  style={{ width: `${((displayFakemon.stats?.defense || 50) / 255) * 100}%` }}
                ></div>
              </div>
              <span className="stat-value">{displayFakemon.stats?.defense || 50}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sp. Attack</span>
              <div className="stat-bar-container">
                <div
                  className="stat-bar sp-attack-bar"
                  style={{ width: `${((displayFakemon.stats?.spAttack || 50) / 255) * 100}%` }}
                ></div>
              </div>
              <span className="stat-value">{displayFakemon.stats?.spAttack || 50}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Sp. Defense</span>
              <div className="stat-bar-container">
                <div
                  className="stat-bar sp-defense-bar"
                  style={{ width: `${((displayFakemon.stats?.spDefense || 50) / 255) * 100}%` }}
                ></div>
              </div>
              <span className="stat-value">{displayFakemon.stats?.spDefense || 50}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Speed</span>
              <div className="stat-bar-container">
                <div
                  className="stat-bar speed-bar"
                  style={{ width: `${((displayFakemon.stats?.speed || 50) / 255) * 100}%` }}
                ></div>
              </div>
              <span className="stat-value">{displayFakemon.stats?.speed || 50}</span>
            </div>
          </div>
        </div>

        {displayEvolutionChain && displayEvolutionChain.length > 0 && (
          <div className="fakemon-evolution-section">
            <h2>Evolution Chain</h2>
            <div className="evolution-chain">
              {displayEvolutionChain.map((evo, index) => (
                <React.Fragment key={evo.number}>
                  <Link
                    to={`/fakedex/${evo.number}`}
                    className={`evolution-item ${evo.number === displayFakemon.number ? 'current' : ''}`}
                  >
                    <div className="evolution-image-container">
                      <img
                        src={evo.image_path}
                        alt={evo.name}
                        className="evolution-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default_mon.png';
                        }}
                      />
                    </div>
                    <div className="evolution-info">
                      <span className="evolution-number">#{evo.number}</span>
                      <span className="evolution-name">{evo.name}</span>
                      <div className="evolution-types">
                        {evo.types && evo.types.length > 0 ? (
                          evo.types.map((type, typeIndex) => (
                            <span className={`type-badge type-${type.toLowerCase()}`} key={typeIndex}>
                              {type}
                            </span>
                          ))
                        ) : (
                          <span className="type-badge type-normal">Normal</span>
                        )}
                      </div>
                    </div>
                  </Link>
                  {index < displayEvolutionChain.length - 1 && (
                    <div className="evolution-arrow">
                      <i className="fas fa-arrow-right"></i>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fakemon-navigation">
        {parseInt(id) > 1 && (
          <Link to={`/fakedex/${parseInt(id) - 1}`} className="nav-button prev-button">
            <i className="fas fa-chevron-left"></i>
            <span>#{parseInt(id) - 1}</span>
          </Link>
        )}
        <Link to="/fakedex" className="nav-button back-button">
          <i className="fas fa-th"></i>
          <span>Fakemon Dex</span>
        </Link>
        <Link to={`/fakedex/${parseInt(id) + 1}`} className="nav-button next-button">
          <span>#{parseInt(id) + 1}</span>
          <i className="fas fa-chevron-right"></i>
        </Link>
      </div>
    </div>
  );
};

export default FakemonDetailPage;
