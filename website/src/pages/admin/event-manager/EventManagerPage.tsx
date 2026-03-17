import { useState, useEffect, useCallback } from 'react'
import { useDocumentTitle } from '@hooks/useDocumentTitle'
import { AdminRoute } from '@components/common/AdminRoute'
import { ConfirmModal, useConfirmModal, LoadingSpinner, WysiwygEditor } from '@components/common'
import eventAdminService, {
  type EventSummary,
  type EventPart,
} from '@services/eventAdminService'

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

function formatDateForInput(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr.split('T')[0] || dateStr
}

// ============================================================================
// Types
// ============================================================================

interface FormState {
  title: string
  startDate: string
  endDate: string
  content: string
  category: string
  fileName: string
  isMultiPart: boolean
}

const EMPTY_FORM: FormState = {
  title: '',
  startDate: '',
  endDate: '',
  content: '',
  category: 'upcoming',
  fileName: '',
  isMultiPart: false,
}

const CATEGORIES = [
  { value: 'current', label: 'Current' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

// ============================================================================
// Part Editor Sub-Component
// ============================================================================

function PartEditor({
  eventId,
  parts,
  onPartsChange,
  onStatus,
}: {
  eventId: string
  parts: EventPart[]
  onPartsChange: () => void
  onStatus: (msg: { type: 'success' | 'error'; text: string }) => void
}) {
  const [expandedPart, setExpandedPart] = useState<string | null>(null)
  const [partForms, setPartForms] = useState<Record<string, { title: string; content: string }>>({})
  const [savingPart, setSavingPart] = useState<string | null>(null)
  const [newPartForm, setNewPartForm] = useState<{ title: string; content: string } | null>(null)
  const confirmModal = useConfirmModal()

  // Initialize part forms from parts data
  useEffect(() => {
    const forms: Record<string, { title: string; content: string }> = {}
    parts.forEach(part => {
      // Extract body content (skip title line)
      const lines = part.content.split('\n')
      let bodyStart = 0
      if (lines[0]?.startsWith('#')) bodyStart = 1
      while (bodyStart < lines.length && lines[bodyStart]?.trim() === '') bodyStart++
      const bodyContent = lines.slice(bodyStart).join('\n')

      forms[part.id] = { title: part.title, content: bodyContent }
    })
    setPartForms(forms)
  }, [parts])

  const handleSavePart = useCallback(async (partId: string) => {
    const form = partForms[partId]
    if (!form) return

    setSavingPart(partId)
    try {
      await eventAdminService.updatePart(eventId, partId, form)
      onStatus({ type: 'success', text: `Part "${form.title}" saved` })
      onPartsChange()
    } catch (err) {
      onStatus({ type: 'error', text: getAxiosError(err, 'Failed to save part') })
    } finally {
      setSavingPart(null)
    }
  }, [eventId, partForms, onPartsChange, onStatus])

  const handleDeletePart = useCallback((partId: string, partTitle: string) => {
    confirmModal.confirmDanger(
      `Delete part "${partTitle}"? This cannot be undone.`,
      async () => {
        try {
          await eventAdminService.deletePart(eventId, partId)
          onStatus({ type: 'success', text: 'Part deleted' })
          onPartsChange()
        } catch (err) {
          onStatus({ type: 'error', text: getAxiosError(err, 'Failed to delete part') })
        }
      },
    )
  }, [eventId, confirmModal, onPartsChange, onStatus])

  const handleAddPart = useCallback(async () => {
    if (!newPartForm || !newPartForm.title.trim()) {
      onStatus({ type: 'error', text: 'Part title is required' })
      return
    }

    setSavingPart('new')
    try {
      await eventAdminService.addPart(eventId, {
        title: newPartForm.title.trim(),
        content: newPartForm.content,
      })
      onStatus({ type: 'success', text: 'Part added' })
      setNewPartForm(null)
      onPartsChange()
    } catch (err) {
      onStatus({ type: 'error', text: getAxiosError(err, 'Failed to add part') })
    } finally {
      setSavingPart(null)
    }
  }, [eventId, newPartForm, onPartsChange, onStatus])

  return (
    <div className="event-parts-editor">
      <div className="event-parts-editor__header">
        <h3>Event Parts ({parts.length})</h3>
        {!newPartForm && (
          <button
            type="button"
            className="content-manager__btn content-manager__btn--primary"
            onClick={() => setNewPartForm({ title: '', content: '' })}
          >
            <i className="fas fa-plus" /> Add Part
          </button>
        )}
      </div>

      {/* Existing parts */}
      {parts.map(part => {
        const isExpanded = expandedPart === part.id
        const form = partForms[part.id]

        return (
          <div key={part.id} className="event-part-item">
            <div
              className="event-part-item__header"
              onClick={() => setExpandedPart(isExpanded ? null : part.id)}
            >
              <span className="event-part-item__title">
                <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`} />{' '}
                {form?.title || part.title}
              </span>
              <div className="event-part-item__actions">
                <button
                  type="button"
                  className="content-manager__btn content-manager__btn--danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePart(part.id, part.title)
                  }}
                  style={{ padding: '2px 8px', fontSize: 'var(--font-size-xsmall)' }}
                >
                  <i className="fas fa-trash" />
                </button>
              </div>
            </div>
            {isExpanded && form && (
              <div className="event-part-item__body">
                <div className="content-manager__field">
                  <label>Part Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setPartForms(prev => ({
                      ...prev,
                      [part.id]: { ...prev[part.id]!, title: e.target.value },
                    }))}
                  />
                </div>
                <div className="content-manager__field">
                  <label>Content</label>
                  <WysiwygEditor
                    content={form.content}
                    onContentChange={(content) => setPartForms(prev => ({
                      ...prev,
                      [part.id]: { ...prev[part.id]!, content },
                    }))}
                    placeholder="Write part content in markdown..."
                  />
                </div>
                <button
                  type="button"
                  className="content-manager__btn content-manager__btn--primary"
                  onClick={() => handleSavePart(part.id)}
                  disabled={savingPart === part.id}
                >
                  {savingPart === part.id ? 'Saving...' : 'Save Part'}
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* New part form */}
      {newPartForm && (
        <div className="event-part-item">
          <div className="event-part-item__header" style={{ cursor: 'default' }}>
            <span className="event-part-item__title">
              <i className="fas fa-plus" /> New Part
            </span>
          </div>
          <div className="event-part-item__body">
            <div className="content-manager__field">
              <label>Part Title</label>
              <input
                type="text"
                value={newPartForm.title}
                onChange={(e) => setNewPartForm(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="e.g. Part 1 - A Mysterious Letter"
              />
            </div>
            <div className="content-manager__field">
              <label>Content</label>
              <WysiwygEditor
                content={newPartForm.content}
                onContentChange={(content: string) => setNewPartForm(prev => prev ? { ...prev, content } : null)}
                placeholder="Write part content..."
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-xsmall)' }}>
              <button
                type="button"
                className="content-manager__btn content-manager__btn--primary"
                onClick={handleAddPart}
                disabled={savingPart === 'new'}
              >
                {savingPart === 'new' ? 'Adding...' : 'Add Part'}
              </button>
              <button
                type="button"
                className="content-manager__btn"
                onClick={() => setNewPartForm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal {...confirmModal.modalProps} />
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function EventManagerPage() {
  useDocumentTitle('Event Manager')

  const [events, setEvents] = useState<{ current: EventSummary[]; upcoming: EventSummary[]; past: EventSummary[] }>({ current: [], upcoming: [], past: [] })
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [originalForm, setOriginalForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [eventParts, setEventParts] = useState<EventPart[]>([])
  const [isMultiPart, setIsMultiPart] = useState(false)

  const confirmModal = useConfirmModal()

  // --- Load events ---

  const loadEvents = useCallback(async () => {
    try {
      const data = await eventAdminService.listAll()
      setEvents(data.events)
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  // --- Dirty check ---

  const isDirty = form.title !== originalForm.title
    || form.content !== originalForm.content
    || form.startDate !== originalForm.startDate
    || form.endDate !== originalForm.endDate
    || form.category !== originalForm.category
    || form.fileName !== originalForm.fileName

  const guardDirty = useCallback((action: () => void) => {
    if (isDirty) {
      confirmModal.confirm(
        'You have unsaved changes. Discard them?',
        action,
        { confirmText: 'Discard', variant: 'warning' },
      )
    } else {
      action()
    }
  }, [isDirty, confirmModal])

  // --- Select event ---

  const doSelectEvent = useCallback(async (eventId: string) => {
    setStatusMsg(null)
    try {
      const data = await eventAdminService.getEvent(eventId)
      const event = data.event

      // Parse the body content (skip title line and date line)
      const lines = event.content.split('\n')
      let bodyStart = 0
      // Skip # title line
      if (lines[0]?.startsWith('#')) bodyStart = 1
      // Skip date line
      if (lines[bodyStart]?.match(/\d{4}-\d{2}-\d{2}\s+to\s+\d{4}-\d{2}-\d{2}/)) bodyStart++
      // Skip leading blank line
      while (bodyStart < lines.length && lines[bodyStart]?.trim() === '') bodyStart++

      const bodyContent = lines.slice(bodyStart).join('\n')

      const formState: FormState = {
        title: event.title,
        startDate: formatDateForInput(event.startDate),
        endDate: formatDateForInput(event.endDate),
        content: bodyContent,
        category: event.category,
        fileName: event.id,
        isMultiPart: event.isMultiPart || false,
      }
      setForm(formState)
      setOriginalForm(formState)
      setSelectedEventId(eventId)
      setIsNew(false)
      setIsMultiPart(event.isMultiPart || false)
      setEventParts(event.parts || [])
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to load event') })
    }
  }, [])

  const selectEvent = useCallback((eventId: string) => {
    guardDirty(() => doSelectEvent(eventId))
  }, [guardDirty, doSelectEvent])

  // --- New event ---

  const doNewEvent = useCallback(() => {
    setStatusMsg(null)
    setForm(EMPTY_FORM)
    setOriginalForm(EMPTY_FORM)
    setSelectedEventId(null)
    setIsNew(true)
    setIsMultiPart(false)
    setEventParts([])
  }, [])

  const handleNewEvent = useCallback(() => {
    guardDirty(doNewEvent)
  }, [guardDirty, doNewEvent])

  // --- Save ---

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) {
      setStatusMsg({ type: 'error', text: 'Title is required' })
      return
    }
    if (!form.startDate || !form.endDate) {
      setStatusMsg({ type: 'error', text: 'Start and end dates are required' })
      return
    }
    if (isNew && !form.fileName.trim()) {
      setStatusMsg({ type: 'error', text: 'File name is required for new events' })
      return
    }

    setSaving(true)
    setStatusMsg(null)

    try {
      if (isNew) {
        const result = await eventAdminService.createEvent({
          title: form.title.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          content: form.content,
          category: form.category,
          fileName: form.fileName.trim(),
          isMultiPart: form.isMultiPart,
        })
        setStatusMsg({ type: 'success', text: result.message })
        setIsNew(false)
        const newId = result.eventId || form.fileName.trim()
        setSelectedEventId(newId)
        setIsMultiPart(form.isMultiPart)
        setOriginalForm({ ...form })

        // Reload to get the full event data
        await loadEvents()
        if (form.isMultiPart) {
          // Re-fetch to get parts
          const data = await eventAdminService.getEvent(newId)
          setEventParts(data.event.parts || [])
        }
      } else if (selectedEventId) {
        const result = await eventAdminService.updateEvent(selectedEventId, {
          title: form.title.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          content: form.content,
          category: form.category,
        })
        setStatusMsg({ type: 'success', text: result.message })
        setOriginalForm({ ...form })
        await loadEvents()
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save') })
    } finally {
      setSaving(false)
    }
  }, [form, isNew, selectedEventId, loadEvents])

  // --- Reload parts ---

  const reloadParts = useCallback(async () => {
    if (!selectedEventId) return
    try {
      const data = await eventAdminService.getEvent(selectedEventId)
      setEventParts(data.event.parts || [])
    } catch (err) {
      console.error('Failed to reload parts:', err)
    }
  }, [selectedEventId])

  // --- Delete ---

  const handleDelete = useCallback(() => {
    if (!selectedEventId || isNew) return
    confirmModal.confirmDanger(
      `Delete "${form.title}"?${isMultiPart ? ' This will delete all parts.' : ''} This cannot be undone.`,
      async () => {
        setSaving(true)
        setStatusMsg(null)
        try {
          await eventAdminService.deleteEvent(selectedEventId)
          setStatusMsg({ type: 'success', text: 'Event deleted successfully' })
          setSelectedEventId(null)
          setIsNew(false)
          setIsMultiPart(false)
          setEventParts([])
          setForm(EMPTY_FORM)
          setOriginalForm(EMPTY_FORM)
          await loadEvents()
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete') })
        } finally {
          setSaving(false)
        }
      },
    )
  }, [selectedEventId, isNew, form.title, isMultiPart, confirmModal, loadEvents])

  // --- Image upload ---

  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true)
    try {
      const result = await eventAdminService.uploadImage(file)
      if (result.imageUrl) {
        setStatusMsg({ type: 'success', text: 'Image uploaded and inserted' })
        return result.imageUrl
      }
      return null
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to upload image') })
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  // --- UI helpers ---

  const toggleCategory = useCallback((cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  // --- Filter events ---

  const filterEvents = (list: EventSummary[]) => {
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(e => e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q))
  }

  // --- Render ---

  if (loading) {
    return (
      <AdminRoute>
        <div className="main-container">
          <h1>Event Manager</h1>
          <LoadingSpinner />
        </div>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <div className="main-container">
        <h1>Event Manager</h1>

        <div className="content-manager">
          {/* Sidebar */}
          <div className="content-manager__sidebar">
            <div className="content-manager__search">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ padding: 'var(--spacing-xsmall) var(--spacing-small)', borderBottom: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="content-manager__btn content-manager__btn--primary"
                style={{ width: '100%' }}
                onClick={handleNewEvent}
              >
                <i className="fas fa-plus" /> New Event
              </button>
            </div>
            <div className="content-manager__list">
              {CATEGORIES.map(cat => {
                const catEvents = filterEvents(events[cat.value as keyof typeof events] || [])
                if (searchQuery && catEvents.length === 0) return null
                const isCollapsed = !searchQuery && collapsedCategories.has(cat.value)

                return (
                  <div key={cat.value} className="content-manager__category">
                    <button
                      type="button"
                      className={`content-manager__category-header${isCollapsed ? ' content-manager__category-header--collapsed' : ''}`}
                      onClick={() => toggleCategory(cat.value)}
                    >
                      <span>
                        {cat.label}
                        <span className="content-manager__category-count">({catEvents.length})</span>
                      </span>
                      <i className="fas fa-chevron-down" />
                    </button>
                    {!isCollapsed && (
                      <div className="content-manager__category-items">
                        {catEvents.map(event => {
                          const isSelected = selectedEventId === event.id && !isNew
                          return (
                            <button
                              key={event.id}
                              type="button"
                              className={`content-manager__tree-file${isSelected ? ' content-manager__tree-file--selected' : ''}`}
                              onClick={() => selectEvent(event.id)}
                            >
                              <i className={event.isMultiPart ? 'fas fa-layer-group' : 'fas fa-calendar-alt'} />
                              <span>{event.title}</span>
                            </button>
                          )
                        })}
                        {catEvents.length === 0 && (
                          <div style={{ padding: 'var(--spacing-xsmall) var(--spacing-small)', color: 'var(--text-color-muted)', fontSize: 'var(--font-size-xsmall)' }}>
                            No events
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Editor Panel */}
          <div className="content-manager__panel">
            {!selectedEventId && !isNew ? (
              <div className="content-manager__empty">
                Select an event from the sidebar to edit, or create a new one
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="content-manager__header">
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
                      {isNew ? 'New Event' : form.title || 'Untitled Event'}
                      {isMultiPart && !isNew && (
                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 'normal' }}>
                          (Multi-part)
                        </span>
                      )}
                    </h2>
                    <p className="content-manager__file-path">
                      {isNew
                        ? 'Creating new event'
                        : isMultiPart
                          ? `events/${form.category}/${selectedEventId}/overview.md`
                          : `events/${form.category}/${selectedEventId}.md`
                      }
                    </p>
                  </div>
                  {isDirty && <span className="content-manager__unsaved-badge">Unsaved</span>}
                </div>

                {/* Form */}
                <div className="content-manager__form">
                  {statusMsg && (
                    <div className={`content-manager__status content-manager__status--${statusMsg.type}`}>
                      {statusMsg.text}
                    </div>
                  )}

                  {/* Title */}
                  <div className="content-manager__field">
                    <label>Event Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Event title"
                    />
                  </div>

                  {/* File name (only for new events) */}
                  {isNew && (
                    <>
                      <div className="content-manager__field">
                        <label>File Name</label>
                        <input
                          type="text"
                          value={form.fileName}
                          onChange={(e) => setForm(prev => ({ ...prev, fileName: e.target.value }))}
                          placeholder="my-event-name"
                        />
                        <span className="content-manager__hint">Letters, numbers, hyphens only. Leave blank to auto-generate from title.</span>
                      </div>

                      {/* Multi-part toggle */}
                      <div className="content-manager__field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xsmall)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={form.isMultiPart}
                            onChange={(e) => setForm(prev => ({ ...prev, isMultiPart: e.target.checked }))}
                          />
                          Multi-part event
                        </label>
                        <span className="content-manager__hint">
                          Multi-part events have an overview page and separate parts that can be added after creation.
                        </span>
                      </div>
                    </>
                  )}

                  {/* Date range and category row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-small)' }}>
                    <div className="content-manager__field">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="content-manager__field">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                    <div className="content-manager__field">
                      <label>Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                        style={{
                          padding: 'var(--spacing-xsmall) var(--spacing-small)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--border-radius-small)',
                          background: 'var(--background-color)',
                          color: 'var(--text-color)',
                          fontSize: 'var(--font-size-small)',
                        }}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* WYSIWYG Editor */}
                  <WysiwygEditor
                    content={form.content}
                    onContentChange={(content) => setForm(prev => ({ ...prev, content }))}
                    placeholder={isMultiPart ? 'Write the event overview/description...' : 'Write your event content...'}
                    onUploadImage={handleImageUpload}
                    uploading={uploading}
                  />

                  {/* Parts editor for multi-part events */}
                  {isMultiPart && !isNew && selectedEventId && (
                    <PartEditor
                      eventId={selectedEventId}
                      parts={eventParts}
                      onPartsChange={reloadParts}
                      onStatus={setStatusMsg}
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="content-manager__actions">
                  <button
                    type="button"
                    className="content-manager__btn content-manager__btn--primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : isNew ? 'Create Event' : 'Save Changes'}
                  </button>
                  {!isNew && (
                    <button
                      type="button"
                      className="content-manager__btn content-manager__btn--danger"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <ConfirmModal {...confirmModal.modalProps} />
      </div>
    </AdminRoute>
  )
}
