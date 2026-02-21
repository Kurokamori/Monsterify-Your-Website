import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { PlayerMissionManager } from '@components/admin/PlayerMissionManager';
import '@styles/admin/player-mission-manager.css';

function PlayerMissionManagerContent() {
  useDocumentTitle('Player Mission Manager');

  return (
    <div className="main-container">
      <PlayerMissionManager />
    </div>
  );
}

export default function PlayerMissionManagerPage() {
  return (
    <AdminRoute>
      <PlayerMissionManagerContent />
    </AdminRoute>
  );
}
