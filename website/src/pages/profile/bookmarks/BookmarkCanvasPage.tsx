import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useAuth } from '@contexts/useAuth';
import { LoadingSpinner, ErrorMessage, TypeBadge, AttributeBadge } from '@components/common';
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete';
import { MonsterAutocomplete } from '@components/common/MonsterAutocomplete';
import bookmarkService from '@services/bookmarkService';
import monsterService from '@services/monsterService';
import type { BookmarkItem, BookmarkTextNote, BookmarkCategory } from '@services/bookmarkService';

type CanvasMode = 'view' | 'move' | 'edit';

interface DragState {
  active: boolean;
  type: 'item' | 'note';
  id: number;
  startMouseX: number;
  startMouseY: number;
  startPosX: number;
  startPosY: number;
}

interface ResizeState {
  active: boolean;
  id: number;
  startMouseX: number;
  startMouseY: number;
  startWidth: number;
  startHeight: number | null;
}

interface MonsterOption {
  id: number;
  name: string;
  type1?: string;
  type2?: string;
}

const BookmarkCanvasPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { isAuthenticated } = useAuth();

  const [category, setCategory] = useState<BookmarkCategory | null>(null);
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [notes, setNotes] = useState<BookmarkTextNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mode, setMode] = useState<CanvasMode>('view');
  const [exporting, setExporting] = useState(false);

  // Add item form state
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | number | null>(null);
  const [trainerMonsters, setTrainerMonsters] = useState<MonsterOption[]>([]);
  const [selectedMonsterId, setSelectedMonsterId] = useState<string | number | null>(null);
  const [loadingMonsters, setLoadingMonsters] = useState(false);

  // Note editing
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);

  const catId = categoryId ? parseInt(categoryId) : 0;

  useDocumentTitle(category ? `Bookmarks - ${category.title}` : 'Bookmarks');

  // =========================================================================
  // Data fetching (only on initial load)
  // =========================================================================

  const fetchData = useCallback(async () => {
    if (!catId) return;
    try {
      setLoading(true);
      const [cat, data] = await Promise.all([
        bookmarkService.getCategory(catId),
        bookmarkService.getCategoryItems(catId),
      ]);
      setCategory(cat);
      setItems(data.items);
      setNotes(data.notes);
      setError('');
    } catch {
      setError('Failed to load bookmark data');
    } finally {
      setLoading(false);
    }
  }, [catId]);

  useEffect(() => {
    if (isAuthenticated && catId) {
      fetchData();
    }
  }, [isAuthenticated, catId, fetchData]);

  // Fetch monsters when trainer changes
  useEffect(() => {
    if (!selectedTrainerId) {
      setTrainerMonsters([]);
      setSelectedMonsterId(null);
      return;
    }
    setLoadingMonsters(true);
    monsterService.getMonstersByTrainerId(selectedTrainerId)
      .then((res: { monsters?: MonsterOption[] }) => {
        setTrainerMonsters(res.monsters || []);
      })
      .catch(() => setTrainerMonsters([]))
      .finally(() => setLoadingMonsters(false));
  }, [selectedTrainerId]);

  // =========================================================================
  // Refresh only items (no loading spinner)
  // =========================================================================

  const refreshItems = useCallback(async () => {
    if (!catId) return;
    try {
      const data = await bookmarkService.getCategoryItems(catId);
      setItems(data.items);
      setNotes(data.notes);
    } catch {
      // Silently fail — data will sync on next full load
    }
  }, [catId]);

  // =========================================================================
  // Add items (no loading state)
  // =========================================================================

  const handleAddTrainer = async () => {
    if (!selectedTrainerId) return;
    try {
      await bookmarkService.addItem(catId, 'trainer', Number(selectedTrainerId));
      setSelectedTrainerId(null);
      await refreshItems();
    } catch {
      setError('Failed to add trainer');
    }
  };

  const handleAddMonster = async () => {
    if (!selectedMonsterId) return;
    try {
      await bookmarkService.addItem(catId, 'monster', Number(selectedMonsterId));
      setSelectedMonsterId(null);
      await refreshItems();
    } catch {
      setError('Failed to add monster');
    }
  };

  const handleAddNote = async () => {
    try {
      await bookmarkService.addNote(catId, { content: 'New note' });
      await refreshItems();
    } catch {
      setError('Failed to add note');
    }
  };

  // =========================================================================
  // Delete items/notes
  // =========================================================================

  const handleDeleteItem = async (id: number) => {
    try {
      await bookmarkService.removeItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      setError('Failed to remove item');
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await bookmarkService.removeNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {
      setError('Failed to remove note');
    }
  };

  // =========================================================================
  // Note inline editing
  // =========================================================================

  const handleNoteBlur = async (noteId: number) => {
    setEditingNoteId(null);
    try {
      await bookmarkService.updateNote(noteId, { content: editingNoteContent });
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content: editingNoteContent } : n));
    } catch {
      setError('Failed to update note');
    }
  };

  const handleNoteColorChange = async (noteId: number, color: string) => {
    try {
      await bookmarkService.updateNote(noteId, { color });
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, color } : n));
    } catch {
      setError('Failed to update note color');
    }
  };

  const handleNoteFontSizeChange = async (noteId: number, fontSize: number) => {
    try {
      await bookmarkService.updateNote(noteId, { font_size: fontSize });
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, fontSize } : n));
    } catch {
      setError('Failed to update note font size');
    }
  };

  // =========================================================================
  // Drag logic (move & edit modes)
  // =========================================================================

  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    type: 'item' | 'note',
    id: number,
    currentPosX: number,
    currentPosY: number,
  ) => {
    if (mode !== 'move' && mode !== 'edit') return;
    e.preventDefault();
    dragRef.current = {
      active: true,
      type,
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: currentPosX,
      startPosY: currentPosY,
    };
  }, [mode]);

  // =========================================================================
  // Resize logic (edit mode)
  // =========================================================================

  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent,
    id: number,
    currentWidth: number,
    currentHeight: number | null,
  ) => {
    if (mode !== 'edit' && mode !== 'move') return;
    e.preventDefault();
    e.stopPropagation();

    // When no explicit height is saved, measure the actual rendered height
    // and convert it to a canvas percentage so the card doesn't "pop".
    let startHeight = currentHeight;
    if (startHeight == null && canvasRef.current) {
      const card = (e.currentTarget as HTMLElement).closest('.bookmark-canvas-card');
      if (card) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        startHeight = (card.getBoundingClientRect().height / canvasRect.height) * 100;
      }
    }

    resizeRef.current = {
      active: true,
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startWidth: currentWidth,
      startHeight,
    };
  }, [mode]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Handle drag
      const drag = dragRef.current;
      if (drag?.active && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const dx = ((e.clientX - drag.startMouseX) / rect.width) * 100;
        const dy = ((e.clientY - drag.startMouseY) / rect.height) * 100;

        const newX = Math.max(0, Math.min(95, drag.startPosX + dx));
        const newY = Math.max(0, Math.min(95, drag.startPosY + dy));

        if (drag.type === 'item') {
          setItems(prev => prev.map(item =>
            item.id === drag.id ? { ...item, posX: newX, posY: newY } : item
          ));
        } else {
          setNotes(prev => prev.map(note =>
            note.id === drag.id ? { ...note, posX: newX, posY: newY } : note
          ));
        }
        return;
      }

      // Handle resize
      const resize = resizeRef.current;
      if (resize?.active && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const dx = ((e.clientX - resize.startMouseX) / rect.width) * 100;
        const dy = ((e.clientY - resize.startMouseY) / rect.height) * 100;
        const newWidth = Math.max(5, Math.min(50, resize.startWidth + dx));
        const newHeight = Math.max(5, Math.min(80, (resize.startHeight ?? 0) + dy));

        setItems(prev => prev.map(item =>
          item.id === resize.id ? { ...item, cardWidth: newWidth, cardHeight: newHeight } : item
        ));
      }
    };

    const handleMouseUp = async () => {
      // Handle drag end
      const drag = dragRef.current;
      if (drag?.active) {
        dragRef.current = null;
        if (drag.type === 'item') {
          const item = items.find(i => i.id === drag.id);
          if (item) {
            try {
              await bookmarkService.updateItemPosition(drag.id, item.posX, item.posY);
            } catch {
              // Position will be corrected on next load
            }
          }
        } else {
          const note = notes.find(n => n.id === drag.id);
          if (note) {
            try {
              await bookmarkService.updateNote(drag.id, { pos_x: note.posX, pos_y: note.posY });
            } catch {
              // Position will be corrected on next load
            }
          }
        }
        return;
      }

      // Handle resize end
      const resize = resizeRef.current;
      if (resize?.active) {
        resizeRef.current = null;
        const item = items.find(i => i.id === resize.id);
        if (item) {
          try {
            await bookmarkService.updateItemPosition(resize.id, item.posX, item.posY, item.cardWidth, item.cardHeight);
          } catch {
            // Dimensions will be corrected on next load
          }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [items, notes]);

  // =========================================================================
  // Export
  // =========================================================================

  const handleExport = useCallback(async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${category?.title ?? 'bookmarks'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export as PNG');
    } finally {
      setExporting(false);
    }
  }, [category?.title]);

  // =========================================================================
  // Render helpers
  // =========================================================================

  const getItemLink = (item: BookmarkItem) => {
    return item.itemType === 'trainer'
      ? `/trainers/${item.itemId}`
      : `/monsters/${item.itemId}`;
  };

  const collectSpecies = (item: BookmarkItem): string[] => {
    const species: string[] = [];
    if (item.itemSpecies1) { species.push(item.itemSpecies1); }
    if (item.itemSpecies2) { species.push(item.itemSpecies2); }
    if (item.itemSpecies3) { species.push(item.itemSpecies3); }
    return species;
  };

  const collectTypes = (item: BookmarkItem): string[] => {
    const types: string[] = [];
    if (item.itemType1) { types.push(item.itemType1); }
    if (item.itemType2) { types.push(item.itemType2); }
    if (item.itemType3) { types.push(item.itemType3); }
    if (item.itemType4) { types.push(item.itemType4); }
    if (item.itemType5) { types.push(item.itemType5); }
    if (item.itemType6) { types.push(item.itemType6); }
    return types;
  };

  const renderItem = (item: BookmarkItem) => {
    const cardStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${item.posX}%`,
      top: `${item.posY}%`,
      width: `${item.cardWidth}%`,
      ...(item.cardHeight != null ? { height: `${item.cardHeight}%` } : {}),
    };

    const isDraggable = mode === 'move' || mode === 'edit';
    const species = collectSpecies(item);
    const types = collectTypes(item);

    const hasCustomHeight = item.cardHeight != null;

    const cardContent = (
      <div className={`bookmark-canvas-card__inner ${hasCustomHeight ? 'bookmark-canvas-card__inner--full' : ''}`}>
        {item.itemImage && (
          <div className={`bookmark-canvas-card__image ${hasCustomHeight ? 'bookmark-canvas-card__image--fill' : ''}`}>
            <img src={item.itemImage} alt={item.itemName || ''} />
          </div>
        )}
        <div className="bookmark-canvas-card__info">
          <div className="bookmark-canvas-card__name">{item.itemName || 'Unknown'}</div>
          {species.length > 0 && (
            <div className="bookmark-canvas-card__species">{species.join(' / ')}</div>
          )}
          {types.length > 0 && (
            <div className="bookmark-canvas-card__types">
              {types.map(t => <TypeBadge key={t} type={t} size="xs" />)}
            </div>
          )}
          {item.itemType === 'monster' && item.itemAttribute && (
            <div className="bookmark-canvas-card__attribute">
              <AttributeBadge attribute={item.itemAttribute} size="xs" />
            </div>
          )}
        </div>
        {mode === 'edit' && (
          <button
            className="bookmark-canvas-card__delete"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteItem(item.id); }}
            title="Remove"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
        {(mode === 'edit' || mode === 'move') && (
          <div
            className="bookmark-canvas-card__resize"
            onMouseDown={e => handleResizeMouseDown(e, item.id, item.cardWidth, item.cardHeight)}
            title="Drag to resize"
          />
        )}
      </div>
    );

    if (mode === 'view') {
      return (
        <a
          key={`item-${item.id}`}
          href={getItemLink(item)}
          className="bookmark-canvas-card"
          style={cardStyle}
        >
          {cardContent}
        </a>
      );
    }

    return (
      <div
        key={`item-${item.id}`}
        className={`bookmark-canvas-card ${isDraggable ? 'draggable' : ''}`}
        style={cardStyle}
        onMouseDown={e => handleMouseDown(e, 'item', item.id, item.posX, item.posY)}
      >
        {cardContent}
      </div>
    );
  };

  const renderNote = (note: BookmarkTextNote) => {
    const noteStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${note.posX}%`,
      top: `${note.posY}%`,
      width: `${note.width}%`,
      color: note.color,
      fontSize: `${note.fontSize}px`,
    };

    const isDraggable = mode === 'move' || mode === 'edit';
    const isEditing = mode === 'edit' && editingNoteId === note.id;

    return (
      <div
        key={`note-${note.id}`}
        className={`bookmark-canvas-note ${isDraggable ? 'draggable' : ''}`}
        style={noteStyle}
        onMouseDown={e => {
          if (isEditing) return;
          handleMouseDown(e, 'note', note.id, note.posX, note.posY);
        }}
      >
        {isEditing ? (
          <textarea
            className="bookmark-canvas-note__textarea"
            value={editingNoteContent}
            onChange={e => setEditingNoteContent(e.target.value)}
            onBlur={() => handleNoteBlur(note.id)}
            autoFocus
            style={{ color: note.color, fontSize: `${note.fontSize}px` }}
          />
        ) : (
          <div
            className="bookmark-canvas-note__content"
            onClick={() => {
              if (mode === 'edit') {
                setEditingNoteId(note.id);
                setEditingNoteContent(note.content);
              }
            }}
          >
            {note.content || '(empty note)'}
          </div>
        )}
        {mode === 'edit' && (
          <div className="bookmark-canvas-note__controls" onMouseDown={e => e.stopPropagation()}>
            <input
              type="color"
              value={note.color}
              onChange={e => handleNoteColorChange(note.id, e.target.value)}
              title="Text color"
              className="bookmark-canvas-note__color"
            />
            <select
              value={note.fontSize}
              onChange={e => handleNoteFontSizeChange(note.id, parseInt(e.target.value))}
              className="bookmark-canvas-note__fontsize"
              title="Font size"
            >
              {[10, 12, 14, 16, 18, 20, 24, 28, 32, 40].map(s => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
            <button
              className="bookmark-canvas-note__delete"
              onClick={() => handleDeleteNote(note.id)}
              title="Delete note"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // Main render
  // =========================================================================

  if (!isAuthenticated) {
    return (
      <div className="bookmark-canvas-page">
        <ErrorMessage message="Please log in to view bookmarks." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bookmark-canvas-page">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bookmark-canvas-page">
      {/* Toolbar */}
      <div className="bookmark-toolbar">
        <Link to="/profile/bookmarks" className="button sm">
          <i className="fas fa-arrow-left"></i> Back
        </Link>

        <h2 className="bookmark-toolbar__title">{category?.title || 'Collection'}</h2>

        <div className="bookmark-toolbar__modes">
          <button
            className={`button sm ${mode === 'view' ? 'primary' : ''}`}
            onClick={() => setMode('view')}
            title="View mode"
          >
            <i className="fas fa-eye"></i> View
          </button>
          <button
            className={`button sm ${mode === 'move' ? 'primary' : ''}`}
            onClick={() => setMode('move')}
            title="Move mode"
          >
            <i className="fas fa-arrows-alt"></i> Move
          </button>
          <button
            className={`button sm ${mode === 'edit' ? 'primary' : ''}`}
            onClick={() => setMode('edit')}
            title="Edit mode"
          >
            <i className="fas fa-edit"></i> Edit
          </button>
        </div>

        <button
          className="button sm"
          onClick={handleExport}
          disabled={exporting}
          title="Export as PNG"
        >
          <i className="fas fa-download"></i> {exporting ? 'Exporting...' : 'Export PNG'}
        </button>
      </div>

      {/* Edit toolbar */}
      {mode === 'edit' && (
        <div className="bookmark-edit-toolbar">
          <div className="bookmark-edit-toolbar__section">
            <TrainerAutocomplete
              selectedTrainerId={selectedTrainerId}
              onSelect={setSelectedTrainerId}
              label="Add Trainer"
              placeholder="Search trainers..."
              noPadding
            />
            <button
              className="button sm primary"
              onClick={handleAddTrainer}
              disabled={!selectedTrainerId}
            >
              <i className="fas fa-plus"></i> Add Trainer
            </button>
          </div>

          <div className="bookmark-edit-toolbar__section">
            <MonsterAutocomplete
              monsters={trainerMonsters}
              selectedMonsterId={selectedMonsterId}
              onSelect={setSelectedMonsterId}
              label={selectedTrainerId ? 'Add Monster' : 'Select a trainer first'}
              placeholder={loadingMonsters ? 'Loading...' : 'Search monsters...'}
              disabled={!selectedTrainerId || loadingMonsters}
              noPadding
            />
            <button
              className="button sm primary"
              onClick={handleAddMonster}
              disabled={!selectedMonsterId}
            >
              <i className="fas fa-plus"></i> Add Monster
            </button>
          </div>

          <button className="button sm" onClick={handleAddNote}>
            <i className="fas fa-sticky-note"></i> Add Note
          </button>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`bookmark-canvas ${mode !== 'view' ? 'bookmark-canvas--interactive' : ''}`}
      >
        {items.length === 0 && notes.length === 0 && (
          <div className="bookmark-canvas__empty">
            <p>This collection is empty.</p>
            <p>Switch to Edit mode to add trainers, monsters, and notes.</p>
          </div>
        )}
        {items.map(renderItem)}
        {notes.map(renderNote)}
      </div>
    </div>
  );
};

export default BookmarkCanvasPage;
