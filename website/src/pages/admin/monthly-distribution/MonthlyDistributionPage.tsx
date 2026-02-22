import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import monthlyDistributionService, {
  type MonthlyItem,
  type CronJobStatus,
  type DistributionResult,
  type DistributionRun,
  type CronJobEntry,
} from '@services/monthlyDistributionService';
import '@styles/admin/monthly-distribution.css';

const CATEGORY_OPTIONS = ['items', 'keyitems', 'berries', 'pastries'];

function MonthlyDistributionContent() {
  useDocumentTitle('Monthly Distribution Manager');

  const [items, setItems] = useState<MonthlyItem[]>([]);
  const [editItems, setEditItems] = useState<MonthlyItem[] | null>(null);
  const [cronStatus, setCronStatus] = useState<CronJobStatus>({});
  const [runs, setRuns] = useState<DistributionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showTriggerConfirm, setShowTriggerConfirm] = useState(false);
  const [lastResult, setLastResult] = useState<DistributionResult | null>(null);

  const isEditing = editItems !== null;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsData, statusData, runsData] = await Promise.all([
        monthlyDistributionService.getMonthlyItems(),
        monthlyDistributionService.getCronStatus(),
        monthlyDistributionService.getDistributionRuns(),
      ]);
      setItems(itemsData);
      setCronStatus(statusData);
      setRuns(runsData);
    } catch (err) {
      console.error('Error fetching distribution data:', err);
      setError('Failed to load distribution data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartEdit = useCallback(() => {
    setEditItems(items.map(i => ({ ...i })));
    setSaveMessage(null);
  }, [items]);

  const handleCancelEdit = useCallback(() => {
    setEditItems(null);
    setSaveMessage(null);
  }, []);

  const handleEditField = useCallback((index: number, field: keyof MonthlyItem, value: string | number) => {
    setEditItems(prev => {
      if (!prev) { return prev; }
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleAddItem = useCallback(() => {
    setEditItems(prev => prev ? [...prev, { name: '', category: 'items', quantity: 1 }] : prev);
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setEditItems(prev => prev ? prev.filter((_, i) => i !== index) : prev);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editItems) { return; }
    const invalid = editItems.some(i => !i.name.trim() || i.quantity < 1);
    if (invalid) {
      setSaveMessage('All items must have a name and quantity of at least 1.');
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      const updated = await monthlyDistributionService.updateMonthlyItems(editItems);
      setItems(updated);
      setEditItems(null);
      setSaveMessage('Items saved successfully.');
    } catch (err) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to save')
        : err instanceof Error ? err.message : 'Failed to save';
      setSaveMessage(message);
    } finally {
      setSaving(false);
    }
  }, [editItems]);

  const handleTriggerDistribution = useCallback(async () => {
    try {
      const result = await monthlyDistributionService.triggerDistribution();
      setLastResult(result);
      setShowTriggerConfirm(false);
      // Refresh status and runs
      const [statusData, runsData] = await Promise.all([
        monthlyDistributionService.getCronStatus(),
        monthlyDistributionService.getDistributionRuns(),
      ]);
      setCronStatus(statusData);
      setRuns(runsData);
    } catch (err) {
      const message = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Distribution failed')
        : err instanceof Error ? err.message : 'Distribution failed';
      setLastResult({ success: false, message, error: message });
      throw err;
    }
  }, []);

  if (loading) { return <LoadingSpinner />; }
  if (error) { return <ErrorMessage message={error} onRetry={fetchData} />; }

  const displayItems = editItems ?? items;

  return (
    <div className="monthly-distribution">
      <div className="monthly-distribution__header">
        <h1><i className="fas fa-calendar-check"></i> Monthly Distribution Manager</h1>
        <p>View and manage the monthly item distribution to all trainers</p>
      </div>

      {/* Monthly Items */}
      <div className="monthly-distribution__section">
        <div className="monthly-distribution__section-header">
          <h2><i className="fas fa-gift"></i> Items Distributed Each Month</h2>
          <div className="monthly-distribution__section-actions">
            {!isEditing ? (
              <button className="button primary sm" onClick={handleStartEdit}>
                <i className="fas fa-edit"></i> Edit
              </button>
            ) : (
              <>
                <button className="button success sm" onClick={handleSave} disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save</>}
                </button>
                <button className="button secondary sm" onClick={handleCancelEdit} disabled={saving}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {saveMessage && (
          <div className={`monthly-distribution__save-message ${editItems === null ? 'monthly-distribution__save-message--success' : 'monthly-distribution__save-message--error'}`}>
            {saveMessage}
          </div>
        )}

        {isEditing ? (
          <div className="monthly-distribution__edit-list">
            {displayItems.map((item, index) => (
              <div key={index} className="monthly-distribution__edit-row">
                <input
                  type="text"
                  className="input"
                  placeholder="Item name"
                  value={item.name}
                  onChange={e => handleEditField(index, 'name', e.target.value)}
                />
                <select
                  className="input"
                  value={item.category}
                  onChange={e => handleEditField(index, 'category', e.target.value)}
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="input monthly-distribution__qty-input"
                  min={1}
                  value={item.quantity}
                  onChange={e => handleEditField(index, 'quantity', parseInt(e.target.value) || 1)}
                />
                <button className="button danger sm" onClick={() => handleRemoveItem(index)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
            <button className="button secondary sm" onClick={handleAddItem}>
              <i className="fas fa-plus"></i> Add Item
            </button>
          </div>
        ) : (
          <div className="monthly-distribution__items-grid">
            {displayItems.map((item) => (
              <div key={item.name} className="monthly-distribution__item-card">
                <span className="monthly-distribution__item-name">{item.name}</span>
                <div className="monthly-distribution__item-meta">
                  <span>Qty: {item.quantity}</span>
                  <span>Category: {item.category}</span>
                </div>
              </div>
            ))}
            {displayItems.length === 0 && <p>No monthly items configured.</p>}
          </div>
        )}
      </div>

      {/* Distribution Run History */}
      <div className="monthly-distribution__section">
        <h2><i className="fas fa-history"></i> Distribution Run History</h2>
        {runs.length === 0 ? (
          <p className="monthly-distribution__empty">No distribution runs recorded yet.</p>
        ) : (
          <div className="monthly-distribution__runs-table-wrap">
            <table className="monthly-distribution__runs-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Trigger</th>
                  <th>Status</th>
                  <th>Trainers</th>
                  <th>Succeeded</th>
                  <th>Failed</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(run => (
                  <tr key={run.id}>
                    <td>{new Date(run.ranAt).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${run.triggerType === 'automatic' ? 'neutral' : 'warning'} sm`}>
                        {run.triggerType}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${run.success ? 'success' : 'error'} sm`}>
                        {run.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td>{run.totalTrainers}</td>
                    <td>{run.successCount}</td>
                    <td>{run.failCount}</td>
                    <td className="monthly-distribution__error-cell">{run.errorMessage ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cron Job Status */}
      <div className="monthly-distribution__section">
        <h2><i className="fas fa-clock"></i> Cron Job Status</h2>
        <div className="monthly-distribution__cron-grid">
          {Object.entries(cronStatus).map(([name, status]: [string, CronJobEntry]) => (
            <div key={name} className="monthly-distribution__cron-card">
              <h3>
                <span
                  className={`monthly-distribution__status-dot monthly-distribution__status-dot--${status.running ? 'active' : 'inactive'}`}
                />
                {name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}
              </h3>
              <div className="monthly-distribution__cron-detail">
                Status: {status.running ? 'Active' : 'Stopped'}
              </div>
              <div className="monthly-distribution__cron-detail">
                Scheduled: {status.scheduled ? 'Yes' : 'No'}
              </div>
            </div>
          ))}
          {Object.keys(cronStatus).length === 0 && <p>No cron jobs found.</p>}
        </div>
      </div>

      {/* Manual Trigger */}
      <div className="monthly-distribution__section">
        <h2><i className="fas fa-play-circle"></i> Manual Distribution</h2>
        <div className="monthly-distribution__trigger-section">
          <p className="monthly-distribution__trigger-info">
            Manually trigger the monthly item distribution. This will add all monthly items
            to every trainer's inventory immediately, regardless of the current date.
          </p>
          <div>
            <button
              className="button warning"
              onClick={() => setShowTriggerConfirm(true)}
            >
              <i className="fas fa-bolt"></i> Trigger Distribution Now
            </button>
          </div>

          {lastResult && (
            <div className={`monthly-distribution__result monthly-distribution__result--${lastResult.success ? 'success' : 'error'}`}>
              <h3>{lastResult.success ? 'Distribution Completed' : 'Distribution Failed'}</h3>
              <p>{lastResult.message}</p>
              {lastResult.results && (
                <div className="monthly-distribution__result-stats">
                  <span>Total trainers: {lastResult.results.totalTrainers}</span>
                  <span>Succeeded: {lastResult.results.successCount}</span>
                  <span>Failed: {lastResult.results.failCount}</span>
                </div>
              )}
              {lastResult.error && <p>{lastResult.error}</p>}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showTriggerConfirm}
        onClose={() => setShowTriggerConfirm(false)}
        onConfirm={handleTriggerDistribution}
        title="Trigger Monthly Distribution"
        message="Are you sure you want to distribute monthly items to all trainers now?"
        warning="This will add items to every trainer's inventory immediately."
        confirmText="Distribute"
        variant="warning"
        confirmIcon="fas fa-bolt"
      />
    </div>
  );
}

export default function MonthlyDistributionPage() {
  return (
    <AdminRoute>
      <MonthlyDistributionContent />
    </AdminRoute>
  );
}
