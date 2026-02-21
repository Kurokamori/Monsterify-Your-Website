import { Link, useLocation } from 'react-router-dom';
import { useGuideSidebar } from '../../hooks/useGuideSidebar';

interface GuideFile {
  path: string;
  name: string;
}

interface GuideDirectory {
  path: string;
  name: string;
  children?: GuideStructure;
}

interface GuideStructure {
  directories?: GuideDirectory[];
  files?: GuideFile[];
}

interface GuideSidebarProps {
  structure: GuideStructure | null;
  category: string;
}

export const GuideSidebar = ({ structure, category }: GuideSidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname.replace(`/guides/${category}/`, '');
  const { toggleDirectory, isExpanded } = useGuideSidebar(category, currentPath);

  const isActive = (path: string): boolean => {
    const currentPathname = location.pathname;
    const fullPath = `/guides/${category}/${path}`;
    return currentPathname === fullPath || currentPathname === fullPath.replace(/\.md$/, '');
  };

  const containsActivePath = (dirPath: string): boolean => {
    const activePath = location.pathname.replace(`/guides/${category}/`, '');
    return activePath.startsWith(dirPath + '/');
  };

  const renderStructure = (struct: GuideStructure, basePath = ''): JSX.Element => {
    return (
      <>
        {struct.directories?.map((dir) => {
          const dirPath = basePath ? `${basePath}/${dir.path}` : dir.path;
          const dirExpanded = isExpanded(dirPath) || containsActivePath(dirPath);

          return (
            <div className="guide-sidebar__item" key={dirPath}>
              <div
                className={`guide-sidebar__dir ${dirExpanded ? 'guide-sidebar__dir--expanded' : ''}`}
                onClick={() => toggleDirectory(dirPath)}
              >
                <span className="guide-sidebar__icon">
                  {dirExpanded ? '\u25BC' : '\u25B6'}
                </span>
                <span className="guide-sidebar__name">{dir.name || 'Unnamed Directory'}</span>
              </div>

              {dirExpanded && dir.children && (
                <div className="guide-sidebar__children">
                  {renderStructure(dir.children, dirPath)}
                </div>
              )}
            </div>
          );
        })}

        {struct.files?.map((file) => {
          const filePath = basePath ? `${basePath}/${file.path}` : file.path;

          return (
            <div
              className={`guide-sidebar__item guide-sidebar__file ${isActive(filePath) ? 'guide-sidebar__file--active' : ''}`}
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
      <div className="guide-sidebar__header">
        <Link to={`/guides/${category}`} className="guide-sidebar__overview">
          Overview
        </Link>
      </div>
      <div className="guide-sidebar__content">
        {structure ? renderStructure(structure) : (
          <div className="guide-sidebar__empty">No content available</div>
        )}
      </div>
    </div>
  );
};
