import { useState, useEffect, useCallback, useRef } from 'react'
import { useDocumentTitle } from '@hooks/useDocumentTitle'
import { AdminRoute } from '@components/common/AdminRoute'
import { AdminTable, type ColumnDef } from '@components/admin/AdminTable'
import { Modal } from '@components/common/Modal'
import townService from '@services/townService'
import '@styles/admin/garden-manager.css'

// ============================================================================
// Types
// ============================================================================

interface GardenPointEntry {
  id: number
  userId: number
  points: number
  lastHarvested: string | null
  createdAt: string
  updatedAt: string
  username: string | null
  display_name: string | null
  discord_id: string | null
}

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response
    if (resp?.data?.message) return resp.data.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

// ============================================================================
// Main Component
// ============================================================================

function GardenManagerContent() {
  useDocumentTitle('Garden Manager')

  // Table state
  const [data, setData] = useState<GardenPointEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('points')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Adjust modal state
  const [adjustTarget, setAdjustTarget] = useState<GardenPointEntry | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjusting, setAdjusting] = useState(false)

  // Set points modal state
  const [setTarget, setSetTarget] = useState<GardenPointEntry | null>(null)
  const [setAmount, setSetAmount] = useState('')
  const [setting, setSetting] = useState(false)

  const statusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Fetch data ---

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await townService.adminGetAllGardenPoints({
        page: currentPage,
        limit: 20,
        search: searchValue || undefined,
        sortBy,
        sortOrder,
      })
      setData(result.data)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Error fetching garden points:', err)
      setError('Failed to load garden points.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchValue, sortBy, sortOrder])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-dismiss status
  const showStatus = useCallback((type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text })
    if (statusTimeout.current) clearTimeout(statusTimeout.current)
    statusTimeout.current = setTimeout(() => setStatusMsg(null), 5000)
  }, [])

  // --- Sort ---

  const handleSortChange = useCallback((field: string) => {
    setSortBy(prev => {
      if (prev === field) {
        setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
        return prev
      }
      setSortOrder('desc')
      return field
    })
    setCurrentPage(1)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
    setCurrentPage(1)
  }, [])

  const handleResetFilters = useCallback(() => {
    setSearchValue('')
    setCurrentPage(1)
  }, [])

  // --- Optimistic local update ---

  const updateLocalPoints = useCallback((userId: number, newPoints: number) => {
    setData(prev => prev.map(entry =>
      entry.userId === userId ? { ...entry, points: newPoints } : entry
    ))
  }, [])

  // --- Quick adjust (+1 / -1) ---

  const handleQuickAdjust = useCallback(async (entry: GardenPointEntry, amount: number) => {
    const newPoints = Math.max(0, entry.points + amount)
    updateLocalPoints(entry.userId, newPoints)
    try {
      await townService.adminAdjustGardenPoints(entry.userId, amount)
      showStatus('success', `${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} point(s) for ${entry.display_name || entry.username || `User #${entry.userId}`}`)
    } catch (err) {
      updateLocalPoints(entry.userId, entry.points)
      showStatus('error', getAxiosError(err, 'Failed to adjust points'))
    }
  }, [updateLocalPoints, showStatus])

  // --- Adjust modal ---

  const openAdjustModal = useCallback((entry: GardenPointEntry) => {
    setAdjustTarget(entry)
    setAdjustAmount('')
  }, [])

  const handleAdjust = useCallback(async () => {
    if (!adjustTarget) return
    const amount = parseInt(adjustAmount, 10)
    if (isNaN(amount) || amount === 0) return

    const newPoints = Math.max(0, adjustTarget.points + amount)
    setAdjusting(true)
    try {
      await townService.adminAdjustGardenPoints(adjustTarget.userId, amount)
      updateLocalPoints(adjustTarget.userId, newPoints)
      showStatus('success', `Adjusted ${adjustTarget.display_name || adjustTarget.username || `User #${adjustTarget.userId}`} by ${amount > 0 ? '+' : ''}${amount} points`)
      setAdjustTarget(null)
    } catch (err) {
      showStatus('error', getAxiosError(err, 'Failed to adjust points'))
    } finally {
      setAdjusting(false)
    }
  }, [adjustTarget, adjustAmount, updateLocalPoints, showStatus])

  // --- Set points modal ---

  const openSetModal = useCallback((entry: GardenPointEntry) => {
    setSetTarget(entry)
    setSetAmount(String(entry.points))
  }, [])

  const handleSetPoints = useCallback(async () => {
    if (!setTarget) return
    const points = parseInt(setAmount, 10)
    if (isNaN(points) || points < 0) return

    setSetting(true)
    try {
      await townService.adminSetGardenPoints(setTarget.userId, points)
      updateLocalPoints(setTarget.userId, points)
      showStatus('success', `Set ${setTarget.display_name || setTarget.username || `User #${setTarget.userId}`} to ${points} points`)
      setSetTarget(null)
    } catch (err) {
      showStatus('error', getAxiosError(err, 'Failed to set points'))
    } finally {
      setSetting(false)
    }
  }, [setTarget, setAmount, updateLocalPoints, showStatus])

  // --- Columns ---

  const columns: ColumnDef<GardenPointEntry>[] = [
    {
      key: 'id',
      header: 'User ID',
      sortable: true,
      className: 'garden-manager__id-col',
      render: (entry) => String(entry.userId),
    },
    {
      key: 'username',
      header: 'User',
      sortable: true,
      render: (entry) => (
        <div className="garden-manager__user-cell">
          <span className="garden-manager__display-name">
            {entry.display_name || entry.username || '—'}
          </span>
          {entry.discord_id && (
            <span className="garden-manager__discord-id">{entry.discord_id}</span>
          )}
        </div>
      ),
    },
    {
      key: 'points',
      header: 'Points',
      sortable: true,
      render: (entry) => (
        <div className="garden-manager__points-cell">
          <span className="garden-manager__points-value">{entry.points}</span>
          <div className="garden-manager__quick-adjust">
            <button
              className="button sm ghost garden-manager__adjust-btn"
              onClick={(e) => { e.stopPropagation(); handleQuickAdjust(entry, -1) }}
              title="Subtract 1"
            >
              <i className="fas fa-minus" />
            </button>
            <button
              className="button sm ghost garden-manager__adjust-btn"
              onClick={(e) => { e.stopPropagation(); handleQuickAdjust(entry, 1) }}
              title="Add 1"
            >
              <i className="fas fa-plus" />
            </button>
          </div>
        </div>
      ),
    },
    {
      key: 'last_harvested',
      header: 'Last Harvested',
      sortable: true,
      render: (entry) =>
        entry.lastHarvested
          ? new Date(entry.lastHarvested).toLocaleDateString()
          : '—',
    },
  ]

  // --- Render ---

  return (
    <>
      {statusMsg && (
        <div className={`garden-manager__status garden-manager__status--${statusMsg.type}`}>
          <i className={`fas ${statusMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
          <span>{statusMsg.text}</span>
          <button
            type="button"
            className="garden-manager__status-dismiss"
            onClick={() => setStatusMsg(null)}
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      <AdminTable<GardenPointEntry>
        title="Garden Manager"
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        error={error}
        onRetry={fetchData}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by username, display name, or Discord ID..."
        onResetFilters={handleResetFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage="No garden points found"
        actions={(entry) => (
          <>
            <button
              className="button sm primary"
              onClick={() => openAdjustModal(entry)}
            >
              <i className="fas fa-plus-minus" /> Adjust
            </button>
            <button
              className="button sm secondary"
              onClick={() => openSetModal(entry)}
            >
              <i className="fas fa-edit" /> Set
            </button>
          </>
        )}
      />

      {/* Adjust Points Modal */}
      <Modal
        isOpen={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        title="Adjust Garden Points"
        size="small"
        footer={
          <div className="garden-manager__modal-footer">
            <button
              type="button"
              className="button secondary"
              onClick={() => setAdjustTarget(null)}
              disabled={adjusting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              onClick={handleAdjust}
              disabled={!adjustAmount || parseInt(adjustAmount, 10) === 0 || isNaN(parseInt(adjustAmount, 10)) || adjusting}
            >
              {adjusting ? (
                <><i className="fas fa-spinner fa-spin" /> Applying...</>
              ) : (
                <><i className="fas fa-check" /> Apply</>
              )}
            </button>
          </div>
        }
      >
        <div className="garden-manager__adjust-modal">
          {adjustTarget && (
            <div className="garden-manager__current-info">
              <strong>{adjustTarget.display_name || adjustTarget.username || `User #${adjustTarget.userId}`}</strong>
              <span>Current points: <strong>{adjustTarget.points}</strong></span>
            </div>
          )}
          <div className="garden-manager__adjust-input">
            <label>Amount to add/subtract:</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 5 or -3"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              autoFocus
            />
            <span className="garden-manager__adjust-hint">
              Use positive numbers to add, negative to subtract
            </span>
          </div>
          {adjustAmount && !isNaN(parseInt(adjustAmount, 10)) && adjustTarget && (
            <div className="garden-manager__preview">
              New total: <strong>{Math.max(0, adjustTarget.points + parseInt(adjustAmount, 10))}</strong>
            </div>
          )}
        </div>
      </Modal>

      {/* Set Points Modal */}
      <Modal
        isOpen={!!setTarget}
        onClose={() => setSetTarget(null)}
        title="Set Garden Points"
        size="small"
        footer={
          <div className="garden-manager__modal-footer">
            <button
              type="button"
              className="button secondary"
              onClick={() => setSetTarget(null)}
              disabled={setting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              onClick={handleSetPoints}
              disabled={!setAmount || parseInt(setAmount, 10) < 0 || isNaN(parseInt(setAmount, 10)) || setting}
            >
              {setting ? (
                <><i className="fas fa-spinner fa-spin" /> Setting...</>
              ) : (
                <><i className="fas fa-check" /> Set Points</>
              )}
            </button>
          </div>
        }
      >
        <div className="garden-manager__adjust-modal">
          {setTarget && (
            <div className="garden-manager__current-info">
              <strong>{setTarget.display_name || setTarget.username || `User #${setTarget.userId}`}</strong>
              <span>Current points: <strong>{setTarget.points}</strong></span>
            </div>
          )}
          <div className="garden-manager__adjust-input">
            <label>Set points to:</label>
            <input
              type="number"
              className="input"
              min="0"
              placeholder="e.g. 10"
              value={setAmount}
              onChange={(e) => setSetAmount(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </>
  )
}

export default function GardenManagerPage() {
  return (
    <AdminRoute>
      <GardenManagerContent />
    </AdminRoute>
  )
}
