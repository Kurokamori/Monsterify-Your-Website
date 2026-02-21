import { useState, useEffect, useCallback, type FormEvent, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import fakemonService, { type Fakemon, type FakemonListParams } from '../../services/fakemonService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Pagination } from '../../components/common/Pagination';
import { TypeBadge } from '../../components/common/TypeBadge';
import { BadgeGroup } from '../../components/common/BadgeGroup';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { MONSTER_TYPES, MONSTER_ATTRIBUTES, SPECIES_CATEGORIES } from '../../utils/staticValues';

const ITEMS_PER_PAGE = 36;

/** Extract types array from a fakemon's type1-type5 fields */
function getTypes(mon: Fakemon): string[] {
  return [mon.type1, mon.type2, mon.type3, mon.type4, mon.type5].filter(
    (t): t is string => !!t
  );
}

/** Format a number as 3-digit dex number */
function formatDexNumber(num: number): string {
  return String(num).padStart(3, '0');
}

/** Get display image for a fakemon */
function getImageSrc(mon: Fakemon): string {
  return mon.image_url || mon.image_path || '/images/default_mon.png';
}

export default function FakemonDexPage() {
  useDocumentTitle('Fakedex');

  const [fakemon, setFakemon] = useState<Fakemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showAttributeFilter, setShowAttributeFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const fetchFakemon = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: FakemonListParams = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        type: selectedType || undefined,
        category: selectedCategory || undefined,
        attribute: selectedAttribute || undefined,
        search: searchTerm || undefined,
      };

      const response = await fakemonService.getAllFakemon(params);
      setFakemon(response.fakemon || []);
      setTotalPages(response.totalPages || 1);
    } catch {
      setError('Failed to load fakemon. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedType, selectedCategory, selectedAttribute, searchTerm]);

  useEffect(() => {
    fetchFakemon();
  }, [fetchFakemon]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleFilterChange = (
    setter: (val: string) => void,
    value: string,
  ) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleImageError = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    img.onerror = null;
    img.src = '/images/default_mon.png';
  };

  return (
    <div className="fakedex-container">
      <div className="fakedex-header">
        <h1>Fakemon Dex</h1>
        <p>Discover all the unique fakemon in the world</p>
      </div>

      {/* Controls */}
      <div className="fakedex-controls">
        <div className="search-and-toggles">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="input-wrapper has-icon">
              <span className="input-icon">
                <i className="fa-solid fa-search" />
              </span>
              <input
                type="text"
                className="input"
                placeholder="Search fakemon..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </form>

          <div className="filter-toggle-group">
            <button
              className={`button toggle${showCategoryFilter ? ' active' : ''}`}
              onClick={() => setShowCategoryFilter(v => !v)}
            >
              <i className="fa-solid fa-layer-group" />
              Category
              {selectedCategory && <span className="filter-count">1</span>}
            </button>
            <button
              className={`button toggle${showAttributeFilter ? ' active' : ''}`}
              onClick={() => setShowAttributeFilter(v => !v)}
            >
              <i className="fa-solid fa-tags" />
              Attribute
              {selectedAttribute && <span className="filter-count">1</span>}
            </button>
            <button
              className={`button toggle${showTypeFilter ? ' active' : ''}`}
              onClick={() => setShowTypeFilter(v => !v)}
            >
              <i className="fa-solid fa-fire" />
              Type
              {selectedType && <span className="filter-count">1</span>}
            </button>
          </div>
        </div>

        {/* Expandable filter sections */}
        {showCategoryFilter && (
          <div className="filter-section">
            <div className="filter-chips">
              <button
                className={`button filter${selectedCategory === '' ? ' active' : ''}`}
                onClick={() => handleFilterChange(setSelectedCategory, '')}
              >
                All Categories
              </button>
              {SPECIES_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`button filter${selectedCategory === cat ? ' active' : ''}`}
                  onClick={() => handleFilterChange(setSelectedCategory, cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {showAttributeFilter && (
          <div className="filter-section">
            <div className="filter-chips">
              <button
                className={`button filter${selectedAttribute === '' ? ' active' : ''}`}
                onClick={() => handleFilterChange(setSelectedAttribute, '')}
              >
                All Attributes
              </button>
              {MONSTER_ATTRIBUTES.map(attr => (
                <button
                  key={attr}
                  className={`button filter${selectedAttribute === attr ? ' active' : ''}`}
                  onClick={() => handleFilterChange(setSelectedAttribute, attr)}
                >
                  {attr}
                </button>
              ))}
            </div>
          </div>
        )}

        {showTypeFilter && (
          <div className="filter-section">
            <div className="filter-chips">
              <button
                className={`button filter${selectedType === '' ? ' active' : ''}`}
                onClick={() => handleFilterChange(setSelectedType, '')}
              >
                All Types
              </button>
              {MONSTER_TYPES.map(type => (
                <button
                  key={type}
                  className={`button filter type-${type.toLowerCase()}${selectedType === type ? ' active' : ''}`}
                  onClick={() => handleFilterChange(setSelectedType, type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message="Loading fakemon..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchFakemon} />
      ) : fakemon.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-paw" />
          <h3>No fakemon available</h3>
          <p>Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <>
          <div className="fakedex-grid">
            {fakemon.map(mon => {
              const types = getTypes(mon);
              const num = typeof mon.number === 'string' ? parseInt(mon.number, 10) : mon.number;
              return (
                <Link
                  to={`/fakedex/${num}`}
                  className="fakemon-card"
                  key={num}
                >
                  <div className="fakemon-card-image">
                    <img
                      src={getImageSrc(mon)}
                      alt={mon.name}
                      className="fakemon-image"
                      onError={handleImageError}
                    />
                  </div>
                  <div className="fakemon-card-body">
                    <span className="dex-number">#{formatDexNumber(num)}</span>
                    <h3 className="dex-name">{mon.name}</h3>
                    <BadgeGroup gap="xs">
                      {types.length > 0
                        ? types.map(type => (
                            <TypeBadge key={type} type={type} size="xs" />
                          ))
                        : <TypeBadge type="Normal" size="xs" />
                      }
                    </BadgeGroup>
                    {mon.category && (
                      <span className="fakemon-card-category">{mon.category}</span>
                    )}
                    {mon.classification && (
                      <span className="fakemon-card-classification">{mon.classification}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
