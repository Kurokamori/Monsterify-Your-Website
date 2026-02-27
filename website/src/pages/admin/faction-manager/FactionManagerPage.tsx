import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { TabContainer } from '@components/common/TabContainer';
import factionAdminService from '@services/factionAdminService';
import type { FactionRow } from '@services/factionAdminService';
import PerFactionPanel from './PerFactionPanel';
import PerPropertyPanel from './PerPropertyPanel';
import StandingToolPanel from './StandingToolPanel';
import '@styles/admin/faction-manager.css';

export default function FactionManagerPage() {
  useDocumentTitle('Faction Manager');

  const [activeTab, setActiveTab] = useState('per-faction');
  const [factions, setFactions] = useState<FactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadFactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await factionAdminService.getAllFactions();
      setFactions(data);
    } catch (err) {
      console.error('Failed to load factions:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load factions' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFactions();
  }, [loadFactions]);

  const handleFactionUpdated = () => {
    loadFactions();
  };

  if (loading) {
    return (
      <div className="main-container">
        <h1><i className="fas fa-shield-alt" /> Faction Manager</h1>
        <div className="faction-manager__loading">
          <i className="fas fa-spinner fa-spin" /> Loading factions...
        </div>
      </div>
    );
  }

  const tabs = [
    {
      key: 'per-faction',
      label: 'Per Faction',
      icon: 'fas fa-shield-alt',
      badge: factions.length,
      content: (
        <PerFactionPanel
          factions={factions}
          onFactionUpdated={handleFactionUpdated}
          statusMsg={activeTab === 'per-faction' ? statusMsg : null}
          setStatusMsg={setStatusMsg}
        />
      ),
    },
    {
      key: 'per-property',
      label: 'Per Property',
      icon: 'fas fa-th-list',
      content: (
        <PerPropertyPanel
          factions={factions}
          onFactionUpdated={handleFactionUpdated}
          statusMsg={activeTab === 'per-property' ? statusMsg : null}
          setStatusMsg={setStatusMsg}
        />
      ),
    },
    {
      key: 'standing-tool',
      label: 'Standing Tool',
      icon: 'fas fa-user-shield',
      content: (
        <StandingToolPanel
          factions={factions}
          statusMsg={activeTab === 'standing-tool' ? statusMsg : null}
          setStatusMsg={setStatusMsg}
        />
      ),
    },
  ];

  return (
    <div className="main-container">
      <h1><i className="fas fa-shield-alt" /> Faction Manager</h1>
      <TabContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={tab => { setActiveTab(tab); setStatusMsg(null); }}
        variant="underline"
      />
    </div>
  );
}
