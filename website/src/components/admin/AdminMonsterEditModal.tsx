import { useState, useEffect, useCallback, useRef } from 'react'
import { Modal } from '@components/common/Modal'
import monsterService from '@services/monsterService'
import abilityService from '@services/abilityService'
import type { Monster, MonsterMove } from '@services/monsterService'
import type { Ability } from '@services/abilityService'
import '@styles/admin/admin-monster-edit.css'

// ============================================================================
// Constants
// ============================================================================

const NATURES = [
  'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
  'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
  'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
  'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
  'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky',
]

const STAT_LABELS: Record<string, string> = {
  hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe',
}

const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const

function parseMoveset(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((m): m is string => typeof m === 'string')
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((m): m is string => typeof m === 'string')
    } catch { /* ignore */ }
  }
  return []
}

// ============================================================================
// Types
// ============================================================================

interface AdminMonsterEditModalProps {
  monster: Monster | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

interface FormState {
  level: number
  nature: string
  friendship: number
  ability1: string
  ability2: string
  hp_iv: number; atk_iv: number; def_iv: number; spa_iv: number; spd_iv: number; spe_iv: number
  hp_ev: number; atk_ev: number; def_ev: number; spa_ev: number; spd_ev: number; spe_ev: number
  hp_total: number; atk_total: number; def_total: number; spa_total: number; spd_total: number; spe_total: number
  moveset: string[]
}

// ============================================================================
// Move Search Sub-Component
// ============================================================================

function MoveSearchWizard({
  currentMoves,
  onAddMove,
  onRemoveMove,
}: {
  currentMoves: string[]
  onAddMove: (moveName: string) => void
  onRemoveMove: (index: number) => void
}) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<MonsterMove[]>([])
  const [loading, setLoading] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!search.trim()) { setResults([]); return }

    searchTimeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        const moves = await monsterService.adminSearchMoves(search, undefined, 20)
        setResults(moves)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search])

  return (
    <div className="admin-monster-edit__moves">
      <label className="admin-monster-edit__label">Moveset</label>

      <div className="admin-monster-edit__move-list">
        {currentMoves.map((move, i) => (
          <div key={i} className="admin-monster-edit__move-chip">
            <span>{move}</span>
            <button
              type="button"
              className="admin-monster-edit__move-remove"
              onClick={() => onRemoveMove(i)}
              aria-label={`Remove ${move}`}
            >
              <i className="fas fa-times" />
            </button>
          </div>
        ))}
        {currentMoves.length === 0 && (
          <span className="admin-monster-edit__move-empty">No moves assigned</span>
        )}
      </div>

      <div className="admin-monster-edit__move-search-wrap">
          <div className="admin-monster-edit__move-search-input-wrap">
            <i className="fas fa-search admin-monster-edit__move-search-icon" />
            <input
              type="text"
              className="input admin-monster-edit__move-search-input"
              placeholder="Search moves..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading && <i className="fas fa-spinner fa-spin admin-monster-edit__move-search-spinner" />}
          </div>

          {results.length > 0 && (
            <div className="admin-monster-edit__move-results">
              {results.map((move) => {
                const alreadyAdded = currentMoves.some(
                  m => m.toLowerCase() === move.name.toLowerCase()
                )
                return (
                  <button
                    key={move.name}
                    type="button"
                    className={`admin-monster-edit__move-result${alreadyAdded ? ' admin-monster-edit__move-result--disabled' : ''}`}
                    onClick={() => {
                      if (!alreadyAdded) {
                        onAddMove(move.name)
                        setSearch('')
                        setResults([])
                      }
                    }}
                    disabled={alreadyAdded}
                  >
                    <span className="admin-monster-edit__move-result-name">{move.name}</span>
                    <span className="admin-monster-edit__move-result-meta">
                      {move.type && <span className="admin-monster-edit__move-result-type">{move.type}</span>}
                      {move.power != null && <span>Pwr: {move.power}</span>}
                      {move.accuracy != null && <span>Acc: {move.accuracy}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
    </div>
  )
}

// ============================================================================
// Ability Search Sub-Component
// ============================================================================

function AbilitySearch({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (val: string) => void
}) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Ability[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!search.trim()) { setResults([]); return }

    searchTimeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        const abilities = await abilityService.searchAbilities(search)
        setResults(abilities.slice(0, 15))
        setShowDropdown(true)
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="admin-monster-edit__ability-field" ref={wrapRef}>
      <label className="admin-monster-edit__label">{label}</label>
      {value ? (
        <div className="admin-monster-edit__ability-chip">
          <span>{value}</span>
          <button
            type="button"
            className="admin-monster-edit__move-remove"
            onClick={() => onChange('')}
            aria-label={`Clear ${label}`}
          >
            <i className="fas fa-times" />
          </button>
        </div>
      ) : (
        <div className="admin-monster-edit__ability-search-wrap">
          <input
            type="text"
            className="input"
            placeholder="Search abilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
          />
          {loading && <i className="fas fa-spinner fa-spin admin-monster-edit__ability-spinner" />}
          {showDropdown && results.length > 0 && (
            <div className="admin-monster-edit__ability-dropdown">
              {results.map((a) => (
                <button
                  key={a.name}
                  type="button"
                  className="admin-monster-edit__ability-option"
                  onClick={() => {
                    onChange(a.name)
                    setSearch('')
                    setResults([])
                    setShowDropdown(false)
                  }}
                >
                  <span className="admin-monster-edit__ability-option-name">{a.name}</span>
                  {a.description && (
                    <span className="admin-monster-edit__ability-option-desc">{a.description}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Main Modal Component
// ============================================================================

export function AdminMonsterEditModal({
  monster,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: AdminMonsterEditModalProps) {
  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load full monster data when modal opens
  useEffect(() => {
    if (!isOpen || !monster) {
      setForm(null)
      return
    }

    setLoading(true)
    monsterService.getMonsterById(monster.id).then((resp) => {
      const m = resp.data
      if (!m) {
        onError('Failed to load monster data')
        return
      }
      setForm({
        level: (m.level as number) ?? 1,
        nature: (m.nature as string) ?? '',
        friendship: (m.friendship as number) ?? 0,
        ability1: (m.ability1 as string) ?? '',
        ability2: (m.ability2 as string) ?? '',
        hp_iv: (m.hp_iv as number) ?? 0, atk_iv: (m.atk_iv as number) ?? 0,
        def_iv: (m.def_iv as number) ?? 0, spa_iv: (m.spa_iv as number) ?? 0,
        spd_iv: (m.spd_iv as number) ?? 0, spe_iv: (m.spe_iv as number) ?? 0,
        hp_ev: (m.hp_ev as number) ?? 0, atk_ev: (m.atk_ev as number) ?? 0,
        def_ev: (m.def_ev as number) ?? 0, spa_ev: (m.spa_ev as number) ?? 0,
        spd_ev: (m.spd_ev as number) ?? 0, spe_ev: (m.spe_ev as number) ?? 0,
        hp_total: (m.hp_total as number) ?? 0, atk_total: (m.atk_total as number) ?? 0,
        def_total: (m.def_total as number) ?? 0, spa_total: (m.spa_total as number) ?? 0,
        spd_total: (m.spd_total as number) ?? 0, spe_total: (m.spe_total as number) ?? 0,
        moveset: parseMoveset(m.moveset),
      })
    }).catch(() => {
      onError('Failed to load monster data')
    }).finally(() => {
      setLoading(false)
    })
  }, [isOpen, monster, onError])

  const updateField = useCallback((field: keyof FormState, value: unknown) => {
    setForm(prev => prev ? { ...prev, [field]: value } : prev)
  }, [])

  const updateNumericField = useCallback((field: keyof FormState, value: string, min: number, max: number) => {
    const num = Math.max(min, Math.min(max, parseInt(value) || 0))
    setForm(prev => prev ? { ...prev, [field]: num } : prev)
  }, [])

  const handleAddMove = useCallback((moveName: string) => {
    setForm(prev => {
      if (!prev) return prev
      return { ...prev, moveset: [...prev.moveset, moveName] }
    })
  }, [])

  const handleRemoveMove = useCallback((index: number) => {
    setForm(prev => {
      if (!prev) return prev
      const newMoves = [...prev.moveset]
      newMoves.splice(index, 1)
      return { ...prev, moveset: newMoves }
    })
  }, [])

  const evTotal = form
    ? form.hp_ev + form.atk_ev + form.def_ev + form.spa_ev + form.spd_ev + form.spe_ev
    : 0

  const handleSubmit = useCallback(async () => {
    if (!form || !monster) return
    setSubmitting(true)
    try {
      await monsterService.adminUpdateMonster(monster.id, {
        level: form.level,
        nature: form.nature,
        friendship: form.friendship,
        ability1: form.ability1 || null,
        ability2: form.ability2 || null,
        hp_iv: form.hp_iv, atk_iv: form.atk_iv, def_iv: form.def_iv,
        spa_iv: form.spa_iv, spd_iv: form.spd_iv, spe_iv: form.spe_iv,
        hp_ev: form.hp_ev, atk_ev: form.atk_ev, def_ev: form.def_ev,
        spa_ev: form.spa_ev, spd_ev: form.spd_ev, spe_ev: form.spe_ev,
        hp_total: form.hp_total, atk_total: form.atk_total, def_total: form.def_total,
        spa_total: form.spa_total, spd_total: form.spd_total, spe_total: form.spe_total,
        moveset: form.moveset,
      })
      onSuccess(`Monster "${monster.name ?? monster.id}" updated successfully`)
      onClose()
    } catch (err) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to update monster')
        : 'Failed to update monster'
      onError(msg)
    } finally {
      setSubmitting(false)
    }
  }, [form, monster, onClose, onSuccess, onError])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Admin Edit: ${monster?.name ?? `Monster #${monster?.id}`}`}
      size="large"
      footer={
        <div className="admin-monster-edit__footer">
          <button type="button" className="button secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="button primary"
            onClick={handleSubmit}
            disabled={submitting || loading || !form}
          >
            {submitting ? (
              <><i className="fas fa-spinner fa-spin" /> Saving...</>
            ) : (
              <><i className="fas fa-save" /> Save Changes</>
            )}
          </button>
        </div>
      }
    >
      {loading || !form ? (
        <div className="admin-monster-edit__loading">
          <i className="fas fa-spinner fa-spin" /> Loading monster data...
        </div>
      ) : (
        <div className="admin-monster-edit">
          {/* Level & Nature & Friendship */}
          <div className="admin-monster-edit__section">
            <h4 className="admin-monster-edit__section-title">
              <i className="fas fa-chart-line" /> Core Stats
            </h4>
            <div className="admin-monster-edit__row-3">
              <div className="admin-monster-edit__field">
                <label className="admin-monster-edit__label">Level</label>
                <input
                  type="number"
                  className="input"
                  value={form.level}
                  min={1}
                  max={100}
                  onChange={(e) => updateNumericField('level', e.target.value, 1, 100)}
                />
              </div>
              <div className="admin-monster-edit__field">
                <label className="admin-monster-edit__label">Nature</label>
                <select
                  className="select"
                  value={form.nature}
                  onChange={(e) => updateField('nature', e.target.value)}
                >
                  <option value="">— Select —</option>
                  {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="admin-monster-edit__field">
                <label className="admin-monster-edit__label">Friendship</label>
                <input
                  type="number"
                  className="input"
                  value={form.friendship}
                  min={0}
                  max={255}
                  onChange={(e) => updateNumericField('friendship', e.target.value, 0, 255)}
                />
              </div>
            </div>
          </div>

          {/* Abilities */}
          <div className="admin-monster-edit__section">
            <h4 className="admin-monster-edit__section-title">
              <i className="fas fa-star" /> Abilities
            </h4>
            <div className="admin-monster-edit__row-2">
              <AbilitySearch
                label="Ability 1"
                value={form.ability1}
                onChange={(v) => updateField('ability1', v)}
              />
              <AbilitySearch
                label="Ability 2"
                value={form.ability2}
                onChange={(v) => updateField('ability2', v)}
              />
            </div>
          </div>

          {/* IVs */}
          <div className="admin-monster-edit__section">
            <h4 className="admin-monster-edit__section-title">
              <i className="fas fa-dna" /> Individual Values (IVs)
              <span className="admin-monster-edit__hint">0–31</span>
            </h4>
            <div className="admin-monster-edit__stat-grid">
              {STAT_KEYS.map(stat => (
                <div key={stat} className="admin-monster-edit__stat-cell">
                  <label className="admin-monster-edit__stat-label">{STAT_LABELS[stat]}</label>
                  <input
                    type="number"
                    className="input admin-monster-edit__stat-input"
                    value={form[`${stat}_iv` as keyof FormState] as number}
                    min={0}
                    max={31}
                    onChange={(e) => updateNumericField(`${stat}_iv` as keyof FormState, e.target.value, 0, 31)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* EVs */}
          <div className="admin-monster-edit__section">
            <h4 className="admin-monster-edit__section-title">
              <i className="fas fa-dumbbell" /> Effort Values (EVs)
              <span className="admin-monster-edit__hint">Max 252 each, 510 total</span>
              <span className={`admin-monster-edit__ev-total${evTotal > 510 ? ' admin-monster-edit__ev-total--over' : ''}`}>
                Total: {evTotal}/510
              </span>
            </h4>
            <div className="admin-monster-edit__stat-grid">
              {STAT_KEYS.map(stat => (
                <div key={stat} className="admin-monster-edit__stat-cell">
                  <label className="admin-monster-edit__stat-label">{STAT_LABELS[stat]}</label>
                  <input
                    type="number"
                    className="input admin-monster-edit__stat-input"
                    value={form[`${stat}_ev` as keyof FormState] as number}
                    min={0}
                    max={252}
                    onChange={(e) => updateNumericField(`${stat}_ev` as keyof FormState, e.target.value, 0, 252)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Stat Totals */}
          <div className="admin-monster-edit__section">
            <h4 className="admin-monster-edit__section-title">
              <i className="fas fa-calculator" /> Stat Totals
              <span className="admin-monster-edit__hint">Override calculated totals</span>
            </h4>
            <div className="admin-monster-edit__stat-grid">
              {STAT_KEYS.map(stat => (
                <div key={stat} className="admin-monster-edit__stat-cell">
                  <label className="admin-monster-edit__stat-label">{STAT_LABELS[stat]}</label>
                  <input
                    type="number"
                    className="input admin-monster-edit__stat-input"
                    value={form[`${stat}_total` as keyof FormState] as number}
                    min={0}
                    max={999}
                    onChange={(e) => updateNumericField(`${stat}_total` as keyof FormState, e.target.value, 0, 999)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Moves */}
          <div className="admin-monster-edit__section">
            <h4 className="admin-monster-edit__section-title">
              <i className="fas fa-bolt" /> Moves
              <span className="admin-monster-edit__hint">{form.moveset.length} move{form.moveset.length !== 1 ? 's' : ''}</span>
            </h4>
            <MoveSearchWizard
              currentMoves={form.moveset}
              onAddMove={handleAddMove}
              onRemoveMove={handleRemoveMove}
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
