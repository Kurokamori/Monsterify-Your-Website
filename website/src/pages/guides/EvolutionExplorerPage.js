import React, { useState, useEffect, useCallback } from 'react';
import useDebounce from '../../hooks/useDebounce';
import speciesService from '../../services/speciesService';
import evolutionCacheService from '../../services/evolutionCacheService';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import './EvolutionExplorerPage.css';

const EvolutionExplorerPage = () => {
  useDocumentTitle('Evolution Explorer - Guides');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedDigimon, setExpandedDigimon] = useState(new Set());
  const [showSearch, setShowSearch] = useState(true);
  const [collapsedRows, setCollapsedRows] = useState(new Set());

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Search for species with caching
  useEffect(() => {
    const searchSpecies = async () => {
      if (debouncedSearchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        
        // Check cache first
        const cachedResults = evolutionCacheService.getSearchResults(debouncedSearchTerm);
        if (cachedResults) {
          setSearchResults(cachedResults);
          setLoading(false);
          return;
        }

        const response = await speciesService.searchSpecies(debouncedSearchTerm);
        
        if (response.success) {
          const results = response.species.slice(0, 10);
          setSearchResults(results);
          
          // Cache the results
          evolutionCacheService.setSearchResults(debouncedSearchTerm, results);
        }
      } catch (err) {
        console.error('Error searching species:', err);
        setError('Failed to search species');
      } finally {
        setLoading(false);
      }
    };

    searchSpecies();
  }, [debouncedSearchTerm]);

  // Get evolution options for a species with caching
  const getEvolutionOptions = async (speciesName) => {
    // Validate input
    if (!speciesName || typeof speciesName !== 'string' || speciesName.trim() === '') {
      console.warn('Invalid species name provided to getEvolutionOptions:', speciesName);
      return [];
    }

    const trimmedName = speciesName.trim();
    
    try {
      // Check cache first
      const cachedData = evolutionCacheService.getEvolutionData(trimmedName);
      if (cachedData) {
        return cachedData;
      }

      const response = await api.get(`/evolution/options/${encodeURIComponent(trimmedName)}`);
      const data = response.data.success ? response.data.data : [];
      
      // Cache the result
      evolutionCacheService.setEvolutionData(trimmedName, data);
      
      return data;
    } catch (error) {
      console.error(`Error fetching evolution options for "${trimmedName}":`, error);
      return [];
    }
  };

  // Get reverse evolution options (what evolves into this species) with caching
  const getReverseEvolutionOptions = async (speciesName) => {
    // Validate input
    if (!speciesName || typeof speciesName !== 'string' || speciesName.trim() === '') {
      console.warn('Invalid species name provided to getReverseEvolutionOptions:', speciesName);
      return [];
    }

    const trimmedName = speciesName.trim();
    
    try {
      // Check cache first
      const cachedData = evolutionCacheService.getReverseEvolutionData(trimmedName);
      if (cachedData) {
        return cachedData;
      }

      const response = await api.get(`/evolution/reverse/${encodeURIComponent(trimmedName)}`);
      const data = response.data.success ? response.data.data : [];
      
      // Cache the result
      evolutionCacheService.setReverseEvolutionData(trimmedName, data);
      
      return data;
    } catch (error) {
      console.error(`Error fetching reverse evolution options for "${trimmedName}":`, error);
      return [];
    }
  };

  // Build evolution chain starting from a species
  const buildEvolutionChain = useCallback(async (startSpecies, mode = 'forward') => {
    const visited = new Set();
    const maxDepth = 8; // Allow deeper chains for complex Digimon trees

    // Helper function to get species with image
    const getSpeciesWithImage = async (speciesName) => {
      // Validate input
      if (!speciesName || typeof speciesName !== 'string' || speciesName.trim() === '') {
        console.warn('Invalid species name provided to getSpeciesWithImage:', speciesName);
        return null;
      }

      const trimmedName = speciesName.trim();
      const species = { name: trimmedName, image: null };
      
      try {
        const cachedImage = evolutionCacheService.getImageData(trimmedName);
        if (cachedImage) {
          species.image = cachedImage;
        } else {
          const imageResponse = await speciesService.getSpeciesImages([trimmedName]);
          if (imageResponse.success && imageResponse.speciesImages[trimmedName]) {
            const imageUrl = imageResponse.speciesImages[trimmedName].image_url;
            species.image = imageUrl;
            evolutionCacheService.setImageData(trimmedName, imageUrl);
          } else {
            evolutionCacheService.setImageData(trimmedName, null);
          }
        }
      } catch (error) {
        console.error(`Error fetching species image for "${trimmedName}":`, error);
        evolutionCacheService.setImageData(trimmedName, null);
      }
      
      return species;
    };

    // Build evolution structure for both directions (forward and reverse)
    const buildBidirectionalEvolutionStructure = async (speciesName, isExpanded = false) => {
      console.log(`Building bidirectional structure for: ${speciesName}, expanded: ${isExpanded}`);
      
      // Validate input
      if (!speciesName || typeof speciesName !== 'string' || speciesName.trim() === '') {
        console.warn('Invalid species name provided to buildBidirectionalEvolutionStructure:', speciesName);
        return null;
      }

      const trimmedSpeciesName = speciesName.trim();
      const species = await getSpeciesWithImage(trimmedSpeciesName);
      
      if (!species || !species.name) {
        console.warn('Failed to get species data for:', trimmedSpeciesName);
        return null;
      }

      // Determine species type
      const isDigimon = await isSpeciesDigimon(trimmedSpeciesName);
      console.log(`Species ${trimmedSpeciesName} is Digimon: ${isDigimon}`);
      
      // For Digimon, limit depth unless expanded; for others, show full tree
      const shouldLimitDepth = isDigimon && !isExpanded;
      const maxTreeDepth = shouldLimitDepth ? 1 : maxDepth;
      
      console.log(`Max tree depth for ${trimmedSpeciesName}: ${maxTreeDepth} (shouldLimitDepth: ${shouldLimitDepth})`);
      
      // Get forward evolutions (what this species evolves into)
      const forwardEvolutions = await buildEvolutionDirection(trimmedSpeciesName, 'forward', maxTreeDepth, new Set());
      
      // Get reverse evolutions (what evolves into this species)  
      const reverseEvolutions = await buildEvolutionDirection(trimmedSpeciesName, 'reverse', maxTreeDepth, new Set());
      
      console.log(`Forward evolutions for ${trimmedSpeciesName}:`, forwardEvolutions);
      console.log(`Reverse evolutions for ${trimmedSpeciesName}:`, reverseEvolutions);
      
      return {
        species: species,
        forwardEvolutions: forwardEvolutions,
        reverseEvolutions: reverseEvolutions,
        isDigimon: isDigimon,
        isExpanded: isExpanded,
        isRoot: true
      };
    };

    // Helper function to check if species is a Digimon
    const isSpeciesDigimon = async (speciesName) => {
      try {
        const evolutionOptions = await getEvolutionOptions(speciesName);
        const reverseOptions = await getReverseEvolutionOptions(speciesName);
        
        // Check if any evolution option has type 'digimon'
        const allOptions = [...evolutionOptions, ...reverseOptions];
        return allOptions.some(option => option && option.type === 'digimon');
      } catch (error) {
        return false;
      }
    };

    // Build evolution tree in one direction
    const buildEvolutionDirection = async (speciesName, direction, maxTreeDepth, visited, depth = 0) => {
      console.log(`Building ${direction} evolutions for ${speciesName} at depth ${depth}, maxDepth: ${maxTreeDepth}`);
      
      if (depth >= maxTreeDepth) {
        console.log(`Reached max depth ${maxTreeDepth} for ${speciesName}`);
        return [];
      }

      if (visited.has(speciesName)) {
        console.log(`Already visited ${speciesName}`);
        return [];
      }

      const newVisited = new Set(visited);
      newVisited.add(speciesName);
      
      const evolutionOptions = direction === 'forward' 
        ? await getEvolutionOptions(speciesName)
        : await getReverseEvolutionOptions(speciesName);
      
      console.log(`Got ${evolutionOptions.length} evolution options for ${speciesName}:`, evolutionOptions);
      
      // Filter out invalid options
      const validOptions = evolutionOptions.filter(option => {
        if (!option || typeof option !== 'object') {
          return false;
        }
        if (!option.name || typeof option.name !== 'string' || option.name.trim() === '') {
          return false;
        }
        return true;
      });

      console.log(`Filtered to ${validOptions.length} valid options for ${speciesName}`);

      const children = [];
      for (const option of validOptions) {
        const optionName = option.name.trim();
        console.log(`Processing evolution option: ${optionName}`);
        
        if (!newVisited.has(optionName)) {
          const speciesData = await getSpeciesWithImage(optionName);
          if (speciesData) {
            const subChildren = await buildEvolutionDirection(optionName, direction, maxTreeDepth, newVisited, depth + 1);
            children.push({
              species: speciesData,
              children: subChildren,
              depth: depth + 1
            });
            console.log(`Added ${optionName} to children for ${speciesName}`);
          }
        } else {
          console.log(`Skipping ${optionName} - already visited`);
        }
      }
      
      console.log(`Built ${children.length} children for ${speciesName}`);
      return children;
    };

    const rootStructure = await buildBidirectionalEvolutionStructure(startSpecies, expandedDigimon.has(startSpecies));
    return rootStructure ? [rootStructure] : [];
  }, [expandedDigimon]);

  // Handle species selection
  const handleSpeciesSelect = async (speciesName) => {
    setSelectedSpecies(speciesName);
    setShowSearch(false);
    setLoading(true);
    setError(null);
    setCollapsedRows(new Set()); // Reset collapsed state

    try {
      const chain = await buildEvolutionChain(speciesName);
      setEvolutionChain(chain);
    } catch (err) {
      console.error('Error building evolution chain:', err);
      setError('Failed to load evolution chain');
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking on a Digimon to expand its full tree
  const handleDigimonExpand = async (speciesName) => {
    if (expandedDigimon.has(speciesName)) {
      // Already expanded, collapse it
      const newExpanded = new Set(expandedDigimon);
      newExpanded.delete(speciesName);
      setExpandedDigimon(newExpanded);
    } else {
      // Expand this Digimon
      const newExpanded = new Set(expandedDigimon);
      newExpanded.add(speciesName);
      setExpandedDigimon(newExpanded);
    }
    
    // Reload the evolution chain with the new expansion state
    if (selectedSpecies) {
      setLoading(true);
      try {
        const chain = await buildEvolutionChain(selectedSpecies);
        setEvolutionChain(chain);
      } catch (err) {
        console.error('Error rebuilding evolution chain:', err);
        setError('Failed to reload evolution chain');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle clicking on a species in the chain
  const handleSpeciesClick = (speciesName) => {
    handleSpeciesSelect(speciesName);
  };

  // Handle node collapse/expand
  const toggleNodeCollapse = (nodeId) => {
    const newCollapsedRows = new Set(collapsedRows);
    if (newCollapsedRows.has(nodeId)) {
      newCollapsedRows.delete(nodeId);
    } else {
      newCollapsedRows.add(nodeId);
    }
    setCollapsedRows(newCollapsedRows);
  };

  // Reset to search
  const resetToSearch = () => {
    setSelectedSpecies(null);
    setEvolutionChain([]);
    setShowSearch(true);
    setSearchTerm('');
    setError(null);
    setCollapsedRows(new Set());
  };



  // Render species card
  const renderSpeciesCard = (species, isTarget = false, isDigimon = false, isExpanded = false) => (
    <div 
      key={species.name}
      className={`evolution-explorer-species-card ${isTarget ? 'target-species' : ''}`}
      onClick={() => {
        if (isTarget && isDigimon) {
          handleDigimonExpand(species.name);
        } else if (!isTarget) {
          handleSpeciesClick(species.name);
        }
      }}
      role={isTarget && !isDigimon ? undefined : "button"}
      tabIndex={isTarget && !isDigimon ? undefined : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ')) {
          if (isTarget && isDigimon) {
            handleDigimonExpand(species.name);
          } else if (!isTarget) {
            handleSpeciesClick(species.name);
          }
        }
      }}
    >
      <div className="evolution-explorer-species-image-container">
        {species.image ? (
          <img 
            src={species.image} 
            alt={species.name}
            className="evolution-explorer-species-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="evolution-explorer-species-placeholder" style={{ display: species.image ? 'none' : 'flex' }}>
          <span>No Image</span>
        </div>
      </div>
      <div className="evolution-explorer-species-name">{species.name}</div>
      {isTarget && isDigimon ? (
        <div className="evolution-explorer-click-hint">
          {isExpanded ? 'Click to show less' : 'Click to show full tree'}
        </div>
      ) : !isTarget ? (
        <div className="evolution-explorer-click-hint">Click to explore</div>
      ) : null}
    </div>
  );

  // Generate unique node ID for collapse/expand functionality
  const getNodeId = (node) => {
    return `${node.species.name}-${node.depth}`;
  };

  // Render bidirectional evolution structure
  const renderBidirectionalEvolution = (evolutionData) => {
    const { species, forwardEvolutions, reverseEvolutions, isDigimon, isExpanded } = evolutionData;

    return (
      <div key={`bidirectional-${species.name}`} className="bidirectional-evolution-container">
        {/* Reverse evolutions (pre-evolutions) */}
        {reverseEvolutions && reverseEvolutions.length > 0 && (
          <div className="reverse-evolutions-section">
            <div className="evolution-section-header">
              <span className="evolution-section-label">Pre-evolutions</span>
            </div>
            <div className="evolution-columns-container">
              {renderEvolutionTree(reverseEvolutions, 'reverse')}
            </div>
          </div>
        )}

        {/* Target species */}
        <div className="target-species-section">
          <div className="target-species-container">
            {renderSpeciesCard(species, true, isDigimon, isExpanded)}
          </div>
        </div>

        {/* Forward evolutions */}
        {forwardEvolutions && forwardEvolutions.length > 0 && (
          <div className="forward-evolutions-section">
            <div className="evolution-section-header">
              <span className="evolution-section-label">Evolutions</span>
            </div>
            <div className="evolution-columns-container">
              {renderEvolutionTree(forwardEvolutions, 'forward')}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render evolution tree in one direction
  const renderEvolutionTree = (evolutions, direction) => {
    return evolutions.map((evolutionNode, index) => (
      <div key={`${direction}-${evolutionNode.species.name}-${index}`} className="evolution-column">
        <div className="evolution-level">
          <div className="evolution-column-species">
            {renderSpeciesCard(evolutionNode.species, false)}
          </div>
        </div>
        {evolutionNode.children && evolutionNode.children.length > 0 && (
          <>
            <div className="evolution-level-connector"></div>
            {renderEvolutionTree(evolutionNode.children, direction)}
          </>
        )}
      </div>
    ));
  };

  // Recursively render nested evolution structure with columns
  const renderNestedEvolutionNode = (node, isRoot = false) => {
    const nodeId = getNodeId(node);
    const isCollapsed = collapsedRows.has(nodeId);
    const hasChildren = node.children && node.children.length > 0;

    // Helper function to render a column with species and its sub-evolutions
    const renderEvolutionColumn = (childNode, maxDepth = 0, columnId = '') => {
      const column = [];
      const collectEvolutionLevels = (node, currentDepth = 0, path = '') => {
        if (currentDepth > maxDepth) return;
        
        if (!column[currentDepth]) column[currentDepth] = [];
        column[currentDepth].push({
          species: node.species,
          uniqueId: `${columnId}-${path}-${node.species.name}-${currentDepth}`
        });
        
        if (node.children && node.children.length > 0 && currentDepth < maxDepth) {
          node.children.forEach((child, childIndex) => {
            collectEvolutionLevels(child, currentDepth + 1, `${path}-${childIndex}`);
          });
        }
      };
      
      collectEvolutionLevels(childNode, 0, '0');
      return column;
    };

    // Calculate maximum depth needed
    const calculateMaxDepth = (node, currentDepth = 0) => {
      if (!node.children || node.children.length === 0) return currentDepth;
      let maxChildDepth = currentDepth;
      node.children.forEach(child => {
        const childDepth = calculateMaxDepth(child, currentDepth + 1);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      });
      return maxChildDepth;
    };

    const maxDepth = hasChildren ? calculateMaxDepth({ children: node.children }) : 0;

    return (
      <div key={nodeId} className="nested-evolution-node" data-depth={node.depth}>
        {/* Parent species */}
        <div className="evolution-node-header">
          <div className="parent-species-container">
            {renderSpeciesCard(node.species, isRoot)}
          </div>
          {hasChildren && (
            <button 
              className="nested-collapse-button"
              onClick={() => toggleNodeCollapse(nodeId)}
              title={isCollapsed ? "Expand to show evolutions" : "Collapse to hide evolutions"}
            >
              {isCollapsed ? '▶️' : '▼'}
            </button>
          )}
        </div>

        {/* Column-based evolution display */}
        {hasChildren && !isCollapsed && (
          <div 
            className="evolution-columns-container"
            ref={(el) => {
              if (el && isRoot) {
                // Scroll to center horizontally when the container is first rendered
                setTimeout(() => {
                  const scrollWidth = el.scrollWidth;
                  const clientWidth = el.clientWidth;
                  if (scrollWidth > clientWidth) {
                    const scrollPosition = (scrollWidth - clientWidth) / 2;
                    el.scrollLeft = scrollPosition;
                  }
                }, 100); // Small delay to ensure content is rendered
              }
            }}
          >
            {node.children.map((childNode, columnIndex) => {
              const columnId = `${nodeId}-col-${columnIndex}`;
              const column = renderEvolutionColumn(childNode, maxDepth, columnId);
              return (
                <div key={columnId} className="evolution-column">
                  {column.map((levelSpecies, levelIndex) => (
                    <React.Fragment key={`${columnId}-level-${levelIndex}`}>
                      {levelIndex > 0 && (
                        <div className="evolution-level-connector"></div>
                      )}
                      <div className="evolution-level">
                        {levelSpecies.map((speciesEntry) => (
                          <div key={speciesEntry.uniqueId} className="evolution-column-species">
                            {renderSpeciesCard(speciesEntry.species, false)}
                          </div>
                        ))}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="evolution-explorer-page">
      <div className="page-header">
        <h1>Evolution Explorer</h1>
        <p>Explore evolution trees for Digimon, Yokai, Pokemon, Nexomon, and Fakemon</p>
        

      </div>

      {/* Search Section */}
      {showSearch && (
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter a species name to explore its evolution tree..."
              className="species-search-input"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results:</h3>
              <div className="results-grid">
                {searchResults.map(species => (
                  <button
                    key={species}
                    className="species-result-button"
                    onClick={() => handleSpeciesSelect(species)}
                  >
                    {species}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evolution Tree Display */}
      {!showSearch && (
        <div className="evolution-tree-section">
          <div className="tree-header">
            <button className="back-button" onClick={resetToSearch}>
              ← Back to Search
            </button>
            <h2>Evolution tree for {selectedSpecies}</h2>
          </div>

          {loading && <LoadingSpinner message="Building evolution chain..." />}
          
          {error && (
            <ErrorMessage
              message={error}
              onRetry={() => handleSpeciesSelect(selectedSpecies)}
            />
          )}

          {!loading && !error && evolutionChain.length > 0 && (
            <div className="nested-evolution-container">
              <div className="nested-evolution-tree">
                {evolutionChain.map((evolutionData) => renderBidirectionalEvolution(evolutionData))}
              </div>
            </div>
          )}

          {!loading && !error && evolutionChain.length === 0 && selectedSpecies && (
            <div className="evolution-explorer-no-evolutions">
              <p>{selectedSpecies} doesn't have any known evolutions or pre-evolutions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvolutionExplorerPage;