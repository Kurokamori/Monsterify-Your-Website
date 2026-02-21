import { ReactNode, useCallback } from 'react';

interface ArrayFieldEditorProps<T> {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, onChangeItem: (updated: T) => void) => ReactNode;
  createEmpty: () => T;
  maxItems?: number;
}

export function ArrayFieldEditor<T>({
  label,
  items,
  onChange,
  renderItem,
  createEmpty,
  maxItems,
}: ArrayFieldEditorProps<T>) {
  const handleAdd = useCallback(() => {
    if (maxItems && items.length >= maxItems) return;
    onChange([...items, createEmpty()]);
  }, [items, onChange, createEmpty, maxItems]);

  const handleRemove = useCallback((index: number) => {
    onChange(items.filter((_, i) => i !== index));
  }, [items, onChange]);

  const handleChange = useCallback((index: number, updated: T) => {
    const next = [...items];
    next[index] = updated;
    onChange(next);
  }, [items, onChange]);

  return (
    <div className="array-field">
      <div className="array-field__header">
        <label className="form-label">{label}</label>
        <button
          type="button"
          className="button primary sm"
          onClick={handleAdd}
          disabled={maxItems !== undefined && items.length >= maxItems}
        >
          <i className="fas fa-plus"></i> Add
        </button>
      </div>

      {items.length === 0 && (
        <p className="array-field__empty">No items. Click "Add" to create one.</p>
      )}

      {items.map((item, index) => (
        <div key={index} className="array-field__item">
          <div className="array-field__item-content">
            {renderItem(item, index, (updated) => handleChange(index, updated))}
          </div>
          <button
            type="button"
            className="button danger icon sm no-flex"
            onClick={() => handleRemove(index)}
            title="Remove"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  );
}
