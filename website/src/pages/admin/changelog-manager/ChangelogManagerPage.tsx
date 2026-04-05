import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useAuth } from '@contexts/AuthContext';
import { AdminRoute } from '@components/common/AdminRoute';
import { Modal } from '@components/common/Modal';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { WysiwygEditor } from '@components/common/WysiwygEditor';
import { MarkdownRenderer } from '@components/common/MarkdownRenderer';
import changelogService, { ChangelogVersion, ChangelogVersionCreateInput } from '@services/changelogService';
import '@styles/admin/changelog-manager.css';

// ── Form Modal ─────────────────────────────────────────────────

function ChangelogFormModal({
  isOpen,
  onClose,
  onSave,
  editingVersion,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingVersion: ChangelogVersion | null;
}) {
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingVersion) {
        setVersion(editingVersion.version);
        setTitle(editingVersion.title);
        setContent(editingVersion.content);
        setIsPublished(editingVersion.isPublished);
      } else {
        setVersion('');
        setTitle('');
        setContent('');
        setIsPublished(false);
      }
      setError('');
    }
  }, [isOpen, editingVersion]);

  const handleSubmit = async () => {
    if (!version.trim() || !title.trim()) {
      setError('Version and title are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingVersion) {
        await changelogService.update(editingVersion.id, { version: version.trim(), title: title.trim(), content, isPublished });
      } else {
        await changelogService.create({ version: version.trim(), title: title.trim(), content, isPublished } as ChangelogVersionCreateInput);
      }
      onSave();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingVersion ? 'Edit Changelog Version' : 'New Changelog Version'}
      size="xlarge"
      footer={
        <div className="changelog-form__footer">
          <button className="button secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="button primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : editingVersion ? 'Update' : 'Create'}
          </button>
        </div>
      }
    >
      <div className="changelog-form">
        {error && <div className="changelog-form__error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

        <div className="changelog-form__row">
          <div className="changelog-form__field">
            <label>Version <span className="required">*</span></label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 1.5.0"
              value={version}
              onChange={e => setVersion(e.target.value)}
            />
          </div>
          <div className="changelog-form__field">
            <label>Title <span className="required">*</span></label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Spring Update"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="changelog-form__field">
          <label>Content</label>
          <WysiwygEditor
            content={content}
            onContentChange={setContent}
            placeholder="Write your changelog content here... Use headings, bullet points, bold, italics, etc."
          />
        </div>

        <div className="changelog-form__field">
          <label className="changelog-form__checkbox">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
            />
            <span>Publish this version</span>
          </label>
          <small className="changelog-form__hint">Published versions are visible to all users and trigger the "What's New" popup.</small>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────

function ChangelogManagerContent() {
  useDocumentTitle('Changelog Manager');
  const { currentUser } = useAuth();

  const [versions, setVersions] = useState<ChangelogVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<ChangelogVersion | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ChangelogVersion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVersions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await changelogService.getAll();
      setVersions(data);
      setError('');
    } catch {
      setError('Failed to load changelog versions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleEdit = (v: ChangelogVersion) => {
    setEditingVersion(v);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingVersion(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await changelogService.remove(deleteTarget.id);
      setDeleteTarget(null);
      fetchVersions();
    } catch {
      setError('Failed to delete version');
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (v: ChangelogVersion) => {
    try {
      await changelogService.update(v.id, { isPublished: !v.isPublished });
      fetchVersions();
    } catch {
      setError('Failed to update publish status');
    }
  };

  if (!currentUser?.is_admin) return null;

  return (
    <div className="changelog-manager">
      <div className="changelog-manager__header">
        <div>
          <h1><i className="fas fa-clipboard-list"></i> Changelog Manager</h1>
          <p>Manage version changelogs visible to all users</p>
        </div>
        <button className="button primary" onClick={handleNew}>
          <i className="fas fa-plus"></i> New Version
        </button>
      </div>

      {error && <div className="changelog-manager__error"><i className="fas fa-exclamation-circle"></i> {error}</div>}

      {loading ? (
        <div className="changelog-manager__loading">
          <i className="fas fa-spinner fa-spin"></i> Loading...
        </div>
      ) : versions.length === 0 ? (
        <div className="changelog-manager__empty">
          <i className="fas fa-clipboard-list"></i>
          <p>No changelog versions yet. Create your first one!</p>
        </div>
      ) : (
        <div className="changelog-manager__list">
          {versions.map(v => (
            <div key={v.id} className={`changelog-manager__item ${v.isPublished ? 'changelog-manager__item--published' : ''}`}>
              <div className="changelog-manager__item-header">
                <div className="changelog-manager__item-info">
                  <span className={`changelog-manager__badge ${v.isPublished ? 'changelog-manager__badge--published' : 'changelog-manager__badge--draft'}`}>
                    {v.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <h3>v{v.version} — {v.title}</h3>
                </div>
                <div className="changelog-manager__item-meta">
                  {v.publishedAt && <span className="changelog-manager__date"><i className="fas fa-calendar"></i> {new Date(v.publishedAt).toLocaleDateString()}</span>}
                  <span className="changelog-manager__date"><i className="fas fa-clock"></i> Updated {new Date(v.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="changelog-manager__item-preview">
                {v.content ? (
                  <MarkdownRenderer content={v.content.length > 200 ? v.content.substring(0, 200) + '...' : v.content} />
                ) : (
                  <em>No content</em>
                )}
              </div>
              <div className="changelog-manager__item-actions">
                <button className="button secondary sm" onClick={() => handleTogglePublish(v)}>
                  <i className={`fas ${v.isPublished ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  {v.isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button className="button secondary sm" onClick={() => handleEdit(v)}>
                  <i className="fas fa-edit"></i> Edit
                </button>
                <button className="button danger sm" onClick={() => setDeleteTarget(v)}>
                  <i className="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ChangelogFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={fetchVersions}
        editingVersion={editingVersion}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Version"
        message={`Delete version ${deleteTarget?.version} — "${deleteTarget?.title}"?`}
        warning="This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

export default function ChangelogManagerPage() {
  return (
    <AdminRoute>
      <ChangelogManagerContent />
    </AdminRoute>
  );
}
