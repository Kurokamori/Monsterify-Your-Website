import { useState, useCallback } from 'react';
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete';
import factionAdminService from '@services/factionAdminService';
import type { FactionRow, FactionStandingRow } from '@services/factionAdminService';

interface StandingToolPanelProps {
  factions: FactionRow[];
  statusMsg: { type: 'success' | 'error'; text: string } | null;
  setStatusMsg: (msg: { type: 'success' | 'error'; text: string } | null) => void;
}

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function getStandingClass(standing: number): string {
  if (standing > 0) return 'faction-manager__standing--positive';
  if (standing < 0) return 'faction-manager__standing--negative';
  return 'faction-manager__standing--neutral';
}

export default function StandingToolPanel({ factions, statusMsg, setStatusMsg }: StandingToolPanelProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | null>(null);
  const [standings, setStandings] = useState<FactionStandingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [changes, setChanges] = useState<Record<number, { amount: string; reason: string }>>({});
  const [applying, setApplying] = useState<number | null>(null);

  const loadStandings = useCallback(async (trainerId: number) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const data = await factionAdminService.getTrainerStandings(trainerId);
      setStandings(data);
      // Initialize change inputs
      const initial: Record<number, { amount: string; reason: string }> = {};
      for (const s of data) {
        initial[s.faction_id] = { amount: '', reason: '' };
      }
      // Add entries for factions not yet in standings
      for (const f of factions) {
        if (!data.find(s => s.faction_id === f.id)) {
          initial[f.id] = { amount: '', reason: '' };
        }
      }
      setChanges(initial);
    } catch (err) {
      console.error('Failed to load standings:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load trainer standings' });
    } finally {
      setLoading(false);
    }
  }, [factions, setStatusMsg]);

  const handleTrainerSelect = (id: string | number | null) => {
    const numId = id ? Number(id) : null;
    setSelectedTrainerId(numId);
    if (numId) {
      loadStandings(numId);
    } else {
      setStandings([]);
      setChanges({});
    }
  };

  const handleApplyChange = async (factionId: number) => {
    if (!selectedTrainerId) return;
    const change = changes[factionId];
    const parsed = parseInt(change?.amount ?? '');
    if (!change || isNaN(parsed) || parsed === 0) {
      setStatusMsg({ type: 'error', text: 'Enter a non-zero amount' });
      return;
    }

    setApplying(factionId);
    try {
      await factionAdminService.updateTrainerStanding(selectedTrainerId, factionId, parsed, change.reason || undefined);
      setStatusMsg({ type: 'success', text: `Standing updated by ${parsed > 0 ? '+' : ''}${parsed}` });
      // Reload standings
      await loadStandings(selectedTrainerId);
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to update standing') });
    } finally {
      setApplying(null);
    }
  };

  const getStandingForFaction = (factionId: number): number => {
    const s = standings.find(s => s.faction_id === factionId);
    return s?.standing ?? 0;
  };

  const renderStatus = () => {
    if (!statusMsg) return null;
    return (
      <div className={`faction-manager__status faction-manager__status--${statusMsg.type}`}>
        <i className={statusMsg.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} />
        <span>{statusMsg.text}</span>
        <button className="faction-manager__status-dismiss" onClick={() => setStatusMsg(null)}>
          <i className="fas fa-times" />
        </button>
      </div>
    );
  };

  return (
    <div className="faction-manager__panel">
      {/* Trainer Selector */}
      <div className="faction-manager__toolbar">
        <div className="faction-manager__filters" style={{ flex: 1, maxWidth: '400px' }}>
          <TrainerAutocomplete
            onSelect={handleTrainerSelect}
            label="Trainer"
            placeholder="Search for a trainer..."
            noPadding
          />
        </div>
      </div>

      {renderStatus()}

      {!selectedTrainerId ? (
        <div className="faction-manager__empty">
          <i className="fas fa-user-shield" />
          <p>Search for a trainer above to view and modify their faction standings.</p>
        </div>
      ) : loading ? (
        <div className="faction-manager__loading">
          <i className="fas fa-spinner fa-spin" /> Loading standings...
        </div>
      ) : (
        <div className="faction-manager__table-container">
          <table className="faction-manager__table">
            <thead>
              <tr>
                <th>Faction</th>
                <th>Current Standing</th>
                <th>Change</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {factions.map(faction => {
                const standing = getStandingForFaction(faction.id);
                const change = changes[faction.id] || { amount: '', reason: '' };

                return (
                  <tr key={faction.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xsmall)' }}>
                        {faction.color && (
                          <span className="faction-manager__color-swatch" style={{ backgroundColor: faction.color, width: '16px', height: '16px' }} />
                        )}
                        {faction.name}
                      </div>
                    </td>
                    <td>
                      <span className={`faction-manager__standing ${getStandingClass(standing)}`}>
                        {standing > 0 ? `+${standing}` : standing}
                      </span>
                    </td>
                    <td>
                      <div className="faction-manager__standing-input">
                        <input
                          type="number"
                          value={change.amount}
                          onChange={e => setChanges(prev => ({
                            ...prev,
                            [faction.id]: { ...prev[faction.id]!, amount: e.target.value },
                          }))}
                          placeholder="+/-"
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={change.reason}
                        onChange={e => setChanges(prev => ({
                          ...prev,
                          [faction.id]: { ...prev[faction.id]!, reason: e.target.value },
                        }))}
                        placeholder="Reason..."
                        style={{ minWidth: '150px' }}
                      />
                    </td>
                    <td>
                      <button
                        className="button primary sm"
                        onClick={() => handleApplyChange(faction.id)}
                        disabled={applying === faction.id || !change.amount || change.amount === '-'}
                        title="Apply standing change"
                      >
                        {applying === faction.id ? (
                          <i className="fas fa-spinner fa-spin" />
                        ) : (
                          <><i className="fas fa-check" /> Apply</>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
