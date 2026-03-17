import { useState, useEffect, useCallback } from 'react'
import { useDocumentTitle } from '@hooks/useDocumentTitle'
import { AdminRoute } from '@components/common/AdminRoute'
import { ConfirmModal, useConfirmModal, LoadingSpinner, WysiwygEditor } from '@components/common'
import { Modal } from '@components/common/Modal'
import contentService, {
  type CategoriesResponse,
  type DirectoryStructure,
  type DirectoryNode,
  type SortOrderItem,
} from '@services/contentService'

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

function countFiles(structure: DirectoryStructure | null): number {
  if (!structure) return 0
  let count = structure.files.length
  for (const dir of structure.directories) {
    count += countFiles(dir.children)
  }
  return count
}

function filterTree(structure: DirectoryStructure | null, query: string): DirectoryStructure | null {
  if (!structure) return null
  const lowerQuery = query.toLowerCase()

  const filteredFiles = structure.files.filter(
    f => f.name.toLowerCase().includes(lowerQuery) || f.path.toLowerCase().includes(lowerQuery)
  )

  const filteredDirs: DirectoryNode[] = []
  for (const dir of structure.directories) {
    const filteredChildren = filterTree(dir.children, query)
    const dirMatches = dir.name.toLowerCase().includes(lowerQuery)
    if (dirMatches || (filteredChildren && (filteredChildren.files.length > 0 || filteredChildren.directories.length > 0))) {
      filteredDirs.push({
        ...dir,
        children: dirMatches ? dir.children : filteredChildren,
      })
    }
  }

  if (filteredFiles.length === 0 && filteredDirs.length === 0) return null
  return { directories: filteredDirs, files: filteredFiles }
}


// ============================================================================
// Types
// ============================================================================

interface SelectedItem {
  category: string
  filePath: string
  fileName: string
  isNew: boolean
}

interface FormState {
  title: string
  content: string
  fileName: string
}

interface NewDirModalState {
  isOpen: boolean
  category: string
  parentPath: string
  name: string
}

interface SortOrderModalState {
  isOpen: boolean
  category: string
  parentPath: string
  items: SortOrderItem[]
  saving: boolean
}

// ============================================================================
// TreeNode Sub-Component
// ============================================================================

function TreeNode({
  structure,
  category,
  selectedItem,
  expandedPaths,
  onToggleDir,
  onSelectFile,
  onNewFile,
  onNewDir,
  onSortOrder,
}: {
  structure: DirectoryStructure
  category: string
  selectedItem: SelectedItem | null
  expandedPaths: Set<string>
  onToggleDir: (path: string) => void
  onSelectFile: (category: string, filePath: string, fileName: string) => void
  onNewFile: (category: string, parentPath: string) => void
  onNewDir: (category: string, parentPath: string) => void
  onSortOrder: (category: string, parentPath: string) => void
}) {
  return (
    <div className="content-manager__tree">
      {structure.directories.map(dir => {
        const dirKey = `${category}/${dir.url}`
        const isExpanded = expandedPaths.has(dirKey)
        return (
          <div key={dir.path} className="content-manager__tree-dir">
            <button
              type="button"
              className={`content-manager__tree-dir-header${isExpanded ? ' content-manager__tree-dir-header--expanded' : ''}`}
              onClick={() => onToggleDir(dirKey)}
            >
              <i className="fas fa-chevron-right" />
              <i className={`fas ${isExpanded ? 'fa-folder-open' : 'fa-folder'}`} />
              <span>{dir.name}</span>
              <span className="content-manager__tree-dir-actions">
                <button
                  type="button"
                  title="Edit sort order"
                  onClick={(e) => { e.stopPropagation(); onSortOrder(category, dir.url) }}
                >
                  <i className="fas fa-sort" />
                </button>
                <button
                  type="button"
                  title="New file"
                  onClick={(e) => { e.stopPropagation(); onNewFile(category, dir.url) }}
                >
                  <i className="fas fa-file-medical" />
                </button>
                <button
                  type="button"
                  title="New folder"
                  onClick={(e) => { e.stopPropagation(); onNewDir(category, dir.url) }}
                >
                  <i className="fas fa-folder-plus" />
                </button>
              </span>
            </button>
            {isExpanded && dir.children && (
              <div className="content-manager__tree-dir-children">
                <TreeNode
                  structure={dir.children}
                  category={category}
                  selectedItem={selectedItem}
                  expandedPaths={expandedPaths}
                  onToggleDir={onToggleDir}
                  onSelectFile={onSelectFile}
                  onNewFile={onNewFile}
                  onNewDir={onNewDir}
                  onSortOrder={onSortOrder}
                />
              </div>
            )}
          </div>
        )
      })}
      {structure.files.map(file => {
        const isSelected = selectedItem?.category === category && selectedItem?.filePath === file.url
        return (
          <button
            key={file.path}
            type="button"
            className={`content-manager__tree-file${isSelected ? ' content-manager__tree-file--selected' : ''}`}
            onClick={() => onSelectFile(category, file.url, file.name)}
          >
            <i className="fas fa-file-alt" />
            <span>{file.name}</span>
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function ContentManagerPage() {
  useDocumentTitle('Content Manager')

  const [categories, setCategories] = useState<CategoriesResponse>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const [form, setForm] = useState<FormState>({ title: '', content: '', fileName: '' })
  const [originalForm, setOriginalForm] = useState<FormState>({ title: '', content: '', fileName: '' })
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newDirModal, setNewDirModal] = useState<NewDirModalState>({ isOpen: false, category: '', parentPath: '', name: '' })
  const [sortOrderModal, setSortOrderModal] = useState<SortOrderModalState>({ isOpen: false, category: '', parentPath: '', items: [], saving: false })

  const confirmModal = useConfirmModal()

  // --- Load categories ---

  const loadCategories = useCallback(async () => {
    try {
      const data = await contentService.getCategories()
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // --- Dirty check ---

  const isDirty = form.title !== originalForm.title || form.content !== originalForm.content || form.fileName !== originalForm.fileName

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

  // --- Select file ---

  const doSelectFile = useCallback(async (category: string, filePath: string, fileName: string) => {
    setStatusMsg(null)
    try {
      const data = await contentService.getContent(category, filePath)
      const rawContent = data.content || ''

      // Parse title from first # heading
      let title = ''
      let body = rawContent
      const titleMatch = rawContent.match(/^# (.+)\n?/)
      if (titleMatch) {
        title = titleMatch[1]
        body = rawContent.slice(titleMatch[0].length).replace(/^\n/, '')
      }

      const formState: FormState = { title, content: body, fileName: filePath.replace(/\.md$/, '').split('/').pop() || '' }
      setForm(formState)
      setOriginalForm(formState)
      setSelectedItem({ category, filePath, fileName, isNew: false })
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to load content') })
    }
  }, [])

  const selectFile = useCallback((category: string, filePath: string, fileName: string) => {
    guardDirty(() => doSelectFile(category, filePath, fileName))
  }, [guardDirty, doSelectFile])

  // --- New file ---

  const doNewFile = useCallback((category: string, parentPath: string) => {
    setStatusMsg(null)
    const formState: FormState = { title: '', content: '', fileName: '' }
    setForm(formState)
    setOriginalForm(formState)
    setSelectedItem({ category, filePath: parentPath, fileName: '', isNew: true })
  }, [])

  const handleNewFile = useCallback((category: string, parentPath: string) => {
    guardDirty(() => doNewFile(category, parentPath))
  }, [guardDirty, doNewFile])

  // --- Save ---

  const handleSave = useCallback(async () => {
    if (!selectedItem) return

    if (!form.title.trim()) {
      setStatusMsg({ type: 'error', text: 'Title is required' })
      return
    }

    if (selectedItem.isNew && !form.fileName.trim()) {
      setStatusMsg({ type: 'error', text: 'File name is required' })
      return
    }

    setSaving(true)
    setStatusMsg(null)

    try {
      // Build full content: title + body
      const fullContent = `# ${form.title.trim()}\n\n${form.content}`

      const savePath = selectedItem.isNew
        ? (selectedItem.filePath ? `${selectedItem.filePath}/${form.fileName.trim()}` : form.fileName.trim())
        : selectedItem.filePath

      await contentService.saveContent(selectedItem.category, savePath, { content: fullContent })
      setStatusMsg({ type: 'success', text: 'Saved successfully' })

      // Update original form so dirty check resets
      const updatedForm = { ...form }
      setOriginalForm(updatedForm)

      // If it was a new file, update the selected item
      if (selectedItem.isNew) {
        setSelectedItem({
          ...selectedItem,
          filePath: savePath,
          fileName: form.title.trim(),
          isNew: false,
        })
      }

      await loadCategories()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save') })
    } finally {
      setSaving(false)
    }
  }, [selectedItem, form, loadCategories])

  // --- Delete ---

  const handleDelete = useCallback(() => {
    if (!selectedItem || selectedItem.isNew) return
    confirmModal.confirmDanger(
      `Delete "${selectedItem.fileName}"? This cannot be undone.`,
      async () => {
        setSaving(true)
        setStatusMsg(null)
        try {
          await contentService.deleteContent(selectedItem.category, selectedItem.filePath)
          setStatusMsg({ type: 'success', text: 'Deleted successfully' })
          setSelectedItem(null)
          setForm({ title: '', content: '', fileName: '' })
          setOriginalForm({ title: '', content: '', fileName: '' })
          await loadCategories()
        } catch (err) {
          setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete') })
        } finally {
          setSaving(false)
        }
      },
    )
  }, [selectedItem, confirmModal, loadCategories])

  // --- Create directory ---

  const handleCreateDirectory = useCallback(async () => {
    const { category, parentPath, name } = newDirModal
    if (!name.trim()) return

    try {
      await contentService.createDirectory(category, parentPath, name.trim())
      setNewDirModal({ isOpen: false, category: '', parentPath: '', name: '' })
      await loadCategories()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to create directory') })
    }
  }, [newDirModal, loadCategories])

  // --- Tree UI ---

  const toggleCategory = useCallback((cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const toggleDir = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const openNewDirModal = useCallback((category: string, parentPath: string) => {
    setNewDirModal({ isOpen: true, category, parentPath, name: '' })
  }, [])

  // --- Sort order ---

  const openSortOrderModal = useCallback(async (category: string, parentPath: string) => {
    try {
      const data = await contentService.getSortOrder(category, parentPath)
      setSortOrderModal({ isOpen: true, category, parentPath, items: data.items, saving: false })
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to load sort order') })
    }
  }, [])

  const moveSortItem = useCallback((fromIndex: number, toIndex: number) => {
    setSortOrderModal(prev => {
      const items = [...prev.items]
      const [moved] = items.splice(fromIndex, 1)
      if (moved) items.splice(toIndex, 0, moved)
      return { ...prev, items }
    })
  }, [])

  const handleSaveSortOrder = useCallback(async () => {
    setSortOrderModal(prev => ({ ...prev, saving: true }))
    try {
      const updates = sortOrderModal.items.map((item, idx) => ({
        id: item.id,
        sortOrder: idx + 1,
      }))
      await contentService.updateSortOrder(updates)
      setSortOrderModal(prev => ({ ...prev, isOpen: false, saving: false }))
      await loadCategories()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to save sort order') })
      setSortOrderModal(prev => ({ ...prev, saving: false }))
    }
  }, [sortOrderModal.items, loadCategories])

  const handleClearSortOrder = useCallback(async () => {
    setSortOrderModal(prev => ({ ...prev, saving: true }))
    try {
      const updates = sortOrderModal.items.map(item => ({
        id: item.id,
        sortOrder: 0,
      }))
      await contentService.updateSortOrder(updates)
      setSortOrderModal(prev => ({ ...prev, isOpen: false, saving: false }))
      await loadCategories()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to clear sort order') })
      setSortOrderModal(prev => ({ ...prev, saving: false }))
    }
  }, [sortOrderModal.items, loadCategories])

  // --- Render ---

  if (loading) {
    return (
      <AdminRoute>
        <div className="main-container">
          <h1>Content Manager</h1>
          <LoadingSpinner />
        </div>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <div className="main-container">
        <h1>Content Manager</h1>

        <div className="content-manager">
          {/* Sidebar */}
          <div className="content-manager__sidebar">
            <div className="content-manager__search">
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="content-manager__list">
              {Object.entries(categories).map(([key, cat]) => {
                const emptyStructure: DirectoryStructure = { directories: [], files: [] }
                const baseStructure = cat.structure ?? emptyStructure
                const structure = searchQuery
                  ? (filterTree(baseStructure, searchQuery) ?? emptyStructure)
                  : baseStructure
                // When searching, hide categories with no matches
                if (searchQuery && structure.directories.length === 0 && structure.files.length === 0) return null
                const fileCount = countFiles(structure)
                const isCollapsed = !searchQuery && collapsedCategories.has(key)

                return (
                  <div key={key} className="content-manager__category">
                    <button
                      type="button"
                      className={`content-manager__category-header${isCollapsed ? ' content-manager__category-header--collapsed' : ''}`}
                      onClick={() => toggleCategory(key)}
                    >
                      <span>
                        {cat.name}
                        <span className="content-manager__category-count">({fileCount})</span>
                      </span>
                      <span className="content-manager__category-actions">
                        <button
                          type="button"
                          title="Edit sort order"
                          onClick={(e) => { e.stopPropagation(); openSortOrderModal(key, '') }}
                        >
                          <i className="fas fa-sort" />
                        </button>
                        <button
                          type="button"
                          title="New file in root"
                          onClick={(e) => { e.stopPropagation(); handleNewFile(key, '') }}
                        >
                          <i className="fas fa-file-medical" />
                        </button>
                        <button
                          type="button"
                          title="New folder in root"
                          onClick={(e) => { e.stopPropagation(); openNewDirModal(key, '') }}
                        >
                          <i className="fas fa-folder-plus" />
                        </button>
                      </span>
                      <i className="fas fa-chevron-down" />
                    </button>
                    {!isCollapsed && (
                      <div className="content-manager__category-items">
                        <TreeNode
                          structure={structure}
                          category={key}
                          selectedItem={selectedItem}
                          expandedPaths={expandedPaths}
                          onToggleDir={toggleDir}
                          onSelectFile={selectFile}
                          onNewFile={handleNewFile}
                          onNewDir={openNewDirModal}
                          onSortOrder={openSortOrderModal}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Editor Panel */}
          <div className="content-manager__panel">
            {!selectedItem ? (
              <div className="content-manager__empty">
                Select a file from the sidebar to edit, or create a new one
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="content-manager__header">
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
                      {selectedItem.isNew ? 'New File' : selectedItem.fileName}
                    </h2>
                    <p className="content-manager__file-path">
                      {selectedItem.category}/{selectedItem.isNew ? (selectedItem.filePath ? selectedItem.filePath + '/' : '') + '(new)' : selectedItem.filePath}
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
                    <label>Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Page title (becomes # heading)"
                    />
                  </div>

                  {/* File name (only for new files) */}
                  {selectedItem.isNew && (
                    <div className="content-manager__field">
                      <label>File Name</label>
                      <input
                        type="text"
                        value={form.fileName}
                        onChange={(e) => setForm(prev => ({ ...prev, fileName: e.target.value }))}
                        placeholder="my-file-name"
                      />
                      <span className="content-manager__hint">.md extension added automatically</span>
                    </div>
                  )}

                  {/* WYSIWYG Editor */}
                  <WysiwygEditor
                    content={form.content}
                    onContentChange={(content) => setForm(prev => ({ ...prev, content }))}
                    placeholder="Write your content here..."
                  />
                </div>

                {/* Actions */}
                <div className="content-manager__actions">
                  <button
                    type="button"
                    className="content-manager__btn content-manager__btn--primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : selectedItem.isNew ? 'Create File' : 'Save Changes'}
                  </button>
                  {!selectedItem.isNew && (
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

        {/* New Directory Modal */}
        <Modal
          isOpen={newDirModal.isOpen}
          onClose={() => setNewDirModal(prev => ({ ...prev, isOpen: false }))}
          title="Create Directory"
          size="small"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setNewDirModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleCreateDirectory}
                disabled={!newDirModal.name.trim()}
              >
                Create
              </button>
            </div>
          }
        >
          <div className="content-manager__field">
            <label>Directory Name</label>
            <input
              type="text"
              value={newDirModal.name}
              onChange={(e) => setNewDirModal(prev => ({ ...prev, name: e.target.value }))}
              placeholder="my-directory"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateDirectory() }}
            />
            <span className="content-manager__hint">Letters, numbers, hyphens, and underscores only</span>
          </div>
        </Modal>

        {/* Sort Order Modal */}
        <Modal
          isOpen={sortOrderModal.isOpen}
          onClose={() => setSortOrderModal(prev => ({ ...prev, isOpen: false }))}
          title={`Sort Order: ${sortOrderModal.category}${sortOrderModal.parentPath ? '/' + sortOrderModal.parentPath : ''}`}
          size="small"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="button secondary"
                onClick={handleClearSortOrder}
                disabled={sortOrderModal.saving}
              >
                Clear Order
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => setSortOrderModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button primary"
                onClick={handleSaveSortOrder}
                disabled={sortOrderModal.saving}
              >
                {sortOrderModal.saving ? 'Saving...' : 'Save Order'}
              </button>
            </div>
          }
        >
          <p style={{ margin: '0 0 12px', fontSize: '0.85rem', opacity: 0.7 }}>
            Drag items to reorder. Position in the list determines display order.
          </p>
          {sortOrderModal.items.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.5 }}>No items at this level</p>
          ) : (
            <div className="content-manager__sort-list">
              {sortOrderModal.items.map((item, index) => (
                <div
                  key={item.id}
                  className="content-manager__sort-item"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)) }}
                  onDragOver={(e) => { e.preventDefault() }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
                    if (!isNaN(fromIndex) && fromIndex !== index) {
                      moveSortItem(fromIndex, index)
                    }
                  }}
                >
                  <span className="content-manager__sort-handle">
                    <i className="fas fa-grip-vertical" />
                  </span>
                  <i className={`fas ${item.isDirectory ? 'fa-folder' : 'fa-file-alt'}`} style={{ opacity: 0.5 }} />
                  <span className="content-manager__sort-title">{item.title}</span>
                  <span className="content-manager__sort-position">{index + 1}</span>
                  <span className="content-manager__sort-arrows">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSortItem(index, index - 1)}
                      title="Move up"
                    >
                      <i className="fas fa-chevron-up" />
                    </button>
                    <button
                      type="button"
                      disabled={index === sortOrderModal.items.length - 1}
                      onClick={() => moveSortItem(index, index + 1)}
                      title="Move down"
                    >
                      <i className="fas fa-chevron-down" />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Modal>

        <ConfirmModal {...confirmModal.modalProps} />
      </div>
    </AdminRoute>
  )
}
