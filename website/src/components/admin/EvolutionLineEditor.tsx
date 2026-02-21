import { useState, useEffect } from 'react';
import { type EvolutionEntry } from '@services/fakemonService';
import { AutocompleteInput, type AutocompleteOption } from '@components/common/AutocompleteInput';
import speciesService from '@services/speciesService';
import '../../styles/admin/evolution-line-editor.css';

const EVOLUTION_METHODS = ['level', 'item', 'condition', 'trade', 'friendship', 'location', 'other'];

function useFakemonOptions(): AutocompleteOption[] {
  const [options, setOptions] = useState<AutocompleteOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    speciesService.getSpecies('fakemon', { page: 1, limit: 9999 }).then((res) => {
      if (cancelled) return;
      const opts: AutocompleteOption[] = res.species.map((f) => ({
        name: String(f.name ?? ''),
        value: Number(f.number ?? 0),
        description: `#${f.number}`,
        _type1: f.type1 as string | undefined,
        _type2: f.type2 as string | null | undefined,
      }));
      setOptions(opts);
    }).catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, []);

  return options;
}

// ── Shared autocomplete for evolvesFrom / evolvesTo fields ────────

interface FakemonAutocompleteFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
}

export function FakemonAutocompleteField({ label, value, onChange, helpText }: FakemonAutocompleteFieldProps) {
  const options = useFakemonOptions();

  return (
    <AutocompleteInput
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Type to search fakemon..."
      helpText={helpText}
    />
  );
}

// ── Evolution line editor ─────────────────────────────────────────

interface EvolutionLineEditorProps {
  value: EvolutionEntry[];
  onChange: (value: EvolutionEntry[]) => void;
}

function EvolutionEntryRow({
  entry,
  index,
  fakemonOptions,
  onUpdate,
  onRemove,
}: {
  entry: EvolutionEntry;
  index: number;
  fakemonOptions: AutocompleteOption[];
  onUpdate: (index: number, entry: EvolutionEntry) => void;
  onRemove: (index: number) => void;
}) {
  const update = (field: string, raw: string | number | null) => {
    onUpdate(index, { ...entry, [field]: raw });
  };

  const handleFakemonSelect = (option: AutocompleteOption | null) => {
    if (option) {
      const ext = option as AutocompleteOption & { _type1?: string; _type2?: string | null };
      onUpdate(index, {
        ...entry,
        name: option.name,
        number: Number(option.value ?? 0),
        type1: ext._type1 ?? entry.type1,
        type2: ext._type2 ?? entry.type2,
      });
    }
  };

  const handleEvolvesFromSelect = (option: AutocompleteOption | null) => {
    if (option) {
      update('evolves_from', Number(option.value ?? 0));
    }
  };

  return (
    <div className="evo-entry">
      <div className="evo-entry__header">
        <span className="evo-entry__number">#{index + 1}</span>
        <button type="button" className="button danger small" onClick={() => onRemove(index)}>
          <i className="fas fa-trash"></i>
        </button>
      </div>
      <div className="evo-entry__fields">
        <div className="evo-entry__field evo-entry__field--wide">
          <label>Fakemon</label>
          <AutocompleteInput
            value={entry.name ?? ''}
            onChange={(v) => update('name', v)}
            options={fakemonOptions}
            placeholder="Search fakemon..."
            onSelect={handleFakemonSelect}
          />
        </div>
        <div className="evo-entry__field">
          <label>Method</label>
          <select
            value={entry.method ?? ''}
            onChange={(e) => update('method', e.target.value || null)}
          >
            <option value="">None</option>
            {EVOLUTION_METHODS.map((m) => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="evo-entry__field">
          <label>Method Detail</label>
          <input
            type="text"
            value={entry.method_detail ?? ''}
            onChange={(e) => update('method_detail', e.target.value || null)}
            placeholder="e.g. Level 36, Fire Stone"
          />
        </div>
        {entry.method === 'level' && (
          <div className="evo-entry__field">
            <label>Level</label>
            <input
              type="number"
              value={entry.level ?? ''}
              onChange={(e) => update('level', e.target.value === '' ? null : Number(e.target.value))}
              min={1}
              placeholder="Level"
            />
          </div>
        )}
        <div className="evo-entry__field evo-entry__field--wide">
          <label>Evolves From</label>
          <AutocompleteInput
            value={
              fakemonOptions.find((o) => Number(o.value) === entry.evolves_from)?.name
              ?? (entry.evolves_from != null ? String(entry.evolves_from) : '')
            }
            onChange={() => { /* controlled via onSelect */ }}
            options={fakemonOptions}
            placeholder="Search pre-evolution..."
            onSelect={handleEvolvesFromSelect}
          />
        </div>
      </div>
    </div>
  );
}

export function EvolutionLineEditor({ value, onChange }: EvolutionLineEditorProps) {
  const entries: EvolutionEntry[] = Array.isArray(value) ? value : [];
  const fakemonOptions = useFakemonOptions();

  const addEntry = () => {
    onChange([...entries, { number: 0, name: '' }]);
  };

  const updateEntry = (index: number, entry: EvolutionEntry) => {
    const updated = [...entries];
    updated[index] = entry;
    onChange(updated);
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="evo-line-editor">
      <div className="evo-line-editor__header">
        <label className="form-label">Evolution Line</label>
        <button type="button" className="button small" onClick={addEntry}>
          <i className="fas fa-plus"></i> Add Stage
        </button>
      </div>
      {entries.length === 0 && (
        <p className="evo-line-editor__empty">No evolution stages defined.</p>
      )}
      {entries.map((entry, i) => (
        <EvolutionEntryRow
          key={i}
          entry={entry}
          index={i}
          fakemonOptions={fakemonOptions}
          onUpdate={updateEntry}
          onRemove={removeEntry}
        />
      ))}
      {entries.length > 1 && (
        <div className="evo-line-editor__preview">
          <strong>Preview:</strong> {entries.map((e) => e.name || '???').join(' → ')}
        </div>
      )}
    </div>
  );
}
