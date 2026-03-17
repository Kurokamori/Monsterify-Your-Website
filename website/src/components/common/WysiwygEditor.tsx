import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { Markdown } from 'tiptap-markdown'
import { useState, useEffect, useRef, useCallback } from 'react'

function getMarkdownFromEditor(editor: Editor): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (editor.storage as any).markdown.getMarkdown()
}

// ============================================================================
// Toolbar Button
// ============================================================================

function ToolbarButton({
  icon,
  text,
  title,
  isActive,
  onClick,
  disabled,
}: {
  icon?: string
  text?: string
  title: string
  isActive?: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={`content-manager__toolbar-btn${isActive ? ' content-manager__toolbar-btn--active' : ''}`}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {icon ? <i className={icon} /> : text}
    </button>
  )
}

function ToolbarSep() {
  return <div className="content-manager__toolbar-sep" />
}

// ============================================================================
// Link Modal
// ============================================================================

function LinkModal({
  editor,
  isOpen,
  onClose,
}: {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}) {
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      const existing = editor.getAttributes('link').href || ''
      setUrl(existing)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, editor])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (url.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    onClose()
  }

  return (
    <div className="wysiwyg-link-modal" onClick={onClose}>
      <div className="wysiwyg-link-modal__content" onClick={(e) => e.stopPropagation()}>
        <label>URL</label>
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        />
        <div className="wysiwyg-link-modal__actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" className="primary" onClick={handleSubmit}>
            {url.trim() ? 'Apply' : 'Remove Link'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Image Modal
// ============================================================================

function ImageModal({
  editor,
  isOpen,
  onClose,
  onUploadImage,
  uploading,
}: {
  editor: Editor
  isOpen: boolean
  onClose: () => void
  onUploadImage?: (file: File) => Promise<string | null>
  uploading?: boolean
}) {
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setUrl('')
      setAlt('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (url.trim()) {
      editor.chain().focus().setImage({ src: url.trim(), alt: alt.trim() || undefined }).run()
    }
    onClose()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUploadImage) return
    const uploadedUrl = await onUploadImage(file)
    if (uploadedUrl) {
      editor.chain().focus().setImage({ src: uploadedUrl, alt: file.name }).run()
      onClose()
    }
    e.target.value = ''
  }

  return (
    <div className="wysiwyg-link-modal" onClick={onClose}>
      <div className="wysiwyg-link-modal__content" onClick={(e) => e.stopPropagation()}>
        <label>Image URL</label>
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/image.png"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        />
        <label>Alt Text</label>
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Description of image"
        />
        {onUploadImage && (
          <>
            <div className="wysiwyg-link-modal__divider">or</div>
            <button
              type="button"
              className="wysiwyg-link-modal__upload-btn"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <i className={uploading ? 'fas fa-spinner fa-spin' : 'fas fa-upload'} />{' '}
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </>
        )}
        <div className="wysiwyg-link-modal__actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" className="primary" onClick={handleSubmit} disabled={!url.trim()}>
            Insert Image
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// WYSIWYG Toolbar
// ============================================================================

function WysiwygToolbar({
  editor,
  onUploadImage,
  uploading,
}: {
  editor: Editor
  onUploadImage?: (file: File) => Promise<string | null>
  uploading?: boolean
}) {
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)

  return (
    <div className="content-manager__toolbar">
      {/* Headings */}
      <ToolbarButton
        text="H1"
        title="Heading 1"
        isActive={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        text="H2"
        title="Heading 2"
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        text="H3"
        title="Heading 3"
        isActive={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />

      <ToolbarSep />

      {/* Inline formatting */}
      <ToolbarButton
        icon="fas fa-bold"
        title="Bold"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon="fas fa-italic"
        title="Italic"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon="fas fa-underline"
        title="Underline"
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        icon="fas fa-strikethrough"
        title="Strikethrough"
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />

      <ToolbarSep />

      {/* Links & Images */}
      <ToolbarButton
        icon="fas fa-link"
        title="Insert Link"
        isActive={editor.isActive('link')}
        onClick={() => setLinkModalOpen(true)}
      />
      <ToolbarButton
        icon="fas fa-image"
        title="Insert Image"
        onClick={() => setImageModalOpen(true)}
      />

      <ToolbarSep />

      {/* Lists */}
      <ToolbarButton
        icon="fas fa-list-ul"
        title="Bullet List"
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon="fas fa-list-ol"
        title="Ordered List"
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        icon="fas fa-quote-right"
        title="Blockquote"
        isActive={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />

      <ToolbarSep />

      {/* Code */}
      <ToolbarButton
        icon="fas fa-code"
        title="Inline Code"
        isActive={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <ToolbarButton
        text="{}"
        title="Code Block"
        isActive={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />

      <ToolbarSep />

      {/* Table */}
      <ToolbarButton
        icon="fas fa-table"
        title="Insert Table"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      />
      <ToolbarButton
        text="HR"
        title="Horizontal Rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />

      {/* Modals */}
      <LinkModal editor={editor} isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)} />
      <ImageModal
        editor={editor}
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onUploadImage={onUploadImage}
        uploading={uploading}
      />
    </div>
  )
}

// ============================================================================
// Source Mode Toolbar (markdown toolbar for raw editing)
// ============================================================================

interface MarkdownToolbarItem {
  label: string
  icon?: string
  text?: string
  prefix: string
  suffix: string
}

const MARKDOWN_TOOLBAR_ITEMS: (MarkdownToolbarItem | 'sep')[] = [
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

function SourceToolbar({
  textareaRef,
  content,
  onContentChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  content: string
  onContentChange: (content: string) => void
}) {
  const insertMarkdown = useCallback((prefix: string, suffix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end)
    const newContent = content.substring(0, start) + prefix + selected + suffix + content.substring(end)
    onContentChange(newContent)

    requestAnimationFrame(() => {
      textarea.focus()
      const cursorPos = start + prefix.length + selected.length
      textarea.setSelectionRange(cursorPos, cursorPos)
    })
  }, [textareaRef, content, onContentChange])

  return (
    <div className="content-manager__toolbar">
      {MARKDOWN_TOOLBAR_ITEMS.map((item, i) => {
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
  )
}

// ============================================================================
// Main WysiwygEditor Component
// ============================================================================

export function WysiwygEditor({
  content,
  onContentChange,
  placeholder,
  onUploadImage,
  uploading,
}: {
  content: string
  onContentChange: (content: string) => void
  placeholder?: string
  onUploadImage?: (file: File) => Promise<string | null>
  uploading?: boolean
}) {
  const [mode, setMode] = useState<'wysiwyg' | 'source'>('wysiwyg')
  const [sourceContent, setSourceContent] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const skipNextUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Underline,
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (skipNextUpdate.current) {
        skipNextUpdate.current = false
        return
      }
      const markdown = getMarkdownFromEditor(editor)
      onContentChange(markdown)
    },
  })

  // Sync external content changes into the editor (e.g. loading a file)
  const lastExternalContent = useRef(content)
  useEffect(() => {
    if (!editor) return
    if (content === lastExternalContent.current) return
    lastExternalContent.current = content

    const currentMarkdown = getMarkdownFromEditor(editor)
    if (content !== currentMarkdown) {
      skipNextUpdate.current = true
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Switch modes
  const switchToSource = useCallback(() => {
    if (!editor) return
    const markdown = getMarkdownFromEditor(editor)
    setSourceContent(markdown)
    setMode('source')
  }, [editor])

  const switchToWysiwyg = useCallback(() => {
    if (!editor) return
    skipNextUpdate.current = true
    editor.commands.setContent(sourceContent)
    onContentChange(sourceContent)
    lastExternalContent.current = sourceContent
    setMode('wysiwyg')
  }, [editor, sourceContent, onContentChange])

  const handleSourceChange = useCallback((newContent: string) => {
    setSourceContent(newContent)
    onContentChange(newContent)
    lastExternalContent.current = newContent
  }, [onContentChange])

  if (!editor) return null

  return (
    <div className="wysiwyg-editor">
      {/* Mode toggle */}
      <div className="wysiwyg-editor__mode-bar">
        <button
          type="button"
          className={`wysiwyg-editor__mode-btn${mode === 'wysiwyg' ? ' wysiwyg-editor__mode-btn--active' : ''}`}
          onClick={mode === 'source' ? switchToWysiwyg : undefined}
        >
          <i className="fas fa-eye" /> Visual
        </button>
        <button
          type="button"
          className={`wysiwyg-editor__mode-btn${mode === 'source' ? ' wysiwyg-editor__mode-btn--active' : ''}`}
          onClick={mode === 'wysiwyg' ? switchToSource : undefined}
        >
          <i className="fas fa-code" /> Markdown
        </button>
      </div>

      {mode === 'wysiwyg' ? (
        <>
          <WysiwygToolbar editor={editor} onUploadImage={onUploadImage} uploading={uploading} />
          <div className="wysiwyg-editor__content">
            <EditorContent editor={editor} />
          </div>
        </>
      ) : (
        <>
          <SourceToolbar
            textareaRef={textareaRef}
            content={sourceContent}
            onContentChange={handleSourceChange}
          />
          <textarea
            ref={textareaRef}
            className="content-manager__textarea"
            value={sourceContent}
            onChange={(e) => handleSourceChange(e.target.value)}
            placeholder={placeholder || 'Write your markdown content here...'}
          />
        </>
      )}
    </div>
  )
}
