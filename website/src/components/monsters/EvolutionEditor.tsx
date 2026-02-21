import { useState, useEffect, ChangeEvent, DragEvent } from 'react';
import { TypeBadge, AttributeBadge, BadgeGroup, FormInput, FormSelect, FileUpload } from '../common';

interface EvolutionEntry {
  id?: number | string;
  order?: number;
  image?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
  attribute?: string;
  evolution_method?: string;
  level?: number | string;
  key?: string;
  data?: string;
}

interface EvolutionEditorProps {
  monsterId?: number | string;
  evolutionData?: EvolutionEntry[];
  onSave: (entries: EvolutionEntry[]) => void;
  onCancel: () => void;
  isOwner?: boolean;
}

const INITIAL_FORM_DATA: EvolutionEntry = {
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
  evolution_method: '',
  level: '',
  key: '',
  data: ''
};

const TYPE_OPTIONS = [
  { value: '', label: '-- Select Type --' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Fire', label: 'Fire' },
  { value: 'Water', label: 'Water' },
  { value: 'Electric', label: 'Electric' },
  { value: 'Grass', label: 'Grass' },
  { value: 'Ice', label: 'Ice' },
  { value: 'Fighting', label: 'Fighting' },
  { value: 'Poison', label: 'Poison' },
  { value: 'Ground', label: 'Ground' },
  { value: 'Flying', label: 'Flying' },
  { value: 'Psychic', label: 'Psychic' },
  { value: 'Bug', label: 'Bug' },
  { value: 'Rock', label: 'Rock' },
  { value: 'Ghost', label: 'Ghost' },
  { value: 'Dragon', label: 'Dragon' },
  { value: 'Dark', label: 'Dark' },
  { value: 'Steel', label: 'Steel' },
  { value: 'Fairy', label: 'Fairy' }
];

const ATTRIBUTE_OPTIONS = [
  { value: '', label: '-- Select Attribute --' },
  { value: 'Virus', label: 'Virus' },
  { value: 'Vaccine', label: 'Vaccine' },
  { value: 'Data', label: 'Data' },
  { value: 'Free', label: 'Free' },
  { value: 'Variable', label: 'Variable' }
];

export const EvolutionEditor = ({
  evolutionData = [],
  onSave,
  onCancel,
  isOwner = true
}: EvolutionEditorProps) => {
  const [evolutionEntries, setEvolutionEntries] = useState<EvolutionEntry[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<EvolutionEntry>(INITIAL_FORM_DATA);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (evolutionData && Array.isArray(evolutionData)) {
      setEvolutionEntries(evolutionData);
    } else {
      setEvolutionEntries([]);
    }
  }, [evolutionData]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (url: string | null) => {
    setFormData(prev => ({ ...prev, image: url || '' }));
  };

  const handleAddEntry = () => {
    const newEntry: EvolutionEntry = {
      id: Date.now(),
      ...formData,
      order: evolutionEntries.length
    };
    setEvolutionEntries(prev => [...prev, newEntry]);
    resetForm();
  };

  const handleEditEntry = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...evolutionEntries[index] });
  };

  const handleUpdateEntry = () => {
    if (editingIndex === null) return;

    const updatedEntries = [...evolutionEntries];
    updatedEntries[editingIndex] = {
      ...formData,
      id: evolutionEntries[editingIndex].id,
      order: evolutionEntries[editingIndex].order
    };

    setEvolutionEntries(updatedEntries);
    setEditingIndex(null);
    resetForm();
  };

  const handleDeleteEntry = (index: number) => {
    if (window.confirm('Are you sure you want to delete this evolution entry?')) {
      setEvolutionEntries(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const reorderedEntries = [...evolutionEntries];
    const draggedEntry = reorderedEntries[draggedIndex];

    reorderedEntries.splice(draggedIndex, 1);
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    reorderedEntries.splice(insertIndex, 0, draggedEntry);

    reorderedEntries.forEach((entry, index) => {
      entry.order = index;
    });

    setEvolutionEntries(reorderedEntries);
    setDraggedIndex(null);
  };

  const handleSave = () => {
    const sortedEntries = [...evolutionEntries].sort((a, b) => (a.order || 0) - (b.order || 0));
    onSave(sortedEntries);
  };

  const getTypes = (entry: EvolutionEntry): string[] => {
    return [entry.type1, entry.type2, entry.type3, entry.type4, entry.type5]
      .filter((t): t is string => Boolean(t));
  };

  const getSpeciesNames = (entry: EvolutionEntry): string => {
    return [entry.species1, entry.species2, entry.species3]
      .filter(Boolean)
      .join(' / ') || 'Unnamed Species';
  };

  if (!isOwner) {
    return (
      <div className="evolution-editor">
        <div className="evolution-editor__access-denied">
          <i className="fas fa-lock"></i>
          <p>Only the monster's owner can edit evolution information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="evolution-editor">
      <div className="evolution-editor__info">
        <h3>
          <i className="fas fa-dna"></i>
          Edit Evolution Information
        </h3>
        <p>Add, modify, delete, and reorganize evolution entries for this monster.</p>
      </div>

      {evolutionEntries.length > 0 && (
        <div className="evolution-entries">
          <h4 className="evolution-entries__header">
            Current Evolution Chain ({evolutionEntries.length} entries)
          </h4>
          <div className="evolution-entries__list">
            {evolutionEntries.map((entry, index) => {
              const types = getTypes(entry);
              const isEditing = editingIndex === index;

              return (
                <div key={entry.id || index}>
                  <div
                    className={[
                      'evolution-entry',
                      isEditing && 'evolution-entry--editing',
                      draggedIndex === index && 'evolution-entry--dragging'
                    ].filter(Boolean).join(' ')}
                    draggable={!isEditing}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="evolution-entry__drag-handle">
                      <i className="fas fa-grip-vertical"></i>
                      <span className="evolution-entry__order">#{index + 1}</span>
                    </div>

                    <div className="evolution-entry__preview">
                      {entry.image && (
                        <div className="evolution-entry__image">
                          <img
                            src={entry.image}
                            alt="Evolution"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="evolution-entry__info">
                        <div className="evolution-entry__species">
                          {getSpeciesNames(entry)}
                        </div>
                        {types.length > 0 && (
                          <BadgeGroup className="evolution-entry__types" gap="xs">
                            {types.map((type, i) => (
                              <TypeBadge key={i} type={type} size="xs" />
                            ))}
                          </BadgeGroup>
                        )}
                        {entry.attribute && (
                          <AttributeBadge attribute={entry.attribute} size="xs" />
                        )}
                        {entry.evolution_method && (
                          <div className="evolution-entry__method">
                            <i className="fas fa-arrow-right"></i>
                            <span>{entry.evolution_method}</span>
                            {entry.level && <span> (Level {entry.level})</span>}
                            {entry.key && entry.data && <span> - {entry.key}: {entry.data}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="evolution-entry__actions">
                      <button
                        className="button secondary sm"
                        onClick={() => handleEditEntry(index)}
                        title="Edit this entry"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className="button danger sm"
                        onClick={() => handleDeleteEntry(index)}
                        title="Delete this entry"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  {index < evolutionEntries.length - 1 && (
                    <div className="evolution-entry__arrow">
                      <i className="fas fa-arrow-down"></i>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="evolution-form">
        <h4 className="evolution-form__title">
          {editingIndex !== null ? 'Edit Evolution Entry' : 'Add New Evolution Entry'}
        </h4>

        <div className="evolution-form__section">
          <h5 className="evolution-form__section-title">Evolution Image</h5>
          <FileUpload
            onUploadSuccess={handleImageUpload}
            initialImageUrl={formData.image || null}
            buttonText="Upload Evolution Image"
            folder="evolution-images"
          />
          <FormInput
            label="Or enter image URL"
            name="image"
            type="url"
            value={formData.image || ''}
            onChange={handleInputChange}
            placeholder="https://example.com/image.png"
          />
        </div>

        <div className="evolution-form__section">
          <h5 className="evolution-form__section-title">Species Information</h5>
          <div className="evolution-form__row">
            <FormInput
              label="Species 1"
              name="species1"
              value={formData.species1 || ''}
              onChange={handleInputChange}
              placeholder="Primary species name"
            />
            <FormInput
              label="Species 2 (optional)"
              name="species2"
              value={formData.species2 || ''}
              onChange={handleInputChange}
              placeholder="Secondary species name"
            />
            <FormInput
              label="Species 3 (optional)"
              name="species3"
              value={formData.species3 || ''}
              onChange={handleInputChange}
              placeholder="Tertiary species name"
            />
          </div>
        </div>

        <div className="evolution-form__section">
          <h5 className="evolution-form__section-title">Type Information</h5>
          <div className="evolution-form__row">
            {[1, 2, 3, 4, 5].map(num => (
              <FormSelect
                key={num}
                label={`Type ${num}${num === 1 ? '' : ' (optional)'}`}
                name={`type${num}`}
                value={formData[`type${num}` as keyof EvolutionEntry] as string || ''}
                onChange={handleInputChange}
                options={TYPE_OPTIONS}
                placeholder="-- Select Type --"
              />
            ))}
          </div>
        </div>

        <div className="evolution-form__section">
          <h5 className="evolution-form__section-title">Additional Properties</h5>
          <div className="evolution-form__row">
            <FormSelect
              label="Attribute"
              name="attribute"
              value={formData.attribute || ''}
              onChange={handleInputChange}
              options={ATTRIBUTE_OPTIONS}
              placeholder="-- Select Attribute --"
            />
          </div>
        </div>

        <div className="evolution-form__section">
          <h5 className="evolution-form__section-title">Evolution Method</h5>
          <div className="evolution-form__row">
            <FormInput
              label="Evolution Method"
              name="evolution_method"
              value={formData.evolution_method || ''}
              onChange={handleInputChange}
              placeholder="e.g., Level up, Trade, Stone evolution"
            />
            <FormInput
              label="Level (optional)"
              name="level"
              type="number"
              value={formData.level || ''}
              onChange={handleInputChange}
              placeholder="Required level"
              min={1}
              max={100}
            />
          </div>
          <div className="evolution-form__row">
            <FormInput
              label="Item/Condition Key (optional)"
              name="key"
              value={formData.key || ''}
              onChange={handleInputChange}
              placeholder="e.g., item, location, time"
            />
            <FormInput
              label="Item/Condition Data (optional)"
              name="data"
              value={formData.data || ''}
              onChange={handleInputChange}
              placeholder="e.g., Aurora Evolution Stone, Mt. Silver, Night"
            />
          </div>
        </div>

        <div className="evolution-form__actions">
          {editingIndex !== null ? (
            <>
              <button
                type="button"
                className="button primary"
                onClick={handleUpdateEntry}
              >
                <i className="fas fa-save"></i>
                Update Entry
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setEditingIndex(null);
                  resetForm();
                }}
              >
                <i className="fas fa-times"></i>
                Cancel Edit
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button primary"
              onClick={handleAddEntry}
            >
              <i className="fas fa-plus"></i>
              Add Evolution Entry
            </button>
          )}
        </div>
      </div>

      <div className="evolution-editor__actions">
        <button
          className="button primary"
          onClick={handleSave}
        >
          <i className="fas fa-save"></i>
          Save Evolution Data
        </button>
        <button
          className="button secondary"
          onClick={onCancel}
        >
          <i className="fas fa-times"></i>
          Cancel
        </button>
      </div>
    </div>
  );
};
