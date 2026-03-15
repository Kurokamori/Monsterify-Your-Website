import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useAuth } from '@contexts/useAuth';
import monsterService, { type Monster } from '@services/monsterService';
import userService, { type User as ServiceUser } from '@services/userService';
import {
  SearchBar,
  Pagination,
  TypeBadge,
  AttributeBadge,
  Modal,
} from '@components/common';
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete';

type SortField = 'id' | 'name' | 'level' | 'species1' | 'type1' | 'trainer_name' | 'attribute';
type SortOrder = 'asc' | 'desc';
type HasImage = 'both' | 'yes' | 'no';
type CardSize = 'small' | 'medium' | 'large';
type LayoutMode = 'grid' | 'list';

const CARD_SIZE_MINMAX: Record<CardSize, string> = {
  small: '180px',
  medium: '260px',
  large: '340px',
};

const PER_PAGE_OPTIONS = [12, 24, 48, 72, 100];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'level', label: 'Level' },
  { value: 'species1', label: 'Species' },
  { value: 'type1', label: 'Type' },
  { value: 'trainer_name', label: 'Trainer' },
  { value: 'attribute', label: 'Attribute' },
  { value: 'id', label: 'ID' },
];

const SPECIES_SLOT_OPTIONS = [
  { value: '', label: 'All Species Slots' },
  { value: '1', label: 'Species 1 Only' },
  { value: '2', label: 'Species 2 Only' },
  { value: '3', label: 'Species 3 Only' },
  { value: '1,2', label: 'Species 1 & 2' },
  { value: '1,3', label: 'Species 1 & 3' },
  { value: '2,3', label: 'Species 2 & 3' },
];

const TYPE_SLOT_OPTIONS = [
  { value: '', label: 'All Type Slots' },
  { value: '1', label: 'Type 1 Only' },
  { value: '2', label: 'Type 2 Only' },
  { value: '3', label: 'Type 3 Only' },
  { value: '4', label: 'Type 4 Only' },
  { value: '5', label: 'Type 5 Only' },
  { value: '1,2', label: 'Types 1 & 2' },
  { value: '1,2,3', label: 'Types 1-3' },
];

const AllTheMonstersPage = () => {
  useDocumentTitle('All The Monsters');
  const { currentUser } = useAuth();

  // Data
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMonsters, setTotalMonsters] = useState(0);

  // Search
  const [search, setSearch] = useState('');

  // Sort
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Filters
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [speciesSlots, setSpeciesSlots] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [typeSlots, setTypeSlots] = useState('');
  const [attributeFilter, setAttributeFilter] = useState('');
  const [trainerId, setTrainerId] = useState<string | number | null>(null);
  const defaultOwnerMode = currentUser ? 'mine' as const : 'all' as const;
  const [ownerMode, setOwnerMode] = useState<'all' | 'mine' | 'user' | 'trainer'>(defaultOwnerMode);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [levelMode, setLevelMode] = useState<'any' | 'above' | 'below' | 'exact'>('any');
  const [levelValue, setLevelValue] = useState('');
  const [hasImage, setHasImage] = useState<HasImage>('both');

  // Filter options
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  const [attributeOptions, setAttributeOptions] = useState<string[]>([]);

  // User search state
  const [allUsers, setAllUsers] = useState<ServiceUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<ServiceUser[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);

  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');

  // Filters panel visibility
  const [showFilters, setShowFilters] = useState(false);

  // View settings
  const [showViewSettings, setShowViewSettings] = useState(false);
  const [cardSize, setCardSize] = useState<CardSize>('medium');
  const [perPage, setPerPage] = useState(24);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [showSpecies, setShowSpecies] = useState(true);
  const [showTypes, setShowTypes] = useState(true);
  const [showAttribute, setShowAttribute] = useState(true);
  const [showTrainer, setShowTrainer] = useState(true);
  const [showOwner, setShowOwner] = useState(true);
  const [showLevel, setShowLevel] = useState(true);
  const [showImage, setShowImage] = useState(true);

  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Load filter options on mount
  useEffect(() => {
    monsterService.getFilterOptions().then(options => {
      setTypeOptions(options.types);
      setAttributeOptions(options.attributes);
    }).catch(() => { /* silent */ });
  }, []);

  // Load users when switching to "user" scope
  useEffect(() => {
    if (ownerMode === 'user' && !usersLoaded) {
      userService.getAllUsers().then((users) => {
        setAllUsers(users);
        setUsersLoaded(true);
      }).catch(() => { /* silent */ });
    }
  }, [ownerMode, usersLoaded]);

  // Filter users as user types
  useEffect(() => {
    if (!userSearch.trim()) {
      setUserResults(allUsers.slice(0, 20));
    } else {
      const lower = userSearch.toLowerCase();
      setUserResults(
        allUsers
          .filter(u =>
            u.username.toLowerCase().includes(lower) ||
            (u.display_name && u.display_name.toLowerCase().includes(lower))
          )
          .slice(0, 20)
      );
    }
  }, [userSearch, allUsers]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch monsters
  const fetchMonsters = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: perPage,
        sortBy,
        sortOrder,
      };

      if (search) params.search = search;
      if (speciesFilter) {
        params.species = speciesFilter;
        if (speciesSlots) params.speciesSlots = speciesSlots;
      }
      if (typeFilter) {
        params.type = typeFilter;
        if (typeSlots) params.typeSlots = typeSlots;
      }
      if (attributeFilter) params.attribute = attributeFilter;
      if (hasImage !== 'both') params.hasImage = hasImage;

      if (ownerMode === 'mine' && currentUser?.discord_id) {
        params.userId = currentUser.discord_id;
      } else if (ownerMode === 'user' && selectedUserId) {
        params.userId = selectedUserId;
      } else if (ownerMode === 'trainer' && trainerId) {
        params.trainerId = trainerId;
      }

      if (levelMode !== 'any' && levelValue) {
        const lv = parseInt(levelValue, 10);
        if (!isNaN(lv)) {
          if (levelMode === 'above') params.levelMin = lv;
          else if (levelMode === 'below') params.levelMax = lv;
          else if (levelMode === 'exact') params.levelExact = lv;
        }
      }

      const result = await monsterService.browseMonsters(params);
      setMonsters(result.monsters ?? result.data ?? []);
      setTotalPages(result.totalPages ?? 1);
      setTotalMonsters(result.totalMonsters ?? result.total ?? 0);
    } catch {
      setError('Failed to load monsters. Please try again.');
      setMonsters([]);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage, perPage, search, sortBy, sortOrder,
    speciesFilter, speciesSlots, typeFilter, typeSlots,
    attributeFilter, trainerId, ownerMode, selectedUserId, levelMode, levelValue,
    hasImage, currentUser?.discord_id,
  ]);

  useEffect(() => {
    clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(fetchMonsters, 50);
    return () => clearTimeout(fetchTimeoutRef.current);
  }, [fetchMonsters]);

  // Reset to page 1 on filter change
  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    resetPage();
  }, [resetPage]);

  const handleSortChange = useCallback((field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    resetPage();
  }, [sortBy, resetPage]);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setSpeciesFilter('');
    setSpeciesSlots('');
    setTypeFilter('');
    setTypeSlots('');
    setAttributeFilter('');
    setTrainerId(null);
    setOwnerMode(defaultOwnerMode);
    setSelectedUserId(null);
    setSelectedUserName('');
    setUserSearch('');
    setLevelMode('any');
    setLevelValue('');
    setHasImage('both');
    setSortBy('name');
    setSortOrder('asc');
    resetPage();
  }, [resetPage, defaultOwnerMode]);

  const hasActiveFilters = speciesFilter || typeFilter || attributeFilter
    || ownerMode !== defaultOwnerMode || levelMode !== 'any' || hasImage !== 'both' || search;

  const getMonsterTypes = (monster: Monster): string[] => {
    return [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
      .filter((t): t is string => !!t);
  };

  const getMonsterSpecies = (monster: Monster): string[] => {
    return [monster.species1, monster.species2, monster.species3]
      .filter((s): s is string => !!s);
  };

  return (
    <div className="all-monsters-page">
      <div className="all-monsters-page__header">
        <h1 className="all-monsters-page__title">All The Monsters</h1>
        <p className="all-monsters-page__subtitle">
          Browse and search through every monster in the game
          {totalMonsters > 0 && <span className="all-monsters-page__count"> ({totalMonsters.toLocaleString()} monsters)</span>}
        </p>
      </div>

      {/* Search & Controls Bar */}
      <div className="all-monsters-page__controls">
        <div className="all-monsters-page__search-row">
          <SearchBar
            placeholder="Search by name, species, or trainer..."
            value={search}
            onChange={handleSearchChange}
          />
          <button
            className={`button secondary all-monsters-page__filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => { setShowFilters(prev => !prev); setShowViewSettings(false); }}
          >
            <i className="fas fa-filter" />
            Filters
            {hasActiveFilters && <span className="all-monsters-page__filter-badge" />}
          </button>
          <button
            className={`button secondary all-monsters-page__filter-toggle ${showViewSettings ? 'active' : ''}`}
            onClick={() => { setShowViewSettings(prev => !prev); setShowFilters(false); }}
          >
            <i className="fas fa-sliders-h" />
            View
          </button>
        </div>

        {/* Sort Controls */}
        <div className="all-monsters-page__sort-row">
          <span className="all-monsters-page__sort-label">Sort by:</span>
          {SORT_OPTIONS.map(option => (
            <button
              key={option.value}
              className={`button ghost small all-monsters-page__sort-btn ${sortBy === option.value ? 'active' : ''}`}
              onClick={() => handleSortChange(option.value)}
            >
              {option.label}
              {sortBy === option.value && (
                <i className={`fas fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="all-monsters-page__filters">
          <div className="all-monsters-page__filters-grid">
            {/* Species Filter */}
            <div className="all-monsters-page__filter-group">
              <label className="all-monsters-page__filter-label">Species</label>
              <input
                type="text"
                className="input"
                placeholder="Filter by species..."
                value={speciesFilter}
                onChange={e => { setSpeciesFilter(e.target.value); resetPage(); }}
              />
              <select
                className="select"
                value={speciesSlots}
                onChange={e => { setSpeciesSlots(e.target.value); resetPage(); }}
              >
                {SPECIES_SLOT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="all-monsters-page__filter-group">
              <label className="all-monsters-page__filter-label">Type</label>
              <select
                className="select"
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); resetPage(); }}
              >
                <option value="">All Types</option>
                {typeOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                className="select"
                value={typeSlots}
                onChange={e => { setTypeSlots(e.target.value); resetPage(); }}
              >
                {TYPE_SLOT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Attribute Filter */}
            <div className="all-monsters-page__filter-group">
              <label className="all-monsters-page__filter-label">Attribute</label>
              <select
                className="select"
                value={attributeFilter}
                onChange={e => { setAttributeFilter(e.target.value); resetPage(); }}
              >
                <option value="">All Attributes</option>
                {attributeOptions.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Owner Filter */}
            <div className="all-monsters-page__filter-group">
              <label className="all-monsters-page__filter-label">Owner</label>
              <select
                className="select"
                value={ownerMode}
                onChange={e => {
                  const mode = e.target.value as 'all' | 'mine' | 'user' | 'trainer';
                  setOwnerMode(mode);
                  if (mode !== 'trainer') setTrainerId(null);
                  if (mode !== 'user') { setSelectedUserId(null); setSelectedUserName(''); setUserSearch(''); }
                  resetPage();
                }}
              >
                {currentUser && <option value="mine">My Monsters</option>}
                <option value="all">All Owners</option>
                <option value="user">By User</option>
                <option value="trainer">By Trainer</option>
              </select>
              {ownerMode === 'user' && (
                selectedUserId ? (
                  <div className="all-monsters-page__selected-user">
                    <i className="fas fa-user" />
                    <span>{selectedUserName}</span>
                    <button
                      className="all-monsters-page__clear-user"
                      onClick={() => { setSelectedUserId(null); setSelectedUserName(''); setUserSearch(''); resetPage(); }}
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                ) : (
                  <div className="all-monsters-page__user-search" ref={userSearchRef}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={e => { setUserSearch(e.target.value); setShowUserDropdown(true); }}
                      onFocus={() => setShowUserDropdown(true)}
                    />
                    {showUserDropdown && userResults.length > 0 && (
                      <div className="all-monsters-page__user-results">
                        {userResults.map(u => (
                          <div
                            key={u.id}
                            className="all-monsters-page__user-option"
                            onClick={() => {
                              setSelectedUserId(u.discord_id || null);
                              setSelectedUserName(u.display_name || u.username);
                              setShowUserDropdown(false);
                              setUserSearch('');
                              resetPage();
                            }}
                          >
                            {u.display_name || u.username}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
              {ownerMode === 'trainer' && (
                <TrainerAutocomplete
                  selectedTrainerId={trainerId}
                  onSelect={id => { setTrainerId(id); resetPage(); }}
                  label=""
                  placeholder="Select a trainer..."
                  noPadding
                />
              )}
            </div>

            {/* Level Filter */}
            <div className="all-monsters-page__filter-group">
              <label className="all-monsters-page__filter-label">Level</label>
              <select
                className="select"
                value={levelMode}
                onChange={e => { setLevelMode(e.target.value as 'any' | 'above' | 'below' | 'exact'); resetPage(); }}
              >
                <option value="any">Any Level</option>
                <option value="above">Above Level</option>
                <option value="below">Below Level</option>
                <option value="exact">Exact Level</option>
              </select>
              {levelMode !== 'any' && (
                <input
                  type="number"
                  className="input"
                  placeholder="Level..."
                  min={1}
                  value={levelValue}
                  onChange={e => { setLevelValue(e.target.value); resetPage(); }}
                />
              )}
            </div>

            {/* Image Filter */}
            <div className="all-monsters-page__filter-group">
              <label className="all-monsters-page__filter-label">Has Image</label>
              <select
                className="select"
                value={hasImage}
                onChange={e => { setHasImage(e.target.value as HasImage); resetPage(); }}
              >
                <option value="both">Both</option>
                <option value="yes">With Image Only</option>
                <option value="no">Without Image Only</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button className="button tertiary all-monsters-page__reset-btn" onClick={handleResetFilters}>
              <i className="fas fa-times" /> Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* View Settings Panel */}
      {showViewSettings && (
        <div className="all-monsters-page__filters">
          <div className="all-monsters-page__filters-grid">
            {/* Card Size */}
            <div className="all-monsters-page__filter-group">
              <label className="all-monsters-page__filter-label">Card Size</label>
              <div className="all-monsters-page__view-options">
                {(['small', 'medium', 'large'] as CardSize[]).map(size => (
                  <button
                    key={size}
                    className={`button ghost small ${cardSize === size ? 'active' : ''} all-monsters-page__sort-btn`}
                    onClick={() => setCardSize(size)}
                  >
                    <i className={`fas fa-${size === 'small' ? 'compress-alt' : size === 'medium' ? 'square' : 'expand-alt'}`} />
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards Per Page */}
            <div className="all-monsters-page__filter-group">
              <label className="all-monsters-page__filter-label">Cards Per Page</label>
              <select
                className="select"
                value={perPage}
                onChange={e => { setPerPage(parseInt(e.target.value, 10)); resetPage(); }}
              >
                {PER_PAGE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n} per page</option>
                ))}
              </select>
            </div>

            {/* Layout Mode */}
            <div className="all-monsters-page__filter-group">
              <label className="all-monsters-page__filter-label">Layout</label>
              <div className="all-monsters-page__view-options">
                <button
                  className={`button ghost small ${layoutMode === 'grid' ? 'active' : ''} all-monsters-page__sort-btn`}
                  onClick={() => setLayoutMode('grid')}
                >
                  <i className="fas fa-th" /> Grid
                </button>
                <button
                  className={`button ghost small ${layoutMode === 'list' ? 'active' : ''} all-monsters-page__sort-btn`}
                  onClick={() => setLayoutMode('list')}
                >
                  <i className="fas fa-list" /> List
                </button>
              </div>
            </div>

            {/* Show/Hide Sections */}
            <div className="all-monsters-page__filter-group">
              <label className="all-monsters-page__filter-label">Show on Cards</label>
              <div className="all-monsters-page__toggle-list">
                <label className="all-monsters-page__toggle-item">
                  <input type="checkbox" checked={showImage} onChange={e => setShowImage(e.target.checked)} />
                  <span>Image</span>
                </label>
                <label className="all-monsters-page__toggle-item">
                  <input type="checkbox" checked={showSpecies} onChange={e => setShowSpecies(e.target.checked)} />
                  <span>Species</span>
                </label>
                <label className="all-monsters-page__toggle-item">
                  <input type="checkbox" checked={showTypes} onChange={e => setShowTypes(e.target.checked)} />
                  <span>Types</span>
                </label>
                <label className="all-monsters-page__toggle-item">
                  <input type="checkbox" checked={showAttribute} onChange={e => setShowAttribute(e.target.checked)} />
                  <span>Attribute</span>
                </label>
                <label className="all-monsters-page__toggle-item">
                  <input type="checkbox" checked={showLevel} onChange={e => setShowLevel(e.target.checked)} />
                  <span>Level</span>
                </label>
                <label className="all-monsters-page__toggle-item">
                  <input type="checkbox" checked={showTrainer} onChange={e => setShowTrainer(e.target.checked)} />
                  <span>Trainer</span>
                </label>
                <label className="all-monsters-page__toggle-item">
                  <input type="checkbox" checked={showOwner} onChange={e => setShowOwner(e.target.checked)} />
                  <span>Owner</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {error && (
        <div className="alert error">
          <i className="fas fa-exclamation-circle" />
          <span>{error}</span>
          <button className="button secondary small" onClick={fetchMonsters}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="spinner-container">
          <div className="spinner-dots">
            <div className="spinner-dot" />
            <div className="spinner-dot" />
            <div className="spinner-dot" />
            <div className="spinner-dot" />
            <div className="spinner-dot" />
            <div className="spinner-dot" />
            <div className="spinner-dot" />
            <div className="spinner-dot" />
          </div>
          <p className="spinner-message">Loading monsters...</p>
        </div>
      ) : monsters.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-ghost" />
          <p>No monsters found matching your filters.</p>
        </div>
      ) : (
        <>
          <div
            className={`all-monsters-page__grid ${layoutMode === 'list' ? 'all-monsters-page__grid--list' : ''}`}
            style={layoutMode === 'grid' ? { gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_SIZE_MINMAX[cardSize]}, 1fr))` } : undefined}
          >
            {monsters.map(monster => (
              <div key={monster.id} className={`monster-browse-card ${layoutMode === 'list' ? 'monster-browse-card--list' : ''} monster-browse-card--${cardSize}`}>
                {showImage && (
                  <div
                    className="monster-browse-card__image-wrapper"
                    onClick={e => {
                      if (monster.img_link) {
                        e.preventDefault();
                        setPreviewImage(monster.img_link ?? null);
                        setPreviewName(monster.name || 'Monster');
                      }
                    }}
                  >
                    {monster.img_link ? (
                      <img
                        src={monster.img_link}
                        alt={monster.name || 'Monster'}
                        className="monster-browse-card__image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="monster-browse-card__no-image">
                        <i className="fas fa-image" />
                      </div>
                    )}
                  </div>
                )}

                <div className="monster-browse-card__content">
                  <Link to={`/monsters/${monster.id}`} className="monster-browse-card__name">
                    {monster.name || 'Unnamed'}
                  </Link>

                  {showSpecies && (
                    <div className="monster-browse-card__species">
                      {getMonsterSpecies(monster).map((sp, i) => (
                        <span key={i} className="monster-browse-card__species-tag">{sp}</span>
                      ))}
                    </div>
                  )}

                  {showTypes && (
                    <div className="monster-browse-card__types">
                      {getMonsterTypes(monster).map(t => (
                        <TypeBadge key={t} type={t} size="xs" />
                      ))}
                    </div>
                  )}

                  {showAttribute && monster.attribute && (
                    <div className="monster-browse-card__attribute">
                      <AttributeBadge attribute={monster.attribute} size="xs" />
                    </div>
                  )}

                  <div className="monster-browse-card__meta">
                    {showLevel && (
                      <span className="monster-browse-card__level">Lv. {monster.level ?? '?'}</span>
                    )}
                    {showTrainer && monster.trainer_name ? (
                      <span className="monster-browse-card__trainer">
                        <i className="fas fa-user" />
                        {String(monster.trainer_name)}
                      </span>
                    ) : null}
                  </div>

                  {showOwner && monster.player_username ? (
                    <div className="monster-browse-card__owner">
                      <i className="fas fa-crown" />
                      {String(monster.player_username)}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title={previewName}
        size="large"
      >
        {previewImage && (
          <div className="all-monsters-page__preview">
            <img src={previewImage} alt={previewName} className="all-monsters-page__preview-img" />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllTheMonstersPage;
