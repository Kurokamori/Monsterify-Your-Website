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

type GuideItem =
  | ({ type: 'directory' } & GuideDirectory)
  | ({ type: 'file' } & GuideFile);

interface GuideStructure {
  directories?: GuideDirectory[];
  files?: GuideFile[];
  items?: GuideItem[];
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

  const renderDir = (dir: GuideDirectory, basePath: string) => {
    const dirPath = basePath ? `${basePath}/${dir.path}` : dir.path;
    const dirExpanded = isExpanded(dirPath) || containsActivePath(dirPath);

    return (
      <div className="guide-sidebar__item" key={`dir-${dirPath}`}>
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
  };

  const renderFile = (file: GuideFile, basePath: string) => {
    const filePath = basePath ? `${basePath}/${file.path}` : file.path;

    return (
      <div
        className={`guide-sidebar__item guide-sidebar__file ${isActive(filePath) ? 'guide-sidebar__file--active' : ''}`}
        key={`file-${filePath}`}
      >
        <Link to={`/guides/${category}/${filePath}`}>
          {file.name || 'Unnamed Guide'}
        </Link>
      </div>
    );
  };

  const renderStructure = (struct: GuideStructure, basePath = ''): JSX.Element => {
    // Use items array for correct interleaved ordering when available
    if (struct.items?.length) {
      return (
        <>
          {struct.items.map((item) =>
            item.type === 'directory'
              ? renderDir(item, basePath)
              : renderFile(item, basePath)
          )}
        </>
      );
    }

    // Fallback: directories first, then files
    return (
      <>
        {struct.directories?.map((dir) => renderDir(dir, basePath))}
        {struct.files?.map((file) => renderFile(file, basePath))}
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
