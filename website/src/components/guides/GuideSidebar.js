import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useGuideSidebar from '../../hooks/useGuideSidebar';

const GuideSidebar = ({ structure, category }) => {
  const location = useLocation();
  const currentPath = location.pathname.replace(`/guides/${category}/`, '');
  const { expandedDirs, toggleDirectory, isExpanded } = useGuideSidebar(category, currentPath);

  // Check if a path is active
  const isActive = (path) => {
    const currentPath = location.pathname;
    const fullPath = `/guides/${category}/${path}`;
    return currentPath === fullPath || currentPath === fullPath.replace(/\.md$/, '');
  };

  // Check if a directory contains the active path
  const containsActivePath = (dirPath) => {
    const currentPath = location.pathname.replace(`/guides/${category}/`, '');
    return currentPath.startsWith(dirPath + '/');
  };

  // Recursively render directories and files
  const renderStructure = (structure, basePath = '') => {
    if (!structure) return null;

    return (
      <>
        {structure.directories && structure.directories.map((dir) => {
          const dirPath = basePath ? `${basePath}/${dir.path}` : dir.path;
          const dirExpanded = isExpanded(dirPath) || containsActivePath(dirPath);
          
          return (
            <div className="guide-sidebar-item" key={dirPath}>
              <div 
                className={`guide-sidebar-dir${dirExpanded ? 'expanded' : ''}`}
                onClick={() => toggleDirectory(dirPath)}
              >
                <span className="guide-sidebar-icon">
                  {dirExpanded ? '▼' : '▶'}
                </span>
                <span className="guide-sidebar-name">{dir.name || 'Unnamed Directory'}</span>
              </div>
              
              {dirExpanded && dir.children && (
                <div className="guide-sidebar-children">
                  {renderStructure(dir.children, dirPath)}
                </div>
              )}
            </div>
          );
        })}
        
        {structure.files && structure.files.map((file) => {
          const filePath = basePath ? `${basePath}/${file.path}` : file.path;
          
          return (
            <div 
              className={`guide-sidebar-item guide-sidebar-file${isActive(filePath) ? 'active' : ''}`} 
              key={filePath}
            >
              <Link to={`/guides/${category}/${filePath}`}>
                {file.name || 'Unnamed Guide'}
              </Link>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="guide-sidebar">
      <div className="guide-sidebar-header">
        <Link to={`/guides/${category}`} className="guide-sidebar-overview">
          Overview
        </Link>
      </div>
      <div className="guide-sidebar-content">
        {structure ? renderStructure(structure) : (
          <div className="guide-sidebar-empty">No content available</div>
        )}
      </div>
    </div>
  );
};

export default GuideSidebar;
