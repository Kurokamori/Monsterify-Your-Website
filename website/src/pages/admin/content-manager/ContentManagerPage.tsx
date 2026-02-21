import { useState, useEffect, useCallback, useRef } from 'react'
import { marked } from 'marked'
import { useDocumentTitle } from '@hooks/useDocumentTitle'
import { AdminRoute } from '@components/common/AdminRoute'
import { ConfirmModal, useConfirmModal, LoadingSpinner } from '@components/common'
import { Modal } from '@components/common/Modal'
import { MarkdownRenderer } from '@components/guides/MarkdownRenderer'
import contentService, {
  type CategoriesResponse,
  type DirectoryStructure,
  type DirectoryNode,
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

function parseMarkdownToHtml(markdown: string): string {
  marked.setOptions({ gfm: true, breaks: true })
  return marked.parse(markdown) as string
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
}: {
  structure: DirectoryStructure
  category: string
  selectedItem: SelectedItem | null
  expandedPaths: Set<string>
  onToggleDir: (path: string) => void
  onSelectFile: (category: string, filePath: string, fileName: string) => void
  onNewFile: (category: string, parentPath: string) => void
  onNewDir: (category: string, parentPath: string) => void
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
// Toolbar Buttons
// ============================================================================

interface ToolbarItem {
  label: string
  icon?: string
  text?: string
  prefix: string
  suffix: string
}

const TOOLBAR_ITEMS: (ToolbarItem | 'sep')[] = [
  { label: 'H1', text: 'H1', prefix: '# ', suffix: '' },
  { label: 'H2', text: 'H2', prefix: '## ', suffix: '' },
  { label: 'H3', text: 'H3', prefix: '### ', suffix: '' },
  'sep',
  { label: 'Bold', icon: 'fas fa-bold', prefix: '**', suffix: '**' },
  { label: 'Italic', icon: 'fas fa-italic', prefix: '_', suffix: '_' },
  { label: 'Strikethrough', icon: 'fas fa-strikethrough', prefix: '~~', suffix: '~~' },
  'sep',
  { label: 'Link', icon: 'fas fa-link', prefix: '[', suffix: '](url)' },
  { label: 'Image', icon: 'fas fa-image', prefix: '![alt](', suffix: ')' },
  'sep',
  { label: 'Unordered List', icon: 'fas fa-list-ul', prefix: '- ', suffix: '' },
  { label: 'Ordered List', icon: 'fas fa-list-ol', prefix: '1. ', suffix: '' },
  { label: 'Blockquote', icon: 'fas fa-quote-right', prefix: '> ', suffix: '' },
  'sep',
  { label: 'Inline Code', icon: 'fas fa-code', prefix: '`', suffix: '`' },
  { label: 'Code Block', text: '{}', prefix: '```\n', suffix: '\n```' },
  { label: 'Horizontal Rule', text: 'HR', prefix: '\n---\n', suffix: '' },
  { label: 'Table', icon: 'fas fa-table', prefix: '| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |', suffix: '' },
]

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
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newDirModal, setNewDirModal] = useState<NewDirModalState>({ isOpen: false, category: '', parentPath: '', name: '' })

  const confirmModal = useConfirmModal()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      setActiveTab('editor')
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
    setActiveTab('editor')
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

  // --- Markdown insert ---

  const insertMarkdown = useCallback((prefix: string, suffix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = form.content.substring(start, end)
    const newContent = form.content.substring(0, start) + prefix + selected + suffix + form.content.substring(end)
    setForm(prev => ({ ...prev, content: newContent }))

    // Restore cursor position after React re-renders
    requestAnimationFrame(() => {
      textarea.focus()
      const cursorPos = start + prefix.length + selected.length
      textarea.setSelectionRange(cursorPos, cursorPos)
    })
  }, [form.content])

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

  // --- Preview content ---

  const previewHtml = activeTab === 'preview'
    ? parseMarkdownToHtml(`# ${form.title}\n\n${form.content}`)
    : ''

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

                  {/* Tab bar */}
                  <div className="content-manager__tab-bar">
                    <button
                      type="button"
                      className={`content-manager__tab${activeTab === 'editor' ? ' content-manager__tab--active' : ''}`}
                      onClick={() => setActiveTab('editor')}
                    >
                      <i className="fas fa-edit" /> Editor
                    </button>
                    <button
                      type="button"
                      className={`content-manager__tab${activeTab === 'preview' ? ' content-manager__tab--active' : ''}`}
                      onClick={() => setActiveTab('preview')}
                    >
                      <i className="fas fa-eye" /> Preview
                    </button>
                  </div>

                  {/* Editor / Preview */}
                  {activeTab === 'editor' ? (
                    <div className="content-manager__editor">
                      <div className="content-manager__toolbar">
                        {TOOLBAR_ITEMS.map((item, i) => {
                          if (item === 'sep') return <div key={`sep-${i}`} className="content-manager__toolbar-sep" />
                          return (
                            <button
                              key={item.label}
                              type="button"
                              className="content-manager__toolbar-btn"
                              title={item.label}
                              onClick={() => insertMarkdown(item.prefix, item.suffix)}
                            >
                              {item.icon ? <i className={item.icon} /> : item.text}
                            </button>
                          )
                        })}
                      </div>
                      <textarea
                        ref={textareaRef}
                        className="content-manager__textarea"
                        value={form.content}
                        onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write your markdown content here..."
                      />
                    </div>
                  ) : (
                    <div className="content-manager__preview">
                      <MarkdownRenderer content={previewHtml} />
                    </div>
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

        <ConfirmModal {...confirmModal.modalProps} />
      </div>
    </AdminRoute>
  )
}
