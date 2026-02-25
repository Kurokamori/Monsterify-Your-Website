import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@hooks/useDocumentTitle'
import { AdminRoute } from '@components/common/AdminRoute'
import { AdminTable, type ColumnDef } from '@components/admin/AdminTable'
import { ConfirmModal } from '@components/common/ConfirmModal'
import { Modal } from '@components/common/Modal'
import monsterService from '@services/monsterService'
import trainerService from '@services/trainerService'
import adminService from '@services/adminService'
import { AdminMonsterEditModal } from '@components/admin/AdminMonsterEditModal'
import type { Monster } from '@services/monsterService'
import type { Trainer } from '@components/trainers/types/Trainer'
import '@styles/admin/monster-manager.css'

// ============================================================================
// Constants
// ============================================================================

const MONSTER_TYPES = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy']

const SPECIAL_ATTRIBUTES = ['Shiny', 'Alpha', 'Shadow', 'Paradox', 'Pokerus']

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

function MonsterManagerContent() {
  useDocumentTitle('Monster Manager')

  // Table state
  const [data, setData] = useState<Monster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter state
  const [searchValue, setSearchValue] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [attributeFilter, setAttributeFilter] = useState('')

  // Trainer autocomplete filter
  const [trainerFilter, setTrainerFilter] = useState<Trainer | null>(null)
  const [trainerFilterSearch, setTrainerFilterSearch] = useState('')
  const [trainerFilterResults, setTrainerFilterResults] = useState<Trainer[]>([])
  const [trainerFilterLoading, setTrainerFilterLoading] = useState(false)
  const [trainerFilterOpen, setTrainerFilterOpen] = useState(false)
  const trainerFilterTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trainerFilterRef = useRef<HTMLDivElement>(null)

  // Filter dropdown options (fetched on mount)
  const [typeOptions, setTypeOptions] = useState<string[]>([])
  const [attributeOptions, setAttributeOptions] = useState<string[]>([])

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Monster | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Forfeit modal state
  const [forfeitTarget, setForfeitTarget] = useState<Monster | null>(null)
  const [forfeiting, setForfeiting] = useState(false)

  // Change owner modal state
  const [ownerTarget, setOwnerTarget] = useState<Monster | null>(null)
  const [trainerSearch, setTrainerSearch] = useState('')
  const [trainerResults, setTrainerResults] = useState<Trainer[]>([])
  const [selectedNewTrainer, setSelectedNewTrainer] = useState<Trainer | null>(null)
  const [trainerSearchLoading, setTrainerSearchLoading] = useState(false)
  const [changingOwner, setChangingOwner] = useState(false)
  const trainerSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Add Monster modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    species1: '', species2: '', species3: '',
    type1: '', type2: '', type3: '', type4: '', type5: '',
    attribute: '', name: '', level: 1,
  })
  const [addTrainer, setAddTrainer] = useState<Trainer | null>(null)
  const [addTrainerSearch, setAddTrainerSearch] = useState('')
  const [addTrainerResults, setAddTrainerResults] = useState<Trainer[]>([])
  const [addTrainerLoading, setAddTrainerLoading] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const addTrainerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Admin Edit modal state
  const [adminEditTarget, setAdminEditTarget] = useState<Monster | null>(null)

  // --- Fetch filter options on mount ---

  useEffect(() => {
    monsterService.adminGetFilterOptions().then(({ types, attributes }) => {
      setTypeOptions(types)
      setAttributeOptions(attributes)
    }).catch(() => { /* ignore */ })
  }, [])

  // --- Fetch monsters ---

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await monsterService.adminGetMonstersPaginated({
        page: currentPage,
        limit: 20,
        search: searchValue || undefined,
        sortBy,
        sortOrder,
        trainerId: trainerFilter?.id || undefined,
        type: typeFilter || undefined,
        attribute: attributeFilter || undefined,
      })
      setData(result.monsters ?? [])
      setTotalPages(result.totalPages ?? 1)
    } catch (err) {
      console.error('Error fetching monsters:', err)
      setError('Failed to load monsters.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchValue, sortBy, sortOrder, trainerFilter, typeFilter, attributeFilter])

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

  const hasActiveFilters = !!searchValue || !!trainerFilter || !!typeFilter || !!attributeFilter

  const handleResetFilters = useCallback(() => {
    setSearchValue('')
    setTypeFilter('')
    setAttributeFilter('')
    setTrainerFilter(null)
    setTrainerFilterSearch('')
    setTrainerFilterResults([])
    setCurrentPage(1)
  }, [])

  // --- Trainer autocomplete filter ---

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (trainerFilterRef.current && !trainerFilterRef.current.contains(e.target as Node)) {
        setTrainerFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced trainer filter search
  useEffect(() => {
    if (trainerFilterTimeout.current) {
      clearTimeout(trainerFilterTimeout.current)
    }

    if (!trainerFilterSearch.trim()) {
      setTrainerFilterResults([])
      return
    }

    trainerFilterTimeout.current = setTimeout(async () => {
      setTrainerFilterLoading(true)
      try {
        const result = await trainerService.getTrainersPaginated({
          search: trainerFilterSearch,
          limit: 10,
        })
        setTrainerFilterResults(result.trainers)
        setTrainerFilterOpen(true)
      } catch {
        setTrainerFilterResults([])
      } finally {
        setTrainerFilterLoading(false)
      }
    }, 300)

    return () => {
      if (trainerFilterTimeout.current) {
        clearTimeout(trainerFilterTimeout.current)
      }
    }
  }, [trainerFilterSearch])

  const selectTrainerFilter = useCallback((trainer: Trainer) => {
    setTrainerFilter(trainer)
    setTrainerFilterSearch('')
    setTrainerFilterResults([])
    setTrainerFilterOpen(false)
    setCurrentPage(1)
  }, [])

  const clearTrainerFilter = useCallback(() => {
    setTrainerFilter(null)
    setTrainerFilterSearch('')
    setTrainerFilterResults([])
    setCurrentPage(1)
  }, [])

  // --- Delete ---

  const openDeleteModal = useCallback((monster: Monster) => {
    setDeleteTarget(monster)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await monsterService.adminDeleteMonster(deleteTarget.id, false)
      setDeleteTarget(null)
      setStatusMsg({ type: 'success', text: result.message ?? 'Monster deleted' })
      fetchData()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete monster') })
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, fetchData])

  // --- Forfeit ---

  const openForfeitModal = useCallback((monster: Monster) => {
    setForfeitTarget(monster)
  }, [])

  const handleForfeit = useCallback(async () => {
    if (!forfeitTarget) return
    setForfeiting(true)
    try {
      const result = await monsterService.adminDeleteMonster(forfeitTarget.id, true)
      setForfeitTarget(null)
      setStatusMsg({ type: 'success', text: result.message ?? 'Monster forfeited to Bazar' })
      fetchData()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to forfeit monster') })
    } finally {
      setForfeiting(false)
    }
  }, [forfeitTarget, fetchData])

  // --- Change Owner ---

  const openOwnerModal = useCallback((monster: Monster) => {
    setOwnerTarget(monster)
    setTrainerSearch('')
    setTrainerResults([])
    setSelectedNewTrainer(null)
  }, [])

  const closeOwnerModal = useCallback(() => {
    setOwnerTarget(null)
    setTrainerSearch('')
    setTrainerResults([])
    setSelectedNewTrainer(null)
  }, [])

  // Debounced trainer search (for change-owner modal)
  useEffect(() => {
    if (!ownerTarget) return

    if (trainerSearchTimeout.current) {
      clearTimeout(trainerSearchTimeout.current)
    }

    if (!trainerSearch.trim()) {
      setTrainerResults([])
      return
    }

    trainerSearchTimeout.current = setTimeout(async () => {
      setTrainerSearchLoading(true)
      try {
        const result = await trainerService.getTrainersPaginated({
          search: trainerSearch,
          limit: 10,
        })
        setTrainerResults(result.trainers)
      } catch {
        setTrainerResults([])
      } finally {
        setTrainerSearchLoading(false)
      }
    }, 300)

    return () => {
      if (trainerSearchTimeout.current) {
        clearTimeout(trainerSearchTimeout.current)
      }
    }
  }, [trainerSearch, ownerTarget])

  const handleChangeOwner = useCallback(async () => {
    if (!ownerTarget || !selectedNewTrainer) return
    setChangingOwner(true)
    try {
      await monsterService.adminChangeMonsterOwner(ownerTarget.id, selectedNewTrainer.id)
      setStatusMsg({
        type: 'success',
        text: `Monster "${ownerTarget.name ?? ownerTarget.id}" transferred to trainer "${selectedNewTrainer.name}"`,
      })
      closeOwnerModal()
      fetchData()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to change owner') })
    } finally {
      setChangingOwner(false)
    }
  }, [ownerTarget, selectedNewTrainer, closeOwnerModal, fetchData])

  // --- Add Monster ---

  const openAddModal = useCallback(() => {
    setShowAddModal(true)
    setAddForm({ species1: '', species2: '', species3: '', type1: '', type2: '', type3: '', type4: '', type5: '', attribute: '', name: '', level: 1 })
    setAddTrainer(null)
    setAddTrainerSearch('')
    setAddTrainerResults([])
  }, [])

  const closeAddModal = useCallback(() => {
    setShowAddModal(false)
  }, [])

  // Debounced trainer search for add modal
  useEffect(() => {
    if (!showAddModal) return
    if (addTrainerTimeout.current) clearTimeout(addTrainerTimeout.current)
    if (!addTrainerSearch.trim()) { setAddTrainerResults([]); return }
    addTrainerTimeout.current = setTimeout(async () => {
      setAddTrainerLoading(true)
      try {
        const result = await trainerService.getTrainersPaginated({ search: addTrainerSearch, limit: 10 })
        setAddTrainerResults(result.trainers)
      } catch { setAddTrainerResults([]) }
      finally { setAddTrainerLoading(false) }
    }, 300)
    return () => { if (addTrainerTimeout.current) clearTimeout(addTrainerTimeout.current) }
  }, [addTrainerSearch, showAddModal])

  const updateAddForm = useCallback((field: string, value: string | number) => {
    setAddForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const rollRandomType = useCallback((field: string) => {
    const t = MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)]
    setAddForm(prev => ({ ...prev, [field]: t }))
  }, [])

  const rollRandomAttribute = useCallback(() => {
    const a = SPECIAL_ATTRIBUTES[Math.floor(Math.random() * SPECIAL_ATTRIBUTES.length)]
    setAddForm(prev => ({ ...prev, attribute: a }))
  }, [])

  const handleAddMonster = useCallback(async () => {
    if (!addTrainer || !addForm.species1 || !addForm.type1) return
    setAddSubmitting(true)
    try {
      await adminService.createAndInitializeMonster({
        trainer_id: addTrainer.id,
        name: addForm.name || addForm.species1,
        species1: addForm.species1,
        species2: addForm.species2 || null,
        species3: addForm.species3 || null,
        type1: addForm.type1,
        type2: addForm.type2 || null,
        type3: addForm.type3 || null,
        type4: addForm.type4 || null,
        type5: addForm.type5 || null,
        attribute: addForm.attribute || null,
        level: addForm.level,
      })
      setStatusMsg({ type: 'success', text: `Monster "${addForm.name || addForm.species1}" created successfully!` })
      closeAddModal()
      fetchData()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to create monster') })
    } finally {
      setAddSubmitting(false)
    }
  }, [addTrainer, addForm, closeAddModal, fetchData])

  // --- Columns ---

  const columns: ColumnDef<Monster>[] = [
    {
      key: 'id',
      header: 'ID',
      sortable: true,
      className: 'monster-manager__id-col',
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (m) => (
        <Link to={`/monsters/${m.id}`} className="monster-manager__name-link">
          {m.name ?? '—'}
        </Link>
      ),
    },
    {
      key: 'species1',
      header: 'Species',
      sortable: true,
      render: (m) => (
        <span className="monster-manager__species">
          {m.species1 ?? '—'}
          {m.species2 && <span className="monster-manager__species-secondary"> / {m.species2}</span>}
        </span>
      ),
    },
    {
      key: 'type1',
      header: 'Type',
      sortable: true,
      render: (m) => (
        <span className="monster-manager__types">
          {m.type1 && <span className="monster-manager__type-badge">{m.type1}</span>}
          {m.type2 && <span className="monster-manager__type-badge">{m.type2}</span>}
        </span>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      sortable: true,
    },
    {
      key: 'trainer_name',
      header: 'Trainer',
      sortable: true,
      render: (m) => {
        const trainerName = (m as Record<string, unknown>).trainer_name as string | undefined
        const trainerId = m.trainer_id
        if (!trainerName) return '—'
        return (
          <Link to={`/trainers/${trainerId}`} className="monster-manager__trainer-link">
            {trainerName}
          </Link>
        )
      },
    },
  ]

  // --- Render ---

  return (
    <>
      {/* Status message */}
      {statusMsg && (
        <div className={`monster-manager__status monster-manager__status--${statusMsg.type}`}>
          <i className={`fas ${statusMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
          <span>{statusMsg.text}</span>
          <button
            type="button"
            className="monster-manager__status-dismiss"
            onClick={() => setStatusMsg(null)}
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {/* Custom filter bar */}
      <div className="monster-manager__filters">
        {/* Row 1: Search + Type + Attribute + Reset */}
        <div className="monster-manager__filters-row">
          <div className="monster-manager__search-wrap">
            <i className="fas fa-search monster-manager__search-icon" />
            <input
              type="text"
              className="input monster-manager__search-input"
              placeholder="Search by name, species, or trainer..."
              value={searchValue}
              onChange={(e) => { setSearchValue(e.target.value); setCurrentPage(1) }}
            />
            {searchValue && (
              <button
                type="button"
                className="monster-manager__search-clear"
                onClick={() => { setSearchValue(''); setCurrentPage(1) }}
                aria-label="Clear search"
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          <select
            className="select monster-manager__filter-select"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1) }}
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            {typeOptions.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            className="select monster-manager__filter-select"
            value={attributeFilter}
            onChange={(e) => { setAttributeFilter(e.target.value); setCurrentPage(1) }}
            aria-label="Filter by attribute"
          >
            <option value="">All Attributes</option>
            {attributeOptions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button className="button secondary sm" onClick={handleResetFilters}>
              Reset Filters
            </button>
          )}
        </div>

        {/* Row 2: Trainer autocomplete */}
        <div className="monster-manager__filters-row" ref={trainerFilterRef}>
          <label className="monster-manager__trainer-filter-label">
            <i className="fas fa-user" /> Trainer:
          </label>
          {trainerFilter ? (
            <div className="monster-manager__trainer-filter-chip">
              <span>{trainerFilter.name}</span>
              <button
                type="button"
                className="monster-manager__trainer-filter-clear"
                onClick={clearTrainerFilter}
                aria-label="Clear trainer filter"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          ) : (
            <div className="monster-manager__trainer-filter-input-wrap">
              <input
                type="text"
                className="input monster-manager__trainer-filter-input"
                placeholder="Type to search trainers..."
                value={trainerFilterSearch}
                onChange={(e) => setTrainerFilterSearch(e.target.value)}
                onFocus={() => {
                  if (trainerFilterResults.length > 0) setTrainerFilterOpen(true)
                }}
              />
              {trainerFilterLoading && (
                <span className="monster-manager__trainer-filter-spinner">
                  <i className="fas fa-spinner fa-spin" />
                </span>
              )}
              {trainerFilterOpen && trainerFilterResults.length > 0 && (
                <div className="monster-manager__trainer-filter-dropdown">
                  {trainerFilterResults.map(trainer => (
                    <button
                      key={trainer.id}
                      type="button"
                      className="monster-manager__trainer-filter-option"
                      onClick={() => selectTrainerFilter(trainer)}
                    >
                      <span className="monster-manager__trainer-filter-option-name">
                        {trainer.name}
                      </span>
                      <span className="monster-manager__trainer-filter-option-owner">
                        {trainer.player_display_name || trainer.player_username || ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="monster-manager__add-bar">
        <button className="button primary" onClick={openAddModal}>
          <i className="fas fa-plus" /> Add Monster to Trainer
        </button>
      </div>

      <AdminTable<Monster>
        title="Monster Manager"
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        loading={loading}
        error={error}
        onRetry={fetchData}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage="No monsters found"
        actions={(monster) => (
          <>
            <Link to={`/monsters/${monster.id}/edit`} className="button sm primary">
              <i className="fas fa-edit" /> Edit
            </Link>
            <button
              className="button sm primary monster-manager__admin-edit-btn"
              onClick={() => setAdminEditTarget(monster)}
            >
              <i className="fas fa-wrench" /> Admin Edit
            </button>
            <button
              className="button sm secondary"
              onClick={() => openOwnerModal(monster)}
            >
              <i className="fas fa-exchange-alt" /> Owner
            </button>
            <button
              className="button sm warning"
              onClick={() => openForfeitModal(monster)}
            >
              <i className="fas fa-store" /> Forfeit
            </button>
            <button
              className="button sm danger"
              onClick={() => openDeleteModal(monster)}
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
        title="Delete Monster"
        message={`Are you sure you want to delete monster "${deleteTarget?.name ?? ''}"?`}
        warning="This action is permanent. The monster will be removed from the database."
        confirmText="Delete Monster"
        variant="danger"
        confirmIcon="fas fa-trash"
        loading={deleting}
      />

      {/* Forfeit Modal */}
      <ConfirmModal
        isOpen={!!forfeitTarget}
        onClose={() => setForfeitTarget(null)}
        onConfirm={handleForfeit}
        title="Forfeit to Bazar"
        message={`Forfeit monster "${forfeitTarget?.name ?? ''}" to the Bazar?`}
        details={
          <p className="monster-manager__forfeit-detail">
            The monster will be sent to the Bazar where it can be adopted by another trainer.
          </p>
        }
        warning="The monster will be removed from its current trainer."
        confirmText="Forfeit to Bazar"
        variant="warning"
        confirmIcon="fas fa-store"
        loading={forfeiting}
      />

      {/* Change Owner Modal */}
      <Modal
        isOpen={!!ownerTarget}
        onClose={closeOwnerModal}
        title="Change Monster Owner"
        size="small"
        footer={
          <div className="monster-manager__modal-footer">
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
              disabled={!selectedNewTrainer || changingOwner}
            >
              {changingOwner ? (
                <><i className="fas fa-spinner fa-spin" /> Transferring...</>
              ) : (
                <><i className="fas fa-exchange-alt" /> Transfer Monster</>
              )}
            </button>
          </div>
        }
      >
        <div className="monster-manager__owner-modal">
          {ownerTarget && (
            <div className="monster-manager__current-owner">
              <strong>Current trainer:</strong>{' '}
              {(ownerTarget as Record<string, unknown>).trainer_name as string || 'Unknown'}
            </div>
          )}

          <div className="monster-manager__owner-search">
            <label>Search for new trainer:</label>
            <input
              type="text"
              className="input"
              placeholder="Search by trainer name..."
              value={trainerSearch}
              onChange={(e) => {
                setTrainerSearch(e.target.value)
                setSelectedNewTrainer(null)
              }}
            />
          </div>

          {trainerSearchLoading && (
            <div className="monster-manager__search-loading">
              <i className="fas fa-spinner fa-spin" /> Searching...
            </div>
          )}

          {trainerResults.length > 0 && (
            <div className="monster-manager__owner-results">
              {trainerResults.map(trainer => (
                <button
                  key={trainer.id}
                  type="button"
                  className={`monster-manager__owner-result${selectedNewTrainer?.id === trainer.id ? ' monster-manager__owner-result--selected' : ''}`}
                  onClick={() => setSelectedNewTrainer(trainer)}
                >
                  <span className="monster-manager__owner-result-name">
                    {trainer.name}
                  </span>
                  <span className="monster-manager__owner-result-id">
                    {trainer.player_display_name || trainer.player_username || `ID: ${trainer.id}`}
                  </span>
                </button>
              ))}
            </div>
          )}

          {trainerSearch.trim() && !trainerSearchLoading && trainerResults.length === 0 && (
            <div className="monster-manager__no-results">
              No trainers found matching &quot;{trainerSearch}&quot;
            </div>
          )}

          {selectedNewTrainer && (
            <div className="monster-manager__selected-owner">
              <i className="fas fa-arrow-right" />
              <strong>New trainer:</strong>{' '}
              {selectedNewTrainer.name}
              {selectedNewTrainer.player_display_name && (
                <span className="monster-manager__owner-result-id"> ({selectedNewTrainer.player_display_name})</span>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Admin Edit Modal */}
      <AdminMonsterEditModal
        monster={adminEditTarget}
        isOpen={!!adminEditTarget}
        onClose={() => setAdminEditTarget(null)}
        onSuccess={(msg) => { setStatusMsg({ type: 'success', text: msg }); fetchData() }}
        onError={(msg) => setStatusMsg({ type: 'error', text: msg })}
      />

      {/* Add Monster Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={closeAddModal}
        title="Add Monster to Trainer"
        size="medium"
        footer={
          <div className="monster-manager__modal-footer">
            <button type="button" className="button secondary" onClick={closeAddModal} disabled={addSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              onClick={handleAddMonster}
              disabled={!addTrainer || !addForm.species1 || !addForm.type1 || addSubmitting}
            >
              {addSubmitting ? (
                <><i className="fas fa-spinner fa-spin" /> Creating...</>
              ) : (
                <><i className="fas fa-plus" /> Create Monster</>
              )}
            </button>
          </div>
        }
      >
        <div className="monster-manager__add-modal">
          {/* Trainer search */}
          <div className="monster-manager__add-field">
            <label>Trainer <span className="monster-manager__required">*</span></label>
            {addTrainer ? (
              <div className="monster-manager__trainer-filter-chip">
                <span>{addTrainer.name}</span>
                <button type="button" className="monster-manager__trainer-filter-clear" onClick={() => { setAddTrainer(null); setAddTrainerSearch('') }}>
                  <i className="fas fa-times" />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  className="input"
                  placeholder="Search for a trainer..."
                  value={addTrainerSearch}
                  onChange={(e) => setAddTrainerSearch(e.target.value)}
                />
                {addTrainerLoading && <span className="monster-manager__search-loading"><i className="fas fa-spinner fa-spin" /> Searching...</span>}
                {addTrainerResults.length > 0 && (
                  <div className="monster-manager__owner-results">
                    {addTrainerResults.map(t => (
                      <button key={t.id} type="button" className="monster-manager__owner-result" onClick={() => { setAddTrainer(t); setAddTrainerSearch(''); setAddTrainerResults([]) }}>
                        <span className="monster-manager__owner-result-name">{t.name}</span>
                        <span className="monster-manager__owner-result-id">{t.player_display_name || t.player_username || `ID: ${t.id}`}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Species */}
          <div className="monster-manager__add-field">
            <label>Species 1 <span className="monster-manager__required">*</span></label>
            <input type="text" className="input" value={addForm.species1} onChange={(e) => updateAddForm('species1', e.target.value)} placeholder="e.g. Pikachu" />
          </div>
          <div className="monster-manager__add-row">
            <div className="monster-manager__add-field">
              <label>Species 2</label>
              <input type="text" className="input" value={addForm.species2} onChange={(e) => updateAddForm('species2', e.target.value)} />
            </div>
            <div className="monster-manager__add-field">
              <label>Species 3</label>
              <input type="text" className="input" value={addForm.species3} onChange={(e) => updateAddForm('species3', e.target.value)} />
            </div>
          </div>

          {/* Types */}
          {(['type1', 'type2', 'type3', 'type4', 'type5'] as const).map((field, i) => (
            <div className="monster-manager__add-field" key={field}>
              <label>Type {i + 1} {i === 0 && <span className="monster-manager__required">*</span>}</label>
              <div className="monster-manager__add-inline">
                <select className="select" value={addForm[field]} onChange={(e) => updateAddForm(field, e.target.value)}>
                  <option value="">— Select —</option>
                  {MONSTER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="button" className="button sm secondary" onClick={() => rollRandomType(field)}>
                  <i className="fas fa-dice" /> Roll
                </button>
              </div>
            </div>
          ))}

          {/* Attribute */}
          <div className="monster-manager__add-field">
            <label>Attribute</label>
            <div className="monster-manager__add-inline">
              <input type="text" className="input" value={addForm.attribute} onChange={(e) => updateAddForm('attribute', e.target.value)} placeholder="e.g. Shiny" />
              <button type="button" className="button sm secondary" onClick={rollRandomAttribute}>
                <i className="fas fa-dice" /> Roll
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="monster-manager__add-field">
            <label>Name</label>
            <input type="text" className="input" value={addForm.name} onChange={(e) => updateAddForm('name', e.target.value)} placeholder={addForm.species1 || 'Defaults to Species 1'} />
          </div>

          {/* Level */}
          <div className="monster-manager__add-field">
            <label>Level</label>
            <input type="number" className="input" value={addForm.level} min={1} max={100} onChange={(e) => updateAddForm('level', Math.max(1, Math.min(100, Number(e.target.value) || 1)))} />
          </div>
        </div>
      </Modal>
    </>
  )
}

export default function MonsterManagerPage() {
  return (
    <AdminRoute>
      <MonsterManagerContent />
    </AdminRoute>
  )
}
