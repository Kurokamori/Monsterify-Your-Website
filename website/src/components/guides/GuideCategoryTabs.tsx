import { Link } from 'react-router-dom';

interface Category {
  name: string;
  [key: string]: unknown;
}

interface GuideCategoryTabsProps {
  categories: Record<string, Category>;
  activeCategory: string;
}

export const GuideCategoryTabs = ({ categories, activeCategory }: GuideCategoryTabsProps) => {
  return (
    <div className="guide-category-tabs">
      {Object.keys(categories).map(key => (
        <Link
          key={key}
          to={`/guides/${key}`}
          className={`guide-category-tab ${activeCategory === key ? 'guide-category-tab--active' : ''}`}
        >
          {categories[key].name}
        </Link>
      ))}
    </div>
  );
};
