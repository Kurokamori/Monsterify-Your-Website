import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { ConfirmModal } from '@components/common/ConfirmModal';
import { useConfirmModal } from '@components/common/useConfirmModal';
import { FileUpload } from '@components/common/FileUpload';
import { MONSTER_TYPES, MONSTER_ATTRIBUTES } from '@utils/staticValues';
import battleService, {
  type AdminGym,
  type AdminGymInput,
  type GymLeaderTeamMonster,
  type GauntletTrainer,
  type BattleDialogue,
  type BattleAsset,
} from '@services/battleService';
import '@styles/admin/gym-manager.css';

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

const emptySpec = (): GymLeaderTeamMonster => ({
  name: '',
  species1: '',
  species2: '',
  species3: '',
  type1: 'Normal',
  type2: '',
  type3: '',
  type4: '',
  type5: '',
  attribute: '',
  level: 20,
  imgLink: '',
});

const emptyTrainer = (): GauntletTrainer => ({
  name: '',
  imgLink: '',
  team: [emptySpec()],
  dialogue: null,
  backgroundAssetId: null,
  backgroundRandom: false,
  spotAssetId: null,
  spotRandom: false,
});

const emptyGym = (): AdminGymInput => ({
  name: '',
  description: '',
  typeTheme: 'Normal',
  badgeName: '',
  badgeImgLink: '',
  leaderName: '',
  leaderImgLink: '',
  leaderTeam: [emptySpec()],
  gauntletTrainers: [],
  isGym: true,
  leaderTrainerId: null,
  leaderMonsterIds: [],
  leaderDialogue: null,
  backgroundAssetId: null,
  backgroundRandom: false,
  spotAssetId: null,
  spotRandom: false,
  textboxAssetId: null,
  winReward: 500,
  lossPenalty: 150,
  displayOrder: 0,
  isActive: true,
});

const gymToForm = (gym: AdminGym): AdminGymInput => ({
  name: gym.name,
  description: gym.description ?? '',
  typeTheme: gym.typeTheme ?? 'Normal',
  badgeName: gym.badgeName,
  badgeImgLink: gym.badgeImgLink ?? '',
  leaderName: gym.leaderName,
  leaderImgLink: gym.leaderImgLink ?? '',
  leaderTeam: gym.leaderTeam.length > 0 ? gym.leaderTeam.map(s => ({ ...emptySpec(), ...s })) : [emptySpec()],
  gauntletTrainers: gym.gauntletTrainers.map(t => ({
    ...emptyTrainer(),
    ...t,
    team: t.team.length > 0 ? t.team.map(s => ({ ...emptySpec(), ...s })) : [emptySpec()],
  })),
  isGym: gym.isGym,
  leaderTrainerId: gym.leaderTrainerId ?? null,
  leaderMonsterIds: gym.leaderMonsterIds ?? [],
  leaderDialogue: gym.leaderDialogue ?? null,
  backgroundAssetId: gym.backgroundAssetId ?? null,
  backgroundRandom: gym.backgroundRandom ?? false,
  spotAssetId: gym.spotAssetId ?? null,
  spotRandom: gym.spotRandom ?? false,
  textboxAssetId: gym.textboxAssetId ?? null,
  winReward: gym.winReward,
  lossPenalty: gym.lossPenalty,
  displayOrder: gym.displayOrder,
  isActive: gym.isActive,
});

// Dialogue: split textareas by line, trim, drop empties; null if nothing authored.
const cleanLines = (lines?: string[]): string[] =>
  (lines ?? []).map(l => (l ?? '').trim()).filter(Boolean);

const cleanDialogue = (d?: BattleDialogue | null): BattleDialogue | null => {
  if (!d) return null;
  const intro = cleanLines(d.intro);
  const win = cleanLines(d.win);
  const loss = cleanLines(d.loss);
  const generic = cleanLines(d.generic);
  const talkingSprite = (d.talkingSprite ?? '').trim() || null;
  if (!intro.length && !win.length && !loss.length && !generic.length && !talkingSprite) {
    return null;
  }
  return { intro, win, loss, generic, talkingSprite };
};

// Normalise a spec for saving: trim strings, drop empties to null.
const cleanSpec = (s: GymLeaderTeamMonster): GymLeaderTeamMonster => ({
  name: s.name.trim(),
  species1: (s.species1 ?? '').trim(),
  species2: (s.species2 ?? '').trim() || null,
  species3: (s.species3 ?? '').trim() || null,
  type1: s.type1 || 'Normal',
  type2: s.type2 || null,
  type3: s.type3 || null,
  type4: s.type4 || null,
  type5: s.type5 || null,
  attribute: s.attribute || null,
  level: Number(s.level) || 1,
  imgLink: (s.imgLink ?? '').trim() || null,
});

const specIsFilled = (s: GymLeaderTeamMonster): boolean =>
  Boolean(s.name.trim() && (s.species1 ?? '').trim());

const cleanTeam = (team: GymLeaderTeamMonster[]): GymLeaderTeamMonster[] =>
  team.filter(specIsFilled).map(cleanSpec);

// ============================================================================
// Sub-editors
// ============================================================================

const OPTIONAL_TYPE_OPTIONS = ['', ...MONSTER_TYPES];

function SpecEditor({
  spec,
  label,
  onChange,
  onRemove,
}: {
  spec: GymLeaderTeamMonster;
  label: string;
  onChange: (spec: GymLeaderTeamMonster) => void;
  onRemove?: () => void;
}) {
  const set = (patch: Partial<GymLeaderTeamMonster>) => onChange({ ...spec, ...patch });

  return (
    <div className="gym-manager__spec">
      <div className="gym-manager__spec-head">
        <span className="gym-manager__spec-label"><i className="fas fa-dragon" /> {label}</span>
        {onRemove && (
          <button type="button" className="button danger sm" onClick={onRemove} title="Remove monster">
            <i className="fas fa-times" />
          </button>
        )}
      </div>

      <div className="gym-manager__spec-row">
        <div className="gym-manager__field gym-manager__field--grow">
          <label>Name</label>
          <input
            className="gym-manager__input"
            value={spec.name}
            onChange={e => set({ name: e.target.value })}
            placeholder="e.g., Shadow Fang"
          />
        </div>
        <div className="gym-manager__field gym-manager__field--num">
          <label>Level</label>
          <input
            className="gym-manager__input"
            type="number"
            min={1}
            max={100}
            value={spec.level}
            onChange={e => set({ level: parseInt(e.target.value, 10) || 1 })}
          />
        </div>
        <div className="gym-manager__field">
          <label>Attribute</label>
          <select
            className="gym-manager__input"
            value={spec.attribute ?? ''}
            onChange={e => set({ attribute: e.target.value })}
          >
            <option value="">— none —</option>
            {MONSTER_ATTRIBUTES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="gym-manager__field">
        <label>Species (up to 3)</label>
        <div className="gym-manager__spec-row">
          <input
            className="gym-manager__input"
            value={spec.species1 ?? ''}
            onChange={e => set({ species1: e.target.value })}
            placeholder="Species 1 (required)"
          />
          <input
            className="gym-manager__input"
            value={spec.species2 ?? ''}
            onChange={e => set({ species2: e.target.value })}
            placeholder="Species 2"
          />
          <input
            className="gym-manager__input"
            value={spec.species3 ?? ''}
            onChange={e => set({ species3: e.target.value })}
            placeholder="Species 3"
          />
        </div>
      </div>

      <div className="gym-manager__field">
        <label>Types (up to 5)</label>
        <div className="gym-manager__spec-row gym-manager__spec-row--types">
          {(['type1', 'type2', 'type3', 'type4', 'type5'] as const).map((key, i) => (
            <select
              key={key}
              className="gym-manager__input"
              value={(spec[key] as string) ?? ''}
              onChange={e => set({ [key]: e.target.value } as Partial<GymLeaderTeamMonster>)}
            >
              {(i === 0 ? MONSTER_TYPES : OPTIONAL_TYPE_OPTIONS).map(t => (
                <option key={t || 'none'} value={t}>{t || '— none —'}</option>
              ))}
            </select>
          ))}
        </div>
      </div>

      <div className="gym-manager__field">
        <label>Image URL <span className="gym-manager__optional">(unique sprite, optional)</span></label>
        <input
          className="gym-manager__input"
          value={spec.imgLink ?? ''}
          onChange={e => set({ imgLink: e.target.value })}
          placeholder="https://…"
        />
      </div>
      {spec.imgLink && (
        <img
          className="gym-manager__spec-preview"
          src={spec.imgLink}
          alt={spec.name || 'preview'}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
    </div>
  );
}

function TeamEditor({
  team,
  onChange,
  max = 6,
}: {
  team: GymLeaderTeamMonster[];
  onChange: (team: GymLeaderTeamMonster[]) => void;
  max?: number;
}) {
  return (
    <div className="gym-manager__team">
      {team.map((spec, i) => (
        <SpecEditor
          key={i}
          label={`Monster #${i + 1}`}
          spec={spec}
          onChange={updated => onChange(team.map((s, j) => (j === i ? updated : s)))}
          onRemove={team.length > 1 ? () => onChange(team.filter((_, j) => j !== i)) : undefined}
        />
      ))}
      {team.length < max && (
        <button type="button" className="button secondary sm" onClick={() => onChange([...team, emptySpec()])}>
          <i className="fas fa-plus" /> Add Monster
        </button>
      )}
    </div>
  );
}

const DIALOGUE_FIELDS: Array<{ key: 'intro' | 'win' | 'loss' | 'generic'; label: string }> = [
  { key: 'intro', label: 'Intro (before battle)' },
  { key: 'win', label: 'On player win' },
  { key: 'loss', label: 'On player loss' },
  { key: 'generic', label: 'Generic battle-over' },
];

function DialogueEditor({
  dialogue,
  onChange,
  title,
}: {
  dialogue: BattleDialogue | null;
  onChange: (d: BattleDialogue) => void;
  title: string;
}) {
  const d = dialogue ?? {};
  const set = (p: Partial<BattleDialogue>) => onChange({ ...d, ...p });
  const linesValue = (l?: string[]) => (l ?? []).join('\n');

  return (
    <div className="gym-manager__dialogue">
      <div className="gym-manager__dialogue-head">
        <span className="gym-manager__spec-label"><i className="fas fa-comment-dots" /> {title}</span>
        <span className="gym-manager__optional">one line per row · advanced with click / space</span>
      </div>
      <div className="gym-manager__dialogue-grid">
        {DIALOGUE_FIELDS.map(f => (
          <div key={f.key} className="gym-manager__field">
            <label>{f.label}</label>
            <textarea
              className="gym-manager__input"
              rows={2}
              value={linesValue(d[f.key])}
              onChange={e => set({ [f.key]: e.target.value.split('\n') } as Partial<BattleDialogue>)}
              placeholder="Leave blank for none"
            />
          </div>
        ))}
      </div>
      <div className="gym-manager__field">
        <label>Talking sprite <span className="gym-manager__optional">(optional — shown in the dialogue box instead of the battle image)</span></label>
        <FileUpload
          folder="battle-assets/talking"
          buttonText="Upload Talking Sprite"
          initialImageUrl={d.talkingSprite || null}
          onUploadSuccess={url => set({ talkingSprite: url ?? '' })}
        />
        <input
          className="gym-manager__input"
          value={d.talkingSprite ?? ''}
          onChange={e => set({ talkingSprite: e.target.value })}
          placeholder="…or paste a URL"
        />
      </div>
    </div>
  );
}

function AppearanceSelect({
  label,
  assets,
  assetId,
  random,
  onChange,
}: {
  label: string;
  assets: BattleAsset[];
  assetId: number | null | undefined;
  random: boolean | undefined;
  onChange: (v: { assetId: number | null; random: boolean }) => void;
}) {
  const value = random ? 'random' : assetId != null ? String(assetId) : 'none';
  return (
    <div className="gym-manager__field">
      <label>{label}</label>
      <select
        className="gym-manager__input"
        value={value}
        onChange={e => {
          const v = e.target.value;
          if (v === 'none') onChange({ assetId: null, random: false });
          else if (v === 'random') onChange({ assetId: null, random: true });
          else onChange({ assetId: parseInt(v, 10), random: false });
        }}
      >
        <option value="none">— none —</option>
        <option value="random">🎲 Random</option>
        {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </select>
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

export default function GymManagerPage() {
  useDocumentTitle('Battle & Gym Manager');
  const confirmModal = useConfirmModal();

  const [gyms, setGyms] = useState<AdminGym[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<AdminGymInput>(emptyGym());
  const [assets, setAssets] = useState<BattleAsset[]>([]);

  const showingForm = creating || editingId !== null;

  const backgrounds = useMemo(() => assets.filter(a => a.kind === 'background' && a.isActive), [assets]);
  const spots = useMemo(() => assets.filter(a => a.kind === 'spot' && a.isActive), [assets]);
  const textboxes = useMemo(() => assets.filter(a => a.kind === 'textbox' && a.isActive), [assets]);

  const loadGyms = useCallback(async () => {
    setLoading(true);
    try {
      setGyms(await battleService.adminListGyms());
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to load gyms') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGyms(); }, [loadGyms]);

  useEffect(() => {
    battleService.adminListAssets().then(setAssets).catch(() => { /* non-fatal: selectors just stay empty */ });
  }, []);

  const patch = (p: Partial<AdminGymInput>) => setForm(prev => ({ ...prev, ...p }));

  const startCreate = () => {
    setEditingId(null);
    setCreating(true);
    setForm(emptyGym());
    setStatusMsg(null);
  };

  const startEdit = (gym: AdminGym) => {
    setCreating(false);
    setEditingId(gym.id);
    setForm(gymToForm(gym));
    setStatusMsg(null);
  };

  const cancelForm = () => {
    setCreating(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setStatusMsg({ type: 'error', text: 'Name is required' });
      return;
    }
    if (!form.leaderName.trim()) {
      setStatusMsg({ type: 'error', text: `${form.isGym ? 'Leader' : 'Opponent'} name is required` });
      return;
    }
    if (form.isGym && !form.badgeName.trim()) {
      setStatusMsg({ type: 'error', text: 'Badge name is required for a gym' });
      return;
    }

    const payload: AdminGymInput = {
      ...form,
      name: form.name.trim(),
      description: (form.description ?? '').trim() || null,
      typeTheme: form.typeTheme || null,
      badgeName: form.badgeName.trim() || form.name.trim(),
      badgeImgLink: (form.badgeImgLink ?? '').trim() || null,
      leaderName: form.leaderName.trim(),
      leaderImgLink: (form.leaderImgLink ?? '').trim() || null,
      leaderTeam: cleanTeam(form.leaderTeam),
      leaderDialogue: cleanDialogue(form.leaderDialogue),
      backgroundAssetId: form.backgroundAssetId ?? null,
      backgroundRandom: form.backgroundRandom ?? false,
      spotAssetId: form.spotAssetId ?? null,
      spotRandom: form.spotRandom ?? false,
      textboxAssetId: form.textboxAssetId ?? null,
      gauntletTrainers: form.gauntletTrainers
        .filter(t => t.name.trim())
        .map(t => ({
          name: t.name.trim(),
          imgLink: (t.imgLink ?? '').trim() || null,
          team: cleanTeam(t.team),
          dialogue: cleanDialogue(t.dialogue),
          backgroundAssetId: t.backgroundAssetId ?? null,
          backgroundRandom: t.backgroundRandom ?? false,
          spotAssetId: t.spotAssetId ?? null,
          spotRandom: t.spotRandom ?? false,
        }))
        .filter(t => t.team.length > 0),
    };

    if (payload.leaderTeam.length === 0 && payload.gauntletTrainers.length === 0) {
      setStatusMsg({ type: 'error', text: 'Add at least one opponent monster (leader team or a gauntlet trainer).' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    try {
      if (editingId !== null) {
        await battleService.adminUpdateGym(editingId, payload);
        setStatusMsg({ type: 'success', text: 'Saved successfully' });
      } else {
        await battleService.adminCreateGym(payload);
        setStatusMsg({ type: 'success', text: 'Created successfully' });
      }
      cancelForm();
      await loadGyms();
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save') });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (gym: AdminGym) => {
    confirmModal.confirmDanger(
      `Delete "${gym.name}"? This cannot be undone.`,
      async () => {
        setSaving(true);
        try {
          await battleService.adminDeleteGym(gym.id);
          setStatusMsg({ type: 'success', text: 'Deleted' });
          if (editingId === gym.id) cancelForm();
          await loadGyms();
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete') });
        } finally {
          setSaving(false);
        }
      },
      { title: 'Delete', confirmText: 'Delete' },
    );
  };

  const kindLabel = (gym: AdminGym): string => {
    if (gym.isGym) return 'Gym';
    return gym.gauntletTrainers.length === 0 ? 'AI Battle (one-off)' : 'AI Battle (gauntlet)';
  };

  return (
    <div className="main-container">
      <h1><i className="fas fa-fist-raised" /> Battle &amp; Gym Manager</h1>
      <p className="gym-manager__intro">
        Author gyms (which award badges), gym leaders, gauntlet trainers, and standalone AI battles.
        Turn <strong>&ldquo;This is a badge gym&rdquo;</strong> off to make an AI battle: leave the gauntlet trainers
        empty for a one-off fight, or add trainers for a non-badge gauntlet. AI opponent monsters can have unique
        names &amp; images, up to 3 species and 5 types.
      </p>

      {statusMsg && (
        <div className={`gym-manager__status gym-manager__status--${statusMsg.type}`}>
          <i className={statusMsg.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} />
          <span>{statusMsg.text}</span>
          <button className="gym-manager__status-dismiss" onClick={() => setStatusMsg(null)}>
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      <div className="gym-manager__toolbar">
        <span className="gym-manager__muted">
          {gyms.filter(g => g.isGym).length} gym(s), {gyms.filter(g => !g.isGym).length} AI battle(s)
        </span>
        <button className="button primary" onClick={startCreate} disabled={saving}>
          <i className="fas fa-plus" /> New Gym / AI Battle
        </button>
      </div>

      {/* ── Create / edit form ── */}
      {showingForm && (
        <div className="gym-manager__form">
          <h3>{editingId !== null ? `Edit: ${form.name || '(unnamed)'}` : 'Create New'}</h3>

          <label className="gym-manager__toggle">
            <input
              type="checkbox"
              checked={form.isGym}
              onChange={e => patch({ isGym: e.target.checked })}
            />
            <span>This is a badge gym (awards a badge on gauntlet completion)</span>
          </label>

          <div className="gym-manager__row">
            <div className="gym-manager__field gym-manager__field--grow">
              <label>Name</label>
              <input className="gym-manager__input" value={form.name} onChange={e => patch({ name: e.target.value })} placeholder="e.g., Ember Gym / Rival Showdown" />
            </div>
            <div className="gym-manager__field">
              <label>Type Theme</label>
              <select className="gym-manager__input" value={form.typeTheme ?? ''} onChange={e => patch({ typeTheme: e.target.value })}>
                <option value="">— none —</option>
                {MONSTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="gym-manager__field gym-manager__field--num">
              <label>Order</label>
              <input className="gym-manager__input" type="number" value={form.displayOrder} onChange={e => patch({ displayOrder: parseInt(e.target.value, 10) || 0 })} />
            </div>
          </div>

          <div className="gym-manager__field">
            <label>Description <span className="gym-manager__optional">(optional)</span></label>
            <textarea className="gym-manager__input" rows={2} value={form.description ?? ''} onChange={e => patch({ description: e.target.value })} />
          </div>

          <div className="gym-manager__row">
            <div className="gym-manager__field gym-manager__field--grow">
              <label>{form.isGym ? 'Leader Name' : 'Opponent Name'}</label>
              <input className="gym-manager__input" value={form.leaderName} onChange={e => patch({ leaderName: e.target.value })} />
            </div>
            <div className="gym-manager__field gym-manager__field--grow">
              <label>{form.isGym ? 'Leader Image URL' : 'Opponent Image URL'}</label>
              <input className="gym-manager__input" value={form.leaderImgLink ?? ''} onChange={e => patch({ leaderImgLink: e.target.value })} placeholder="https://…" />
            </div>
          </div>

          {form.isGym && (
            <div className="gym-manager__row">
              <div className="gym-manager__field gym-manager__field--grow">
                <label>Badge Name</label>
                <input className="gym-manager__input" value={form.badgeName} onChange={e => patch({ badgeName: e.target.value })} placeholder="e.g., Ember Badge" />
              </div>
              <div className="gym-manager__field gym-manager__field--grow">
                <label>Badge Image URL</label>
                <input className="gym-manager__input" value={form.badgeImgLink ?? ''} onChange={e => patch({ badgeImgLink: e.target.value })} placeholder="https://…" />
              </div>
            </div>
          )}

          <div className="gym-manager__row">
            <div className="gym-manager__field gym-manager__field--num">
              <label>Win Reward (coins)</label>
              <input className="gym-manager__input" type="number" value={form.winReward} onChange={e => patch({ winReward: parseInt(e.target.value, 10) || 0 })} />
            </div>
            <div className="gym-manager__field gym-manager__field--num">
              <label>Loss Penalty (coins)</label>
              <input className="gym-manager__input" type="number" value={form.lossPenalty} onChange={e => patch({ lossPenalty: parseInt(e.target.value, 10) || 0 })} />
            </div>
            <label className="gym-manager__toggle gym-manager__toggle--inline">
              <input type="checkbox" checked={form.isActive} onChange={e => patch({ isActive: e.target.checked })} />
              <span>Active (visible to players)</span>
            </label>
          </div>

          {/* Battle scenery */}
          <div className="gym-manager__section">
            <h4><span className="gym-manager__section-icon"><i className="fas fa-panorama" /></span> Battle Scenery <span className="gym-manager__optional">(from the Battle Assets library)</span></h4>
            <p className="gym-manager__muted">
              The background &amp; place-spots for this {form.isGym ? 'gym’s battles' : 'battle'}. Gauntlet trainers can
              override these per-stage. Choose “Random” to pick a fresh one from the library each fight.
              {backgrounds.length === 0 && spots.length === 0 && textboxes.length === 0 && (
                <> Add assets in the <strong>Battle Assets</strong> tool first.</>
              )}
            </p>
            <div className="gym-manager__row">
              <AppearanceSelect
                label="Background"
                assets={backgrounds}
                assetId={form.backgroundAssetId}
                random={form.backgroundRandom}
                onChange={v => patch({ backgroundAssetId: v.assetId, backgroundRandom: v.random })}
              />
              <AppearanceSelect
                label="Place-Spot"
                assets={spots}
                assetId={form.spotAssetId}
                random={form.spotRandom}
                onChange={v => patch({ spotAssetId: v.assetId, spotRandom: v.random })}
              />
              <div className="gym-manager__field">
                <label>Text-box skin</label>
                <select
                  className="gym-manager__input"
                  value={form.textboxAssetId != null ? String(form.textboxAssetId) : 'none'}
                  onChange={e => patch({ textboxAssetId: e.target.value === 'none' ? null : parseInt(e.target.value, 10) })}
                >
                  <option value="none">— built-in style —</option>
                  {textboxes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Gauntlet trainers — the earlier stages, fought in order */}
          <div className="gym-manager__section">
            <div className="gym-manager__section-head">
              <h4><span className="gym-manager__section-icon"><i className="fas fa-route" /></span> Gauntlet Trainers <span className="gym-manager__optional">(optional, up to 5)</span></h4>
              {form.gauntletTrainers.length < 5 && (
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={() => patch({ gauntletTrainers: [...form.gauntletTrainers, emptyTrainer()] })}
                >
                  <i className="fas fa-plus" /> Add Trainer
                </button>
              )}
            </div>
            <p className="gym-manager__muted">
              Fought in order first, each before the final battle below. Leave empty for a single fight.
            </p>

            {form.gauntletTrainers.map((trainer, ti) => (
              <div key={ti} className="gym-manager__trainer">
                <div className="gym-manager__trainer-head">
                  <span className="gym-manager__stage">Stage {ti + 1}</span>
                  <span className="gym-manager__trainer-name">{trainer.name || 'Unnamed trainer'}</span>
                  <button
                    type="button"
                    className="button danger sm gym-manager__trainer-remove"
                    onClick={() => patch({ gauntletTrainers: form.gauntletTrainers.filter((_, j) => j !== ti) })}
                    title="Remove trainer"
                  >
                    <i className="fas fa-trash" />
                  </button>
                </div>
                <div className="gym-manager__row">
                  <div className="gym-manager__field gym-manager__field--grow">
                    <label>Name</label>
                    <input
                      className="gym-manager__input"
                      value={trainer.name}
                      onChange={e => patch({
                        gauntletTrainers: form.gauntletTrainers.map((t, j) => j === ti ? { ...t, name: e.target.value } : t),
                      })}
                    />
                  </div>
                  <div className="gym-manager__field gym-manager__field--grow">
                    <label>Image URL</label>
                    <input
                      className="gym-manager__input"
                      value={trainer.imgLink ?? ''}
                      onChange={e => patch({
                        gauntletTrainers: form.gauntletTrainers.map((t, j) => j === ti ? { ...t, imgLink: e.target.value } : t),
                      })}
                      placeholder="https://…"
                    />
                  </div>
                </div>
                <TeamEditor
                  team={trainer.team}
                  onChange={team => patch({
                    gauntletTrainers: form.gauntletTrainers.map((t, j) => j === ti ? { ...t, team } : t),
                  })}
                />
                <div className="gym-manager__row gym-manager__row--overrides">
                  <AppearanceSelect
                    label="Background override"
                    assets={backgrounds}
                    assetId={trainer.backgroundAssetId}
                    random={trainer.backgroundRandom}
                    onChange={v => patch({
                      gauntletTrainers: form.gauntletTrainers.map((t, j) =>
                        j === ti ? { ...t, backgroundAssetId: v.assetId, backgroundRandom: v.random } : t),
                    })}
                  />
                  <AppearanceSelect
                    label="Place-spot override"
                    assets={spots}
                    assetId={trainer.spotAssetId}
                    random={trainer.spotRandom}
                    onChange={v => patch({
                      gauntletTrainers: form.gauntletTrainers.map((t, j) =>
                        j === ti ? { ...t, spotAssetId: v.assetId, spotRandom: v.random } : t),
                    })}
                  />
                  <span className="gym-manager__muted gym-manager__override-hint">
                    Leave on “none” to use the gym’s scenery.
                  </span>
                </div>
                <DialogueEditor
                  title={`${trainer.name || `Trainer #${ti + 1}`} Dialogue`}
                  dialogue={trainer.dialogue ?? null}
                  onChange={dialogue => patch({
                    gauntletTrainers: form.gauntletTrainers.map((t, j) => j === ti ? { ...t, dialogue } : t),
                  })}
                />
              </div>
            ))}
          </div>

          {/* Leader / boss team — the final battle */}
          <div className="gym-manager__section">
            <div className="gym-manager__section-head">
              <h4><span className="gym-manager__section-icon"><i className="fas fa-crown" /></span> {form.isGym ? 'Gym Leader Team' : 'Opponent Team'}</h4>
              <span className="gym-manager__stage gym-manager__stage--final">
                {form.gauntletTrainers.length > 0 ? 'Final Battle' : 'The Battle'}
              </span>
            </div>
            <p className="gym-manager__muted">
              {form.gauntletTrainers.length > 0
                ? `The final showdown${form.isGym ? ' against the gym leader' : ''}, fought after every stage above.`
                : `For a one-off ${form.isGym ? 'gym' : 'AI battle'}, this is the only fight.`}
            </p>
            <TeamEditor team={form.leaderTeam} onChange={leaderTeam => patch({ leaderTeam })} />
            <DialogueEditor
              title={form.isGym ? 'Leader Dialogue' : 'Opponent Dialogue'}
              dialogue={form.leaderDialogue ?? null}
              onChange={leaderDialogue => patch({ leaderDialogue })}
            />
          </div>

          <div className="gym-manager__form-actions">
            <button className="button secondary" onClick={cancelForm} disabled={saving}>Cancel</button>
            <button className="button primary" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : <><i className="fas fa-save" /> Save</>}
            </button>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="gym-manager__loading"><i className="fas fa-spinner fa-spin" /> Loading…</div>
      ) : gyms.length === 0 ? (
        <div className="gym-manager__empty"><i className="fas fa-fist-raised" /><p>No gyms or AI battles yet.</p></div>
      ) : (
        <div className="gym-manager__table-container">
          <table className="gym-manager__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Kind</th>
                <th>Leader / Opponent</th>
                <th>Stages</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gyms.map(gym => (
                <tr key={gym.id} className={editingId === gym.id ? 'gym-manager__row--active' : ''}>
                  <td>{gym.id}</td>
                  <td>{gym.name}</td>
                  <td><span className={`gym-manager__kind gym-manager__kind--${gym.isGym ? 'gym' : 'ai'}`}>{kindLabel(gym)}</span></td>
                  <td>{gym.leaderName}</td>
                  <td>{gym.gauntletTrainers.length + 1}</td>
                  <td>{gym.isActive ? <i className="fas fa-check gym-manager__yes" /> : <i className="fas fa-times gym-manager__no" />}</td>
                  <td className="gym-manager__actions-cell">
                    <button className="button secondary sm" onClick={() => startEdit(gym)} disabled={saving} title="Edit"><i className="fas fa-edit" /></button>
                    <button className="button danger sm" onClick={() => handleDelete(gym)} disabled={saving} title="Delete"><i className="fas fa-trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  );
}
