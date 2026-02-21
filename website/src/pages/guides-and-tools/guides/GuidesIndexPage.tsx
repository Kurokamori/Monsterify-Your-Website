import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { AutoStateContainer } from '../../../components/common/StateContainer';
import guidesService from '../../../services/guidesService';
import type { CategoriesMap } from './types';
import { getCategoryIcon, getCategoryDescription, getCategoryLink } from './types';

const TOOL_LINKS = [
  {
    to: '/guides/type-calculator',
    icon: 'fas fa-calculator',
    title: 'Type Calculator',
    description: 'Calculate type effectiveness and damage multipliers.',
  },
  {
    to: '/guides/evolution-explorer',
    icon: 'fas fa-dna',
    title: 'Evolution Explorer',
    description: 'Explore evolution chains and requirements.',
  },
  {
    to: '/guides/ability-database',
    icon: 'fas fa-bolt',
    title: 'Ability Database',
    description: 'Browse and search all available abilities.',
  },
  {
    to: '/guides/species-database',
    icon: 'fas fa-database',
    title: 'Species Database',
    description: 'Explore species across different monster franchises.',
  },
];

const GuidesIndexPage = () => {
  useDocumentTitle('Guides');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoriesMap>({});

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await guidesService.getCategories();
      const catData = (response as unknown as { data?: CategoriesMap }).data ?? response as unknown as CategoriesMap;
      setCategories(catData);
    } catch {
      setError('Failed to load guide categories. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const isEmpty = Object.keys(categories).length === 0;

  return (
    <div className="guide-page">
      <AutoStateContainer
        loading={loading}
        error={error}
        isEmpty={isEmpty}
        onRetry={fetchCategories}
        loadingMessage="Loading guide categories..."
        emptyMessage="No guide categories available yet."
        emptyIcon="fas fa-book-open"
      >
        <div className="guide-page__header">
          <h1>Guides &amp; Documentation</h1>
          <p>Learn everything you need to know about the game</p>
        </div>

        <div className="guide-index__grid">
          {Object.keys(categories).map((key) => (
            <Link to={getCategoryLink(key)} className="guide-index__card" key={key}>
              <div className="guide-index__card-icon">
                <i className={getCategoryIcon(key)} />
              </div>
              <h2>{categories[key].name}</h2>
              <p>{getCategoryDescription(key)}</p>
            </Link>
          ))}
          <Link to="/under-construction" className="guide-index__card">
            <div className="guide-index__card-icon">
              <i className="fas fa-map-marked-alt" />
            </div>
            <h2>Map</h2>
            <p>Navigate through the world with our interactive map system.</p>
          </Link>
        </div>

        <div className="guide-index__section">
          <h2>Tools</h2>
          <div className="guide-index__grid">
            {TOOL_LINKS.map((tool) => (
              <Link to={tool.to} className="guide-index__card" key={tool.to}>
                <div className="guide-index__card-icon">
                  <i className={tool.icon} />
                </div>
                <h2>{tool.title}</h2>
                <p>{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </AutoStateContainer>
    </div>
  );
};

export default GuidesIndexPage;
