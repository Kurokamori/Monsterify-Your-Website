import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { PromptManagement } from '@components/admin/PromptManagement';
import '@styles/admin/prompt-manager.css';

function PromptManagerContent() {
  useDocumentTitle('Prompt Manager');

  return (
    <div className="main-container">
      <PromptManagement />
    </div>
  );
}

export default function PromptManagerPage() {
  return (
    <AdminRoute>
      <PromptManagerContent />
    </AdminRoute>
  );
}
