import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { MissionContentManager } from '@components/admin/MissionContentManager';
import '@styles/admin/mission-content-manager.css';

function MissionContentManagerContent() {
  useDocumentTitle('Mission Content Manager');

  return (
    <div className="main-container">
      <MissionContentManager />
    </div>
  );
}

export default function MissionContentManagerPage() {
  return (
    <AdminRoute>
      <MissionContentManagerContent />
    </AdminRoute>
  );
}
