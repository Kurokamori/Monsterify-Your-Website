import { ReactNode } from 'react';

interface EntityDetailPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  children: ReactNode;
}

export function EntityDetailPanel({
  open,
  title,
  onClose,
  onSave,
  saving,
  children,
}: EntityDetailPanelProps) {
  if (!open) return null;

  return (
    <div className="detail-panel-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-panel__header">
          <h3>{title}</h3>
          <button type="button" className="button icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="detail-panel__body">
          {children}
        </div>
        <div className="detail-panel__footer">
          <button type="button" className="button" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="button primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
