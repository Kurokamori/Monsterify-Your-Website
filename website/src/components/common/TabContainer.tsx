import { ReactNode, useState, useCallback, useEffect, useId } from 'react';

export interface Tab {
  /** Unique key for the tab */
  key: string;
  /** Display label */
  label: ReactNode;
  /** Optional icon class */
  icon?: string;
  /** Tab content */
  content: ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Badge count to show on tab */
  badge?: number;
}

type TabVariant = 'default' | 'pills' | 'underline';
type TabAlign = 'start' | 'center' | 'end' | 'stretch';

interface TabContainerProps {
  /** Array of tab definitions */
  tabs: Tab[];
  /** Default active tab key */
  defaultTab?: string;
  /** Controlled active tab */
  activeTab?: string;
  /** Callback when tab changes */
  onTabChange?: (tabKey: string) => void;
  /** Tab bar variant */
  variant?: TabVariant;
  /** Tab alignment */
  align?: TabAlign;
  /** Full width tabs */
  fullWidth?: boolean;
  /** Render content lazily (only when tab is active) */
  lazy?: boolean;
  /** Keep inactive tab content mounted */
  keepMounted?: boolean;
  /** Additional className for container */
  className?: string;
  /** Additional className for tab bar */
  tabBarClassName?: string;
  /** Additional className for content */
  contentClassName?: string;
}

/**
 * TabContainer - Tabbed content container with multiple variants
 */
export const TabContainer = ({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  variant = 'default',
  align = 'start',
  fullWidth = false,
  lazy = false,
  keepMounted = false,
  className = '',
  tabBarClassName = '',
  contentClassName = ''
}: TabContainerProps) => {
  const id = useId();
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultTab || tabs[0]?.key || ''
  );

  // Use controlled or internal state
  const activeTabKey = controlledActiveTab ?? internalActiveTab;

  // Track which tabs have been visited (for lazy + keepMounted)
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    new Set([activeTabKey])
  );

  // Sync visitedTabs when controlled activeTab changes programmatically
  useEffect(() => {
    if (controlledActiveTab) {
      setVisitedTabs(prev => {
        if (prev.has(controlledActiveTab)) return prev;
        return new Set([...prev, controlledActiveTab]);
      });
    }
  }, [controlledActiveTab]);

  const handleTabClick = useCallback((tabKey: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabKey);
    }
    setVisitedTabs(prev => new Set([...prev, tabKey]));
    onTabChange?.(tabKey);
  }, [controlledActiveTab, onTabChange]);

  const containerClasses = [
    'tab-container',
    className
  ].filter(Boolean).join(' ');

  const tabBarClasses = [
    'tab-container__bar',
    `tab-container__bar--${variant}`,
    `tab-container__bar--${align}`,
    fullWidth && 'tab-container__bar--full-width',
    tabBarClassName
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'tab-container__content',
    contentClassName
  ].filter(Boolean).join(' ');

  const renderTabContent = (tab: Tab) => {
    const isActive = tab.key === activeTabKey;
    const hasBeenVisited = visitedTabs.has(tab.key);

    // Lazy loading logic
    if (lazy && !hasBeenVisited) {
      return null;
    }

    // Keep mounted logic
    if (!isActive && !keepMounted) {
      return null;
    }

    return (
      <div
        key={tab.key}
        id={`${id}-panel-${tab.key}`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${tab.key}`}
        className={`tab-container__panel ${isActive ? 'tab-container__panel--active' : ''}`}
        hidden={!isActive}
      >
        {tab.content}
      </div>
    );
  };

  return (
    <div className={containerClasses}>
      {/* Tab Bar */}
      <div className={tabBarClasses} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTabKey;
          const tabClasses = [
            'tab-container__tab',
            isActive && 'tab-container__tab--active',
            tab.disabled && 'tab-container__tab--disabled'
          ].filter(Boolean).join(' ');

          return (
            <button
              key={tab.key}
              id={`${id}-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${id}-panel-${tab.key}`}
              className={tabClasses}
              onClick={() => !tab.disabled && handleTabClick(tab.key)}
              disabled={tab.disabled}
            >
              {tab.icon && <i className={tab.icon}></i>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="tab-container__badge">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={contentClasses}>
        {tabs.map(renderTabContent)}
      </div>
    </div>
  );
};

// Re-export hook for convenience
// eslint-disable-next-line react-refresh/only-export-components
export { useTabState } from './useTabState';
