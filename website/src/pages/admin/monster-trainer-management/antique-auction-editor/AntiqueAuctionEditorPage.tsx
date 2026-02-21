import { useState, useEffect, useCallback, useRef } from 'react'
import { useDocumentTitle } from '@hooks/useDocumentTitle'
import { ConfirmModal, useConfirmModal, LoadingSpinner } from '@components/common'
import antiqueService from '@services/antiqueService'
import type { AdminAntiqueAuction, AntiqueDropdownItem } from '@services/antiqueService'

// ============================================================================
// Constants
// ============================================================================

const ALL_TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
]

const EMPTY_FORM: AuctionFormState = {
  name: '',
  antique: '',
  image: '',
  species1: '',
  species2: '',
  species3: '',
  type1: '',
  type2: '',
  type3: '',
  type4: '',
  type5: '',
  attribute: '',
  description: '',
  family: '',
  creator: '',
}

// ============================================================================
// Types
// ============================================================================

interface AuctionFormState {
  name: string
  antique: string
  image: string
  species1: string
  species2: string
  species3: string
  type1: string
  type2: string
  type3: string
  type4: string
  type5: string
  attribute: string
  description: string
  family: string
  creator: string
}

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

function auctionToForm(a: AdminAntiqueAuction): AuctionFormState {
  return {
    name: a.name,
    antique: a.antique,
    image: a.image ?? '',
    species1: a.species1,
    species2: a.species2 ?? '',
    species3: a.species3 ?? '',
    type1: a.type1,
    type2: a.type2 ?? '',
    type3: a.type3 ?? '',
    type4: a.type4 ?? '',
    type5: a.type5 ?? '',
    attribute: a.attribute ?? '',
    description: a.description ?? '',
    family: a.family ?? '',
    creator: a.creator ?? '',
  }
}

function formToPayload(form: AuctionFormState): Record<string, unknown> {
  return {
    name: form.name.trim(),
    antique: form.antique,
    image: form.image.trim() || null,
    species1: form.species1.trim(),
    species2: form.species2.trim() || null,
    species3: form.species3.trim() || null,
    type1: form.type1,
    type2: form.type2 || null,
    type3: form.type3 || null,
    type4: form.type4 || null,
    type5: form.type5 || null,
    attribute: form.attribute.trim() || null,
    description: form.description.trim() || null,
    family: form.family.trim() || null,
    creator: form.creator.trim() || null,
  }
}

function getSpeciesDisplay(a: AdminAntiqueAuction): string {
  return [a.species1, a.species2, a.species3].filter(Boolean).join(' / ')
}

function getTypesList(a: AdminAntiqueAuction): string[] {
  return [a.type1, a.type2, a.type3, a.type4, a.type5].filter((t): t is string => !!t)
}

// ============================================================================
// Main Component
// ============================================================================

export default function AntiqueAuctionEditorPage() {
  useDocumentTitle('Antique Auction Editor')

  const [auctions, setAuctions] = useState<AdminAntiqueAuction[]>([])
  const [antiqueOptions, setAntiqueOptions] = useState<AntiqueDropdownItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters
  const [filterAntique, setFilterAntique] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Form
  const [editingAuction, setEditingAuction] = useState<AdminAntiqueAuction | null>(null)
  const [creatingAuction, setCreatingAuction] = useState(false)
  const [form, setForm] = useState<AuctionFormState>({ ...EMPTY_FORM })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const confirmModal = useConfirmModal()

  // --- Load data ---

  const loadAuctions = useCallback(async () => {
    try {
      const res = await antiqueService.getAntiqueAuctions()
      setAuctions(res.data ?? res)
    } catch (err) {
      console.error('Failed to load auctions:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAntiqueOptions = useCallback(async () => {
    try {
      const res = await antiqueService.getAllAntiquesDropdown()
      setAntiqueOptions(res.data ?? res)
    } catch (err) {
      console.error('Failed to load antique options:', err)
    }
  }, [])

  useEffect(() => {
    loadAuctions()
    loadAntiqueOptions()
  }, [loadAuctions, loadAntiqueOptions])

  // --- Filtering ---

  const filteredAuctions = auctions.filter(a => {
    if (filterAntique && a.antique !== filterAntique) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const searchable = [a.name, a.species1, a.species2, a.species3, a.creator]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  })

  // --- Form handlers ---

  const updateField = useCallback(<K extends keyof AuctionFormState>(key: K, value: AuctionFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleStartCreate = () => {
    setEditingAuction(null)
    setCreatingAuction(true)
    setForm({ ...EMPTY_FORM })
    setStatusMsg(null)
  }

  const handleStartEdit = (auction: AdminAntiqueAuction) => {
    setCreatingAuction(false)
    setEditingAuction(auction)
    setForm(auctionToForm(auction))
    setStatusMsg(null)
  }

  const handleCancelForm = () => {
    setCreatingAuction(false)
    setEditingAuction(null)
  }

  // --- Image upload ---

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setStatusMsg(null)
    try {
      const res = await antiqueService.uploadImage(file)
      const url = res.data?.url ?? res.url
      if (url) {
        updateField('image', url)
        setStatusMsg({ type: 'success', text: 'Image uploaded' })
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Image upload failed') })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // --- Save ---

  const handleSave = async () => {
    if (!form.name.trim()) {
      setStatusMsg({ type: 'error', text: 'Name is required' })
      return
    }
    if (!form.antique) {
      setStatusMsg({ type: 'error', text: 'Antique is required' })
      return
    }
    if (!form.species1.trim()) {
      setStatusMsg({ type: 'error', text: 'Species 1 is required' })
      return
    }
    if (!form.type1) {
      setStatusMsg({ type: 'error', text: 'Type 1 is required' })
      return
    }
    if (!form.creator.trim()) {
      setStatusMsg({ type: 'error', text: 'Creator is required' })
      return
    }

    setSaving(true)
    setStatusMsg(null)
    try {
      const payload = formToPayload(form)
      if (editingAuction) {
        await antiqueService.updateAntiqueAuction(editingAuction.id, payload)
        setStatusMsg({ type: 'success', text: 'Auction updated' })
        setEditingAuction(null)
      } else {
        await antiqueService.createAntiqueAuction(payload)
        setStatusMsg({ type: 'success', text: 'Auction created' })
        setCreatingAuction(false)
      }
      await loadAuctions()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save auction') })
    } finally {
      setSaving(false)
    }
  }

  // --- Delete ---

  const handleDelete = (auction: AdminAntiqueAuction) => {
    confirmModal.confirmDanger(
      `Delete auction "${auction.name}"? This cannot be undone.`,
      async () => {
        setSaving(true)
        try {
          await antiqueService.deleteAntiqueAuction(auction.id)
          setStatusMsg({ type: 'success', text: 'Auction deleted' })
          if (editingAuction?.id === auction.id) setEditingAuction(null)
          await loadAuctions()
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete auction') })
        } finally {
          setSaving(false)
        }
      },
    )
  }

  // --- Unique antiques for filter dropdown ---

  const uniqueAntiques = [...new Set(auctions.map(a => a.antique))].sort()

  const isFormOpen = creatingAuction || editingAuction !== null

  // --- Render ---

  if (loading) {
    return (
      <div className="main-container">
        <h1>Antique Auction Editor</h1>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="main-container">
      <h1>Antique Auction Editor</h1>

      <div className="aae__panel">
        {/* Toolbar */}
        <div className="aae__toolbar">
          <div className="aae__filters">
            <select
              className="aae__select"
              value={filterAntique}
              onChange={(e) => setFilterAntique(e.target.value)}
            >
              <option value="">All Antiques</option>
              {uniqueAntiques.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <input
              type="text"
              className="aae__search"
              placeholder="Search name, species, creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="button primary"
            onClick={handleStartCreate}
          >
            <i className="fas fa-plus" /> New Auction
          </button>
        </div>

        {/* Status message */}
        {statusMsg && (
          <div className={`aae__status aae__status--${statusMsg.type}`}>
            <i className={`fas ${statusMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
            <span>{statusMsg.text}</span>
            <button
              type="button"
              className="aae__status-dismiss"
              onClick={() => setStatusMsg(null)}
            >
              <i className="fas fa-times" />
            </button>
          </div>
        )}

        {/* Form panel */}
        {isFormOpen && (
          <div className="aae__form-panel">
            <h3>{editingAuction ? `Edit: ${editingAuction.name}` : 'Create New Auction'}</h3>

            {/* Image section */}
            <div className="aae__image-section">
              {form.image && (
                <img
                  src={form.image}
                  alt="Auction preview"
                  className="aae__image-preview"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <div className="aae__image-upload">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-upload'}`} />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                {form.image && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => updateField('image', '')}
                  >
                    <i className="fas fa-times" /> Remove
                  </button>
                )}
              </div>
            </div>

            {/* Required fields */}
            <div className="aae__form-row">
              <div className="aae__field aae__field--grow">
                <label>Name <span className="aae__required">*</span></label>
                <input
                  type="text"
                  className="aae__input"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Auction name"
                />
              </div>
              <div className="aae__field aae__field--grow">
                <label>Antique <span className="aae__required">*</span></label>
                <select
                  className="aae__input"
                  value={form.antique}
                  onChange={(e) => updateField('antique', e.target.value)}
                >
                  <option value="">Select antique...</option>
                  {antiqueOptions.map(opt => (
                    <option key={opt.name} value={opt.name}>
                      {opt.name} ({opt.holiday} — {opt.category})
                    </option>
                  ))}
                </select>
              </div>
              <div className="aae__field aae__field--grow">
                <label>Creator <span className="aae__required">*</span></label>
                <input
                  type="text"
                  className="aae__input"
                  value={form.creator}
                  onChange={(e) => updateField('creator', e.target.value)}
                  placeholder="Creator name"
                />
              </div>
            </div>

            {/* Species */}
            <div className="aae__form-row">
              <div className="aae__field aae__field--grow">
                <label>Species 1 <span className="aae__required">*</span></label>
                <input
                  type="text"
                  className="aae__input"
                  value={form.species1}
                  onChange={(e) => updateField('species1', e.target.value)}
                  placeholder="Primary species"
                />
              </div>
              <div className="aae__field aae__field--grow">
                <label>Species 2</label>
                <input
                  type="text"
                  className="aae__input"
                  value={form.species2}
                  onChange={(e) => updateField('species2', e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="aae__field aae__field--grow">
                <label>Species 3</label>
                <input
                  type="text"
                  className="aae__input"
                  value={form.species3}
                  onChange={(e) => updateField('species3', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Types */}
            <div className="aae__form-row">
              <div className="aae__field">
                <label>Type 1 <span className="aae__required">*</span></label>
                <select
                  className="aae__input"
                  value={form.type1}
                  onChange={(e) => updateField('type1', e.target.value)}
                >
                  <option value="">Select...</option>
                  {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="aae__field">
                <label>Type 2</label>
                <select
                  className="aae__input"
                  value={form.type2}
                  onChange={(e) => updateField('type2', e.target.value)}
                >
                  <option value="">None</option>
                  {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="aae__field">
                <label>Type 3</label>
                <select
                  className="aae__input"
                  value={form.type3}
                  onChange={(e) => updateField('type3', e.target.value)}
                >
                  <option value="">None</option>
                  {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="aae__field">
                <label>Type 4</label>
                <select
                  className="aae__input"
                  value={form.type4}
                  onChange={(e) => updateField('type4', e.target.value)}
                >
                  <option value="">None</option>
                  {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="aae__field">
                <label>Type 5</label>
                <select
                  className="aae__input"
                  value={form.type5}
                  onChange={(e) => updateField('type5', e.target.value)}
                >
                  <option value="">None</option>
                  {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Attribute, Family, Description */}
            <div className="aae__form-row">
              <div className="aae__field aae__field--grow">
                <label>Attribute</label>
                <input
                  type="text"
                  className="aae__input"
                  value={form.attribute}
                  onChange={(e) => updateField('attribute', e.target.value)}
                  placeholder="e.g. Shiny, Albino..."
                />
              </div>
              <div className="aae__field aae__field--grow">
                <label>Family</label>
                <input
                  type="text"
                  className="aae__input"
                  value={form.family}
                  onChange={(e) => updateField('family', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="aae__field aae__field--full">
              <label>Description</label>
              <textarea
                className="aae__textarea"
                rows={3}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Optional description..."
              />
            </div>

            {/* Form actions */}
            <div className="aae__form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={handleCancelForm}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <><i className="fas fa-spinner fa-spin" /> Saving...</>
                ) : (
                  <><i className="fas fa-save" /> {editingAuction ? 'Update' : 'Create'}</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {filteredAuctions.length === 0 ? (
          <div className="aae__empty">
            <i className="fas fa-gavel" />
            <p>{auctions.length === 0 ? 'No auctions yet. Create your first one!' : 'No auctions match your filters.'}</p>
          </div>
        ) : (
          <>
            <div className="aae__table-container">
              <table className="aae__table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Antique</th>
                    <th>Species</th>
                    <th>Types</th>
                    <th>Attribute</th>
                    <th>Creator</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuctions.map(auction => (
                    <tr
                      key={auction.id}
                      className={editingAuction?.id === auction.id ? 'aae__row--active' : ''}
                    >
                      <td>
                        {auction.image ? (
                          <img
                            src={auction.image}
                            alt={auction.name}
                            className="aae__thumb"
                          />
                        ) : (
                          <div className="aae__thumb aae__thumb--empty">
                            <i className="fas fa-image" />
                          </div>
                        )}
                      </td>
                      <td className="aae__name-cell">{auction.name}</td>
                      <td>{auction.antique}</td>
                      <td className="aae__species-display">{getSpeciesDisplay(auction)}</td>
                      <td>
                        <div className="aae__type-badges">
                          {getTypesList(auction).map(t => (
                            <span key={t} className="aae__type-badge">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td>{auction.attribute ?? '—'}</td>
                      <td>{auction.creator ?? '—'}</td>
                      <td>
                        <div className="aae__actions-cell">
                          <button
                            type="button"
                            className="button secondary small"
                            onClick={() => handleStartEdit(auction)}
                            title="Edit"
                          >
                            <i className="fas fa-edit" />
                          </button>
                          <button
                            type="button"
                            className="button danger small"
                            onClick={() => handleDelete(auction)}
                            title="Delete"
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="aae__footer">
              <span className="aae__count">
                {filteredAuctions.length} of {auctions.length} auction{auctions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </>
        )}
      </div>

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  )
}
