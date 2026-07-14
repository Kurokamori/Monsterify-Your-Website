import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@components/common/Modal'
import monsterService from '@services/monsterService'
import type { Monster, RerollScope, RerollMoveMode, AdminRerollResult } from '@services/monsterService'

// ============================================================================
// Helpers
// ============================================================================

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response
    if (resp?.data?.message) return resp.data.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

// ============================================================================
// Props
// ============================================================================

interface StatMoveRollerModalProps {
  isOpen: boolean
  onClose: () => void
  /** When provided, the tool operates only on this monster (scope locked to 'single'). */
  singleMonster?: Monster | null
  onSuccess: (message: string) => void
  onError: (message: string) => void
  /** Called after a successful (non-dry-run) apply so the caller can refresh. */
  onApplied?: () => void
}

// ============================================================================
// Component
// ============================================================================

export function StatMoveRollerModal({
  isOpen,
  onClose,
  singleMonster,
  onSuccess,
  onError,
  onApplied,
}: StatMoveRollerModalProps) {
  const isSingle = !!singleMonster

  const [scope, setScope] = useState<RerollScope>('single')
  const [rerollStats, setRerollStats] = useState(true)
  const [rerollMoves, setRerollMoves] = useState(true)
  const [rerollIVs, setRerollIVs] = useState(false)
  const [moveMode, setMoveMode] = useState<RerollMoveMode>('replace')

  const [preview, setPreview] = useState<AdminRerollResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [applying, setApplying] = useState(false)

  // Reset state whenever the modal opens (and lock scope for single-monster use)
  useEffect(() => {
    if (!isOpen) return
    setScope(isSingle ? 'single' : 'wrong')
    setRerollStats(true)
    setRerollMoves(true)
    setRerollIVs(false)
    setMoveMode(isSingle ? 'replace' : 'topup')
    setPreview(null)
    setScanning(false)
    setApplying(false)
  }, [isOpen, isSingle])

  const nothingSelected = !rerollStats && !rerollMoves
  const isMass = scope === 'all' || scope === 'wrong'

  // Any change to the request parameters invalidates a previous preview
  const invalidatePreview = useCallback(() => setPreview(null), [])

  const buildRequest = useCallback(
    (dryRun: boolean) => ({
      scope,
      monsterId: singleMonster?.id,
      rerollStats,
      rerollMoves,
      rerollIVs,
      moveMode,
      dryRun,
    }),
    [scope, singleMonster, rerollStats, rerollMoves, rerollIVs, moveMode],
  )

  const handleScan = useCallback(async () => {
    if (nothingSelected) return
    setScanning(true)
    try {
      const res = await monsterService.adminRerollMonsters(buildRequest(true))
      setPreview(res.data)
    } catch (err) {
      onError(getAxiosError(err, 'Failed to scan monsters'))
    } finally {
      setScanning(false)
    }
  }, [nothingSelected, buildRequest, onError])

  const handleApply = useCallback(async () => {
    if (nothingSelected) return
    setApplying(true)
    try {
      const res = await monsterService.adminRerollMonsters(buildRequest(false))
      onSuccess(res.message)
      onApplied?.()
      onClose()
    } catch (err) {
      onError(getAxiosError(err, 'Failed to reroll monsters'))
    } finally {
      setApplying(false)
    }
  }, [nothingSelected, buildRequest, onSuccess, onApplied, onClose, onError])

  const busy = scanning || applying
  // For mass operations, require a fresh preview before applying to avoid
  // accidentally rewriting the database.
  const applyDisabled = nothingSelected || busy || (isMass && !preview)

  const scopeLabel: Record<RerollScope, string> = {
    single: 'This monster only',
    all: 'All monsters',
    wrong: 'Only "wrong" monsters (need fixing)',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSingle ? `Stat & Move Roller — ${singleMonster?.name ?? `#${singleMonster?.id}`}` : 'Stat & Move Roller'}
      size="medium"
      footer={
        <div className="monster-manager__modal-footer">
          <button type="button" className="button secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          {isMass && (
            <button type="button" className="button secondary" onClick={handleScan} disabled={nothingSelected || busy}>
              {scanning ? (
                <><i className="fas fa-spinner fa-spin" /> Scanning...</>
              ) : (
                <><i className="fas fa-search" /> Preview</>
              )}
            </button>
          )}
          <button type="button" className="button primary" onClick={handleApply} disabled={applyDisabled}>
            {applying ? (
              <><i className="fas fa-spinner fa-spin" /> Applying...</>
            ) : (
              <><i className="fas fa-dice" /> {isMass ? 'Apply Reroll' : 'Reroll'}</>
            )}
          </button>
        </div>
      }
    >
      <div className="monster-manager__add-modal">
        {/* Scope */}
        {!isSingle && (
          <div className="monster-manager__add-field">
            <label>Apply to</label>
            <select
              className="select"
              value={scope}
              onChange={(e) => { setScope(e.target.value as RerollScope); invalidatePreview() }}
            >
              <option value="wrong">{scopeLabel.wrong}</option>
              <option value="all">{scopeLabel.all}</option>
            </select>
            {scope === 'wrong' && (
              <p className="monster-manager__roller-hint">
                A monster is "wrong" if its stat totals don't match the formula for its level, or if it has
                zero moves / fewer than (expected&nbsp;−&nbsp;1) moves for its level. Only the wrong part of each
                monster is touched.
              </p>
            )}
            {scope === 'all' && (
              <p className="monster-manager__roller-hint monster-manager__roller-hint--warn">
                <i className="fas fa-exclamation-triangle" /> This rerolls every monster in the database.
              </p>
            )}
          </div>
        )}

        {/* What to reroll */}
        <div className="monster-manager__add-field">
          <label>What to reroll</label>
          <label className="monster-manager__roller-check">
            <input
              type="checkbox"
              checked={rerollStats}
              onChange={(e) => { setRerollStats(e.target.checked); invalidatePreview() }}
            />
            <span>Stats</span>
          </label>
          <label className="monster-manager__roller-check">
            <input
              type="checkbox"
              checked={rerollMoves}
              onChange={(e) => { setRerollMoves(e.target.checked); invalidatePreview() }}
            />
            <span>Moves</span>
          </label>
          {nothingSelected && (
            <p className="monster-manager__roller-hint monster-manager__roller-hint--warn">
              Select at least one of Stats or Moves.
            </p>
          )}
        </div>

        {/* Stat options */}
        {rerollStats && (
          <div className="monster-manager__add-field">
            <label>Stat mode</label>
            <label className="monster-manager__roller-check">
              <input
                type="checkbox"
                checked={rerollIVs}
                onChange={(e) => { setRerollIVs(e.target.checked); invalidatePreview() }}
              />
              <span>Re-randomize IVs &amp; nature</span>
            </label>
            <p className="monster-manager__roller-hint">
              {rerollIVs
                ? 'New random IVs and nature are rolled, then totals are recalculated for the current level. Changes the monster’s potential.'
                : 'Existing IVs, EVs, and nature are kept; only the stat totals are recalculated for the current level.'}
            </p>
          </div>
        )}

        {/* Move options */}
        {rerollMoves && (
          <div className="monster-manager__add-field">
            <label>Move mode</label>
            <select
              className="select"
              value={moveMode}
              onChange={(e) => { setMoveMode(e.target.value as RerollMoveMode); invalidatePreview() }}
            >
              <option value="topup">Top up to expected count (keep existing moves)</option>
              <option value="replace">Fully regenerate moveset</option>
            </select>
            <p className="monster-manager__roller-hint">
              {moveMode === 'topup'
                ? 'Existing moves are kept and new ones are rolled until the monster reaches the expected count for its level.'
                : 'The entire moveset is discarded and re-rolled fresh for the current level.'}
            </p>
          </div>
        )}

        {/* Preview */}
        {isMass && preview && (
          <div className="monster-manager__roller-preview">
            <div className="monster-manager__roller-preview-title">
              <i className="fas fa-search" /> Preview
            </div>
            <ul>
              <li><strong>{preview.scanned}</strong> monsters scanned</li>
              <li><strong>{preview.matched}</strong> would be affected</li>
              {rerollStats && <li><strong>{preview.statsToReroll}</strong> stat rerolls</li>}
              {rerollMoves && <li><strong>{preview.movesToReroll}</strong> move rerolls</li>}
            </ul>
            {preview.matched === 0 && (
              <p className="monster-manager__roller-hint">Nothing matches — nothing to apply.</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
