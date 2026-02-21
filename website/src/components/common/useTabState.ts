import { useState } from 'react';

/**
 * Controlled tabs hook for external state management
 */
export const useTabState = (defaultTab: string) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return {
    activeTab,
    setActiveTab,
    tabProps: {
      activeTab,
      onTabChange: setActiveTab
    }
  };
};

