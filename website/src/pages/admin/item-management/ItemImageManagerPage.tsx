import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { AutocompleteInput, type AutocompleteOption } from '@components/common/AutocompleteInput';
import itemsService from '@services/itemsService';
import '@styles/admin/item-manager.css';

interface ImageEntry {
  uid: string;
  file: File;
  previewUrl: string;
  cloudinaryUrl: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  itemSearchValue: string;
  assignedItem: { id: number; name: string } | null;
}

let uidCounter = 0;

function ItemImageManagerContent() {
  useDocumentTitle('Item Image Manager');

  const [entries, setEntries] = useState<ImageEntry[]>([]);
  const [items, setItems] = useState<AutocompleteOption[]>([]);
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{ success: number } | null>(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const result = await itemsService.getAdminItems({ limit: 2000 });
        const options: AutocompleteOption[] = result.data.map((item) => ({
          name: item.name,
          value: item.id,
          description: item.category,
        }));
        setItems(options);
      } catch (err) {
        console.error('Failed to load items:', err);
      } finally {
        setLoadingItems(false);
      }
    };
    loadItems();
  }, []);

  const handleFilesSelected = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newEntries: ImageEntry[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      newEntries.push({
        uid: `img-${++uidCounter}`,
        file,
        previewUrl: URL.createObjectURL(file),
        cloudinaryUrl: null,
        uploading: true,
        progress: 0,
        error: null,
        itemSearchValue: '',
        assignedItem: null,
      });
    }

    setEntries((prev) => [...prev, ...newEntries]);

    // Start uploads via backend
    for (const entry of newEntries) {
      itemsService
        .uploadImageWithProgress(entry.file, (progress) => {
          setEntries((prev) =>
            prev.map((e) => (e.uid === entry.uid ? { ...e, progress } : e))
          );
        })
        .then((url) => {
          setEntries((prev) =>
            prev.map((e) =>
              e.uid === entry.uid
                ? { ...e, cloudinaryUrl: url, uploading: false, progress: 100 }
                : e
            )
          );
        })
        .catch(() => {
          setEntries((prev) =>
            prev.map((e) =>
              e.uid === entry.uid
                ? { ...e, error: 'Upload failed', uploading: false }
                : e
            )
          );
        });
    }

    e.target.value = '';
  }, []);

  const handleSearchChange = useCallback((uid: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.uid === uid ? { ...e, itemSearchValue: value, assignedItem: null } : e
      )
    );
  }, []);

  const handleItemSelect = useCallback((uid: string, option: AutocompleteOption | null) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.uid === uid
          ? {
              ...e,
              assignedItem: option
                ? { id: option.value as number, name: option.name }
                : null,
            }
          : e
      )
    );
  }, []);

  const handleRemoveEntry = useCallback((uid: string) => {
    setEntries((prev) => {
      const entry = prev.find((e) => e.uid === uid);
      if (entry?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(entry.previewUrl);
      }
      return prev.filter((e) => e.uid !== uid);
    });
  }, []);

  const committableEntries = entries.filter(
    (e) => e.cloudinaryUrl && e.assignedItem
  );

  const handleCommit = async () => {
    if (committableEntries.length === 0) return;

    setCommitting(true);
    setCommitResult(null);

    try {
      const updates = committableEntries.map((e) => ({
        id: e.assignedItem!.id,
        image_url: e.cloudinaryUrl!,
      }));

      const result = await itemsService.batchUpdateItemImages(updates);

      // Remove committed entries
      const committedUids = new Set(committableEntries.map((e) => e.uid));
      setEntries((prev) => {
        for (const entry of prev) {
          if (committedUids.has(entry.uid) && entry.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(entry.previewUrl);
          }
        }
        return prev.filter((e) => !committedUids.has(e.uid));
      });

      setCommitResult({ success: result.updated });
    } catch (err) {
      console.error('Batch commit failed:', err);
      setCommitResult(null);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="item-image-manager">
      <div className="page-header">
        <h1>Item Image Manager</h1>
        <p className="text-muted">
          Bulk upload images and assign them to items
        </p>
      </div>

      <div className="item-image-manager__actions">
        <button
          type="button"
          className="button primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={loadingItems}
        >
          <i className="fa-solid fa-images" />
          <span>Select Images</span>
        </button>

        <button
          type="button"
          className="button success"
          onClick={handleCommit}
          disabled={committing || committableEntries.length === 0}
        >
          <i className="fa-solid fa-check-double" />
          <span>
            {committing
              ? 'Committing...'
              : `Commit All (${committableEntries.length})`}
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFilesSelected}
          style={{ display: 'none' }}
        />
      </div>

      {commitResult && (
        <div className="alert success">
          <i className="fa-solid fa-circle-check" />
          <span>
            Successfully updated images for {commitResult.success} item
            {commitResult.success !== 1 ? 's' : ''}.
          </span>
        </div>
      )}

      {loadingItems && (
        <div className="alert info">
          <i className="fa-solid fa-spinner fa-spin" />
          <span>Loading item list...</span>
        </div>
      )}

      {entries.length === 0 && !loadingItems && (
        <div className="empty-state">
          <i className="fa-solid fa-cloud-arrow-up" />
          <h3>No images selected</h3>
          <p>Click "Select Images" to upload files and assign them to items.</p>
        </div>
      )}

      {entries.length > 0 && (
        <div className="item-image-manager__entries">
          {entries.map((entry) => (
            <div key={entry.uid} className="item-image-manager__entry">
              <div className="item-image-manager__preview">
                <img src={entry.previewUrl} alt={entry.file.name} />
              </div>

              <div className="item-image-manager__details">
                <div className="item-image-manager__filename">
                  {entry.file.name}
                </div>

                {entry.uploading && (
                  <div className="item-image-manager__progress">
                    <div className="progress">
                      <div
                        className="progress-fill primary"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                    <span className="progress-label">{entry.progress}%</span>
                  </div>
                )}

                {!entry.uploading && !entry.error && (
                  <div className="item-image-manager__status uploaded">
                    <i className="fa-solid fa-circle-check" />
                    <span>Uploaded</span>
                  </div>
                )}

                {entry.error && (
                  <div className="item-image-manager__status error">
                    <i className="fa-solid fa-circle-xmark" />
                    <span>{entry.error}</span>
                  </div>
                )}

                <AutocompleteInput
                  value={entry.itemSearchValue}
                  onChange={(val) => handleSearchChange(entry.uid, val)}
                  options={items}
                  placeholder="Search for item..."
                  onSelect={(opt) => handleItemSelect(entry.uid, opt)}
                  disabled={!!entry.error}
                />
              </div>

              <button
                type="button"
                className="button danger small no-flex item-image-manager__remove"
                onClick={() => handleRemoveEntry(entry.uid)}
                title="Remove"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ItemImageManagerPage() {
  return (
    <AdminRoute>
      <ItemImageManagerContent />
    </AdminRoute>
  );
}
