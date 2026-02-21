import { useState, useEffect } from 'react';

interface ExpandedDirs {
  [key: string]: boolean;
}

interface GuideSidebarState {
  [category: string]: ExpandedDirs;
}

interface UseGuideSidebarResult {
  expandedDirs: ExpandedDirs;
  toggleDirectory: (dirPath: string) => void;
  isExpanded: (dirPath: string) => boolean;
}

// Global state management for guide sidebar expanded directories
const guideSidebarState: GuideSidebarState = {};

export const useGuideSidebar = (category: string, currentPath?: string): UseGuideSidebarResult => {
  const [expandedDirs, setExpandedDirs] = useState<ExpandedDirs>(() => {
    // Initialize from localStorage if not already loaded
    if (!guideSidebarState[category]) {
      const saved = localStorage.getItem(`guideSidebar_${category}_expanded`);
      try {
        guideSidebarState[category] = saved ? JSON.parse(saved) : {};
      } catch {
        guideSidebarState[category] = {};
      }
    }
    return { ...guideSidebarState[category] };
  });

  // Auto-expand directories containing the current active file
  useEffect(() => {
    if (!currentPath) return;

    // Ensure the category state exists
    if (!guideSidebarState[category]) {
      guideSidebarState[category] = {};
    }

    const pathSegments = currentPath.split('/');
    const newExpanded = { ...guideSidebarState[category] };
    let changed = false;

    // Build path hierarchy to auto-expand parent directories
    let buildPath = '';
    pathSegments.slice(0, -1).forEach(segment => { // Skip the file name
      buildPath = buildPath ? `${buildPath}/${segment}` : segment;
      if (!newExpanded[buildPath]) {
        newExpanded[buildPath] = true;
        changed = true;
      }
    });

    if (changed) {
      guideSidebarState[category] = newExpanded;
      setExpandedDirs({ ...newExpanded });
      localStorage.setItem(`guideSidebar_${category}_expanded`, JSON.stringify(newExpanded));
    }
  }, [category, currentPath]);

  const toggleDirectory = (dirPath: string): void => {
    if (!guideSidebarState[category]) {
      guideSidebarState[category] = {};
    }

    const newExpanded = {
      ...guideSidebarState[category],
      [dirPath]: !guideSidebarState[category][dirPath]
    };

    guideSidebarState[category] = newExpanded;
    setExpandedDirs({ ...newExpanded });
    localStorage.setItem(`guideSidebar_${category}_expanded`, JSON.stringify(newExpanded));
  };

  const isExpanded = (dirPath: string): boolean => {
    return guideSidebarState[category] ? guideSidebarState[category][dirPath] || false : false;
  };

  return { expandedDirs, toggleDirectory, isExpanded };
};
