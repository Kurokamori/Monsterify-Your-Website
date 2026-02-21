import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@hooks/useDocumentTitle'
import { AdminRoute } from '@components/common/AdminRoute'
import { AdminTable, type ColumnDef } from '@components/admin/AdminTable'
import { ConfirmModal } from '@components/common/ConfirmModal'
import { Modal } from '@components/common/Modal'
import trainerService from '@services/trainerService'
import userService from '@services/userService'
import type { Trainer } from '@components/trainers/types/Trainer'
import type { AdminUser } from '@services/userService'
import '@styles/admin/trainer-manager.css'

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
// Main Component
// ============================================================================

function TrainerManagerContent() {
  useDocumentTitle('Trainer Manager')

  // Table state
  const [data, setData] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Trainer | null>(null)
  const [forfeitToBazar, setForfeitToBazar] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // Change owner modal state
  const [ownerTarget, setOwnerTarget] = useState<Trainer | null>(null)
  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerResults, setOwnerResults] = useState<AdminUser[]>([])
  const [selectedNewOwner, setSelectedNewOwner] = useState<AdminUser | null>(null)
  const [ownerSearchLoading, setOwnerSearchLoading] = useState(false)
  const [changingOwner, setChangingOwner] = useState(false)
  const ownerSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Fetch trainers ---

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await trainerService.getTrainersPaginated({
        page: currentPage,
        limit: 20,
        search: searchValue || undefined,
        sortBy,
        sortOrder,
      })
      setData(result.trainers)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Error fetching trainers:', err)
      setError('Failed to load trainers.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchValue, sortBy, sortOrder])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- Sort ---

  const handleSortChange = useCallback((field: string) => {
    setSortBy(prev => {
      if (prev === field) {
        setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
        return prev
      }
      setSortOrder('asc')
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

  // --- Delete ---

  const openDeleteModal = useCallback((trainer: Trainer) => {
    setDeleteTarget(trainer)
    setForfeitToBazar(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await trainerService.adminDeleteTrainer(deleteTarget.id, forfeitToBazar)
      setDeleteTarget(null)
      setStatusMsg({ type: 'success', text: result.message ?? 'Trainer deleted' })
      fetchData()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete trainer') })
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, forfeitToBazar, fetchData])

  // --- Change Owner ---

  const openOwnerModal = useCallback((trainer: Trainer) => {
    setOwnerTarget(trainer)
    setOwnerSearch('')
    setOwnerResults([])
    setSelectedNewOwner(null)
  }, [])

  const closeOwnerModal = useCallback(() => {
    setOwnerTarget(null)
    setOwnerSearch('')
    setOwnerResults([])
    setSelectedNewOwner(null)
  }, [])

  // Debounced user search
  useEffect(() => {
    if (!ownerTarget) return

    if (ownerSearchTimeout.current) {
      clearTimeout(ownerSearchTimeout.current)
    }

    if (!ownerSearch.trim()) {
      setOwnerResults([])
      return
    }

    ownerSearchTimeout.current = setTimeout(async () => {
      setOwnerSearchLoading(true)
      try {
        const result = await userService.getAdminUsers({ search: ownerSearch, limit: 10 })
        setOwnerResults(result.users)
      } catch {
        setOwnerResults([])
      } finally {
        setOwnerSearchLoading(false)
      }
    }, 300)

    return () => {
      if (ownerSearchTimeout.current) {
        clearTimeout(ownerSearchTimeout.current)
      }
    }
  }, [ownerSearch, ownerTarget])

  const handleChangeOwner = useCallback(async () => {
    if (!ownerTarget || !selectedNewOwner?.discord_id) return
    setChangingOwner(true)
    try {
      await trainerService.adminChangeOwner(ownerTarget.id, selectedNewOwner.discord_id)
      setStatusMsg({
        type: 'success',
        text: `Owner of "${ownerTarget.name}" changed to ${selectedNewOwner.display_name || selectedNewOwner.username}`,
      })
      closeOwnerModal()
      fetchData()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to change owner') })
    } finally {
      setChangingOwner(false)
    }
  }, [ownerTarget, selectedNewOwner, closeOwnerModal, fetchData])

  // --- Columns ---

  const columns: ColumnDef<Trainer>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      className: 'trainer-manager__id-col',
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (t) => (
        <Link to={`/trainers/${t.id}`} className="trainer-manager__name-link">
          {t.name}
        </Link>
      ),
    },
    {
      key: 'player_display_name',
      header: 'Owner',
      render: (t) => (
        <span className="trainer-manager__owner">
          {t.player_display_name || t.player_username || '—'}
        </span>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      sortable: true,
    },
    {
      key: 'currency_amount',
      header: 'Currency',
      sortable: true,
      render: (t) => (t.currency_amount ?? 0).toLocaleString(),
    },
    {
      key: 'monster_count',
      header: 'Monsters',
      render: (t) => String(t.monster_count ?? 0),
    },
  ]

  // --- Render ---

  return (
    <>
      {/* Status message */}
      {statusMsg && (
        <div className={`trainer-manager__status trainer-manager__status--${statusMsg.type}`}>
          <i className={`fas ${statusMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
          <span>{statusMsg.text}</span>
          <button
            type="button"
            className="trainer-manager__status-dismiss"
            onClick={() => setStatusMsg(null)}
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      <AdminTable<Trainer>
        title="Trainer Manager"
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        error={error}
        onRetry={fetchData}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name or owner..."
        onResetFilters={handleResetFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage="No trainers found"
        actions={(trainer) => (
          <>
            <Link to={`/trainers/${trainer.id}/edit`} className="button sm primary">
              <i className="fas fa-edit" /> Edit
            </Link>
            <button
              className="button sm secondary"
              onClick={() => openOwnerModal(trainer)}
            >
              <i className="fas fa-user-edit" /> Owner
            </button>
            <button
              className="button sm danger"
              onClick={() => openDeleteModal(trainer)}
            >
              <i className="fas fa-trash" />
            </button>
          </>
        )}
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Trainer"
        message={`Are you sure you want to delete trainer "${deleteTarget?.name ?? ''}"?`}
        details={
          <label className="trainer-manager__forfeit-checkbox">
            <input
              type="checkbox"
              checked={forfeitToBazar}
              onChange={(e) => setForfeitToBazar(e.target.checked)}
            />
            Forfeit all monsters and items to the Bazar before deleting
          </label>
        }
        warning="This action is permanent. The trainer and all associated data will be removed."
        confirmText="Delete Trainer"
        variant="danger"
        confirmIcon="fas fa-trash"
        loading={deleting}
      />

      {/* Change Owner Modal */}
      <Modal
        isOpen={!!ownerTarget}
        onClose={closeOwnerModal}
        title="Change Trainer Owner"
        size="small"
        footer={
          <div className="trainer-manager__modal-footer">
            <button
              type="button"
              className="button secondary"
              onClick={closeOwnerModal}
              disabled={changingOwner}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              onClick={handleChangeOwner}
              disabled={!selectedNewOwner || changingOwner}
            >
              {changingOwner ? (
                <><i className="fas fa-spinner fa-spin" /> Changing...</>
              ) : (
                <><i className="fas fa-user-edit" /> Change Owner</>
              )}
            </button>
          </div>
        }
      >
        <div className="trainer-manager__owner-modal">
          {ownerTarget && (
            <div className="trainer-manager__current-owner">
              <strong>Current owner:</strong>{' '}
              {ownerTarget.player_display_name || ownerTarget.player_username || 'Unknown'}
            </div>
          )}

          <div className="trainer-manager__owner-search">
            <label>Search for new owner:</label>
            <input
              type="text"
              className="input"
              placeholder="Search by username or display name..."
              value={ownerSearch}
              onChange={(e) => {
                setOwnerSearch(e.target.value)
                setSelectedNewOwner(null)
              }}
            />
          </div>

          {ownerSearchLoading && (
            <div className="trainer-manager__search-loading">
              <i className="fas fa-spinner fa-spin" /> Searching...
            </div>
          )}

          {ownerResults.length > 0 && (
            <div className="trainer-manager__owner-results">
              {ownerResults.map(user => (
                <button
                  key={user.id}
                  type="button"
                  className={`trainer-manager__owner-result${selectedNewOwner?.id === user.id ? ' trainer-manager__owner-result--selected' : ''}`}
                  onClick={() => setSelectedNewOwner(user)}
                >
                  <span className="trainer-manager__owner-result-name">
                    {user.display_name || user.username}
                  </span>
                  <span className="trainer-manager__owner-result-id">
                    {user.discord_id ?? `ID: ${user.id}`}
                  </span>
                </button>
              ))}
            </div>
          )}

          {ownerSearch.trim() && !ownerSearchLoading && ownerResults.length === 0 && (
            <div className="trainer-manager__no-results">
              No users found matching "{ownerSearch}"
            </div>
          )}

          {selectedNewOwner && (
            <div className="trainer-manager__selected-owner">
              <i className="fas fa-arrow-right" />
              <strong>New owner:</strong>{' '}
              {selectedNewOwner.display_name || selectedNewOwner.username}
              {selectedNewOwner.discord_id && (
                <span className="trainer-manager__owner-result-id"> ({selectedNewOwner.discord_id})</span>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

export default function TrainerManagerPage() {
  return (
    <AdminRoute>
      <TrainerManagerContent />
    </AdminRoute>
  )
}
