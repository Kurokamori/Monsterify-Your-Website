import React from 'react';
import { Link } from 'react-router-dom';

const GuideCategoryTabs = ({ categories, activeCategory }) => {
  return (
    <div className="guide-category-tabs">
      {Object.keys(categories).map(key => (
        <Link
          key={key}
          to={`/guides/${key}`}
          className={`guide-category-tab ${activeCategory === key ? 'active' : ''}`}
        >
          {categories[key].name}
        </Link>
      ))}
    </div>
  );
};

export default GuideCategoryTabs;
