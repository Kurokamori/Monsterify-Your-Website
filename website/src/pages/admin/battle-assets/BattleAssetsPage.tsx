import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { FileUpload } from '@components/common/FileUpload';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { useConfirmModal } from '@components/common/useConfirmModal';
import battleService, {
  type BattleAsset,
  type BattleAssetKind,
  type BattleAssetInput,
} from '@services/battleService';
import monsterService from '@services/monsterService';
import '@styles/battle/battle-arena.css';
import '@styles/admin/battle-assets.css';

// ============================================================================
// Helpers & model
// ============================================================================

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

const KIND_LABELS: Record<BattleAssetKind, string> = {
  background: 'Background',
  spot: 'Place-Spot',
  textbox: 'Text-Box Skin',
};

const KIND_HELP: Record<BattleAssetKind, string> = {
  background: 'The scene drawn behind the battle.',
  spot: 'The little patch of ground drawn under each monster.',
  textbox: 'A nine-slice PNG that frames battle dialogue. Set the slice inset in px.',
};

type AssetForm = {
  kind: BattleAssetKind;
  name: string;
  imgLink: string;
  sliceInset: number | null;
  isActive: boolean;
};

const emptyForm = (kind: BattleAssetKind = 'background'): AssetForm => ({
  kind,
  name: '',
  imgLink: '',
  sliceInset: kind === 'textbox' ? 24 : null,
  isActive: true,
});

const PLACEHOLDER_MON = '/images/default_mon.png';

type PreviewMon = { name: string; imgLink: string; backSprite: string | null };

const DEFAULT_MINE: PreviewMon = { name: 'Your Monster', imgLink: PLACEHOLDER_MON, backSprite: null };
const DEFAULT_THEIRS: PreviewMon = { name: 'Opponent', imgLink: PLACEHOLDER_MON, backSprite: null };

// ============================================================================
// Monster search (for placeholder mons in the preview)
// ============================================================================

type MonSearchRow = {
  id: number;
  name?: string;
  img_link?: string | null;
  main_ref?: string | null;
  back_sprite?: string | null;
};

function MonSearch({ label, onPick }: { label: string; onPick: (mon: PreviewMon) => void }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<MonSearchRow[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await monsterService.searchMonsters(term, 8);
      if (!cancelled) {
        setResults((res.data as MonSearchRow[]) ?? []);
        setSearching(false);
        setOpen(true);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [term]);

  return (
    <div className="battle-assets__monsearch">
      <label>{label}</label>
      <input
        className="battle-assets__input"
        value={term}
        placeholder="Search a monster…"
        onChange={e => setTerm(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
      />
      {open && (results.length > 0 || searching) && (
        <div className="battle-assets__monsearch-results">
          {searching && <div className="battle-assets__monsearch-empty">Searching…</div>}
          {results.map(m => {
            const img = m.img_link || m.main_ref || PLACEHOLDER_MON;
            return (
              <button
                key={m.id}
                type="button"
                className="battle-assets__monsearch-row"
                onClick={() => {
                  onPick({ name: m.name || 'Monster', imgLink: img, backSprite: m.back_sprite || null });
                  setOpen(false);
                  setTerm(m.name || '');
                }}
              >
                <img src={img} alt="" onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_MON; }} />
                <span>{m.name || `#${m.id}`}</span>
                {m.back_sprite && <span className="battle-assets__monsearch-back" title="has back sprite"><i className="fas fa-images" /></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

function BattleAssetsContent() {
  useDocumentTitle('Battle Assets');
  const confirmModal = useConfirmModal();

  const [assets, setAssets] = useState<BattleAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AssetForm>(emptyForm());

  // Preview scene selections
  const [previewBgId, setPreviewBgId] = useState<number | 'form' | null>('form');
  const [previewSpotId, setPreviewSpotId] = useState<number | 'form' | null>(null);
  const [previewTextboxId, setPreviewTextboxId] = useState<number | 'form' | null>(null);
  const [previewText, setPreviewText] = useState('Prepare yourself… this battle is mine to win!');
  const [mine, setMine] = useState<PreviewMon>(DEFAULT_MINE);
  const [theirs, setTheirs] = useState<PreviewMon>(DEFAULT_THEIRS);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAssets(await battleService.adminListAssets());
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to load assets') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byKind = useMemo(
    () => ({
      background: assets.filter(a => a.kind === 'background'),
      spot: assets.filter(a => a.kind === 'spot'),
      textbox: assets.filter(a => a.kind === 'textbox'),
    }),
    [assets],
  );

  const patch = (p: Partial<AssetForm>) => setForm(prev => ({ ...prev, ...p }));

  const startCreate = (kind: BattleAssetKind) => {
    setEditingId(null);
    setForm(emptyForm(kind));
    setStatusMsg(null);
    // Point the matching preview slot at the in-progress form
    if (kind === 'background') setPreviewBgId('form');
    if (kind === 'spot') setPreviewSpotId('form');
    if (kind === 'textbox') setPreviewTextboxId('form');
  };

  const startEdit = (asset: BattleAsset) => {
    setEditingId(asset.id);
    setForm({
      kind: asset.kind,
      name: asset.name,
      imgLink: asset.imgLink,
      sliceInset: asset.sliceInset ?? (asset.kind === 'textbox' ? 24 : null),
      isActive: asset.isActive,
    });
    setStatusMsg(null);
    if (asset.kind === 'background') setPreviewBgId('form');
    if (asset.kind === 'spot') setPreviewSpotId('form');
    if (asset.kind === 'textbox') setPreviewTextboxId('form');
  };

  const cancelForm = () => {
    setEditingId(null);
    setForm(emptyForm(form.kind));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setStatusMsg({ type: 'error', text: 'Name is required' });
      return;
    }
    if (!form.imgLink.trim()) {
      setStatusMsg({ type: 'error', text: 'Upload or link an image first' });
      return;
    }
    const payload: BattleAssetInput = {
      kind: form.kind,
      name: form.name.trim(),
      imgLink: form.imgLink.trim(),
      sliceInset: form.kind === 'textbox' ? (form.sliceInset ?? 24) : null,
      isActive: form.isActive,
    };
    setSaving(true);
    setStatusMsg(null);
    try {
      if (editingId !== null) {
        await battleService.adminUpdateAsset(editingId, payload);
        setStatusMsg({ type: 'success', text: 'Saved' });
      } else {
        await battleService.adminCreateAsset(payload);
        setStatusMsg({ type: 'success', text: 'Created' });
      }
      cancelForm();
      await load();
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (asset: BattleAsset) => {
    confirmModal.confirmDanger(
      `Delete "${asset.name}"? Gyms/battles using it will fall back to no ${KIND_LABELS[asset.kind].toLowerCase()}.`,
      async () => {
        setSaving(true);
        try {
          await battleService.adminDeleteAsset(asset.id);
          setStatusMsg({ type: 'success', text: 'Deleted' });
          if (editingId === asset.id) cancelForm();
          await load();
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete') });
        } finally {
          setSaving(false);
        }
      },
      { title: 'Delete Asset', confirmText: 'Delete' },
    );
  };

  // ── Resolve the preview scene from selections (with the form as a live slot) ──
  const resolveUrl = (
    selection: number | 'form' | null,
    list: BattleAsset[],
    formKind: BattleAssetKind,
  ): { url: string | null; slice: number | null } => {
    if (selection === 'form') {
      return form.kind === formKind && form.imgLink
        ? { url: form.imgLink, slice: form.sliceInset ?? null }
        : { url: null, slice: null };
    }
    if (selection == null) return { url: null, slice: null };
    const found = list.find(a => a.id === selection);
    return found ? { url: found.imgLink, slice: found.sliceInset ?? null } : { url: null, slice: null };
  };

  const bg = resolveUrl(previewBgId, byKind.background, 'background');
  const spot = resolveUrl(previewSpotId, byKind.spot, 'spot');
  const textbox = resolveUrl(previewTextboxId, byKind.textbox, 'textbox');
  const slice = textbox.slice && textbox.slice > 0 ? textbox.slice : 24;

  const mineSprite = mine.backSprite || mine.imgLink || PLACEHOLDER_MON;
  const theirsSprite = theirs.imgLink || PLACEHOLDER_MON;

  const textboxStyle: React.CSSProperties = textbox.url
    ? {
        borderStyle: 'solid',
        borderWidth: `${slice}px`,
        borderColor: 'transparent',
        borderImageSource: `url(${textbox.url})`,
        borderImageSlice: `${slice} fill`,
        borderImageWidth: `${slice}px`,
        borderImageRepeat: 'stretch',
      }
    : {};

  const renderSelect = (
    value: number | 'form' | null,
    setValue: (v: number | 'form' | null) => void,
    list: BattleAsset[],
  ) => (
    <select
      className="battle-assets__input"
      value={value === null ? 'none' : String(value)}
      onChange={e => {
        const v = e.target.value;
        setValue(v === 'none' ? null : v === 'form' ? 'form' : parseInt(v, 10));
      }}
    >
      <option value="none">— none —</option>
      <option value="form">✎ Editing (live)</option>
      {list.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
    </select>
  );

  return (
    <div className="main-container battle-assets">
      <h1><i className="fas fa-panorama" /> Battle Assets</h1>
      <p className="battle-assets__intro">
        Build a reusable library of battle <strong>backgrounds</strong>, <strong>place-spots</strong> (the ground
        under each monster) and <strong>text-box skins</strong>. Upload to Cloudinary or paste a link, then preview
        how they look together with placeholder monsters. Assign them to gyms, gauntlets and AI battles in the
        <strong> Battle &amp; Gym Manager</strong>.
      </p>

      {statusMsg && (
        <div className={`battle-assets__status battle-assets__status--${statusMsg.type}`}>
          <i className={statusMsg.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} />
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)}><i className="fas fa-times" /></button>
        </div>
      )}

      <div className="battle-assets__layout">
        {/* ── Live preview ── */}
        <div className="battle-assets__preview">
          <h3><span className="battle-assets__panel-icon"><i className="fas fa-eye" /></span> Live Preview</h3>
          <div className={`battle-field battle-assets__field ${bg.url ? 'battle-field--has-bg' : ''}`}>
            {bg.url && (
              <div className="battle-field__bg" style={{ backgroundImage: `url(${bg.url})` }} aria-hidden="true" />
            )}
            <div className="battle-field__side battle-field__side--enemy">
              <div className="battle-field__sprite-zone">
                {spot.url
                  ? <img className="battle-field__spot" src={spot.url} alt="" aria-hidden="true" />
                  : <div className="battle-field__platform" />}
                <img className="battle-field__sprite battle-field__sprite--enemy" src={theirsSprite} alt={theirs.name}
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_MON; }} />
              </div>
            </div>
            <div className="battle-field__side battle-field__side--player">
              <div className="battle-field__sprite-zone">
                {spot.url
                  ? <img className="battle-field__spot" src={spot.url} alt="" aria-hidden="true" />
                  : <div className="battle-field__platform" />}
                <img className="battle-field__sprite battle-field__sprite--player" src={mineSprite} alt={mine.name}
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_MON; }} />
              </div>
            </div>

            {previewText.trim() && (
              <div className="battle-dialogue">
                <div className="battle-dialogue__portrait">
                  <img src={theirsSprite} alt={theirs.name}
                    onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_MON; }} />
                </div>
                <div
                  className={`battle-dialogue__box ${textbox.url ? 'battle-dialogue__box--custom' : ''}`}
                  style={textboxStyle}
                >
                  <span className="battle-dialogue__speaker">{theirs.name}</span>
                  <p className="battle-dialogue__text">{previewText}</p>
                </div>
              </div>
            )}
          </div>

          <div className="battle-assets__preview-controls">
            <div className="battle-assets__field">
              <label>Background</label>
              {renderSelect(previewBgId, setPreviewBgId, byKind.background)}
            </div>
            <div className="battle-assets__field">
              <label>Place-Spot</label>
              {renderSelect(previewSpotId, setPreviewSpotId, byKind.spot)}
            </div>
            <div className="battle-assets__field">
              <label>Text-Box</label>
              {renderSelect(previewTextboxId, setPreviewTextboxId, byKind.textbox)}
            </div>
          </div>
          <div className="battle-assets__preview-controls">
            <MonSearch label="“Mine” monster (uses back sprite)" onPick={setMine} />
            <MonSearch label="“Their” monster" onPick={setTheirs} />
            <div className="battle-assets__field battle-assets__field--grow">
              <label>Sample dialogue</label>
              <input className="battle-assets__input" value={previewText} onChange={e => setPreviewText(e.target.value)} />
            </div>
          </div>
          <p className="battle-assets__hint">
            The “mine” monster shows its back sprite when it has one (that’s the view players get of their own team).
          </p>
        </div>

        {/* ── Editor ── */}
        <div className="battle-assets__editor">
          <h3><span className="battle-assets__panel-icon"><i className={editingId !== null ? 'fas fa-pen' : 'fas fa-plus'} /></span> {editingId !== null ? 'Edit Asset' : 'New Asset'}</h3>

          <div className="battle-assets__field">
            <label>Type</label>
            <select
              className="battle-assets__input"
              value={form.kind}
              onChange={e => {
                const kind = e.target.value as BattleAssetKind;
                patch({ kind, sliceInset: kind === 'textbox' ? (form.sliceInset ?? 24) : null });
              }}
            >
              {(Object.keys(KIND_LABELS) as BattleAssetKind[]).map(k => (
                <option key={k} value={k}>{KIND_LABELS[k]}</option>
              ))}
            </select>
            <span className="battle-assets__hint">{KIND_HELP[form.kind]}</span>
          </div>

          <div className="battle-assets__field">
            <label>Name</label>
            <input className="battle-assets__input" value={form.name}
              onChange={e => patch({ name: e.target.value })} placeholder="e.g., Forest Clearing" />
          </div>

          <div className="battle-assets__field">
            <label>Image</label>
            <FileUpload
              folder="battle-assets"
              buttonText="Upload Image"
              initialImageUrl={form.imgLink || null}
              onUploadSuccess={url => patch({ imgLink: url ?? '' })}
              onUploadError={msg => setStatusMsg({ type: 'error', text: msg })}
            />
            <input
              className="battle-assets__input battle-assets__input--url"
              value={form.imgLink}
              onChange={e => patch({ imgLink: e.target.value })}
              placeholder="…or paste an image URL"
            />
          </div>

          {form.kind === 'textbox' && (
            <div className="battle-assets__field">
              <label>Nine-slice inset (px)</label>
              <input
                className="battle-assets__input"
                type="number"
                min={1}
                max={200}
                value={form.sliceInset ?? 24}
                onChange={e => patch({ sliceInset: parseInt(e.target.value, 10) || 1 })}
              />
              <span className="battle-assets__hint">
                How many px from each edge of the PNG form the fixed corners/borders (border-image-slice).
              </span>
            </div>
          )}

          <label className="battle-assets__toggle">
            <input type="checkbox" checked={form.isActive} onChange={e => patch({ isActive: e.target.checked })} />
            <span>Active (available for selection &amp; random)</span>
          </label>

          <div className="battle-assets__editor-actions">
            {editingId !== null && (
              <button className="button secondary" onClick={cancelForm} disabled={saving}>Cancel</button>
            )}
            <button className="button primary" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : <><i className="fas fa-save" /> Save</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Library ── */}
      {loading ? (
        <div className="battle-assets__loading"><i className="fas fa-spinner fa-spin" /> Loading…</div>
      ) : (
        (Object.keys(KIND_LABELS) as BattleAssetKind[]).map(kind => (
          <div key={kind} className="battle-assets__group">
            <div className="battle-assets__group-head">
              <h3>{KIND_LABELS[kind]}s <span className="battle-assets__count">({byKind[kind].length})</span></h3>
              <button className="button secondary sm" onClick={() => startCreate(kind)} disabled={saving}>
                <i className="fas fa-plus" /> Add {KIND_LABELS[kind]}
              </button>
            </div>
            {byKind[kind].length === 0 ? (
              <p className="battle-assets__empty-group">No {KIND_LABELS[kind].toLowerCase()}s yet.</p>
            ) : (
              <div className="battle-assets__grid">
                {byKind[kind].map(asset => (
                  <div key={asset.id} className={`battle-assets__card ${editingId === asset.id ? 'battle-assets__card--active' : ''} ${!asset.isActive ? 'battle-assets__card--inactive' : ''}`}>
                    <div className={`battle-assets__thumb battle-assets__thumb--${kind}`}>
                      <img src={asset.imgLink} alt={asset.name}
                        onError={e => { (e.target as HTMLImageElement).src = '/images/default_image.png'; }} />
                    </div>
                    <div className="battle-assets__card-body">
                      <span className="battle-assets__card-name">{asset.name}</span>
                      {!asset.isActive && <span className="battle-assets__card-tag">Inactive</span>}
                      {kind === 'textbox' && asset.sliceInset != null && (
                        <span className="battle-assets__card-slice">slice {asset.sliceInset}px</span>
                      )}
                    </div>
                    <div className="battle-assets__card-actions">
                      <button className="button ghost sm" title="Preview in scene"
                        onClick={() => {
                          if (kind === 'background') setPreviewBgId(asset.id);
                          if (kind === 'spot') setPreviewSpotId(asset.id);
                          if (kind === 'textbox') setPreviewTextboxId(asset.id);
                        }}>
                        <i className="fas fa-eye" />
                      </button>
                      <button className="button secondary sm" title="Edit" onClick={() => startEdit(asset)}><i className="fas fa-edit" /></button>
                      <button className="button danger sm" title="Delete" onClick={() => handleDelete(asset)}><i className="fas fa-trash" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  );
}

export default function BattleAssetsPage() {
  return (
    <AdminRoute>
      <BattleAssetsContent />
    </AdminRoute>
  );
}
