import { useMemo, useState, useCallback, useEffect } from 'react';
import { AutocompleteInput, AutocompleteOption } from './AutocompleteInput';
import api from '../../services/api';

interface Trainer {
  id: string | number;
  name: string;
  level?: number;
  is_owned?: boolean;
  displaySuffix?: string;
}

export interface TrainerAutocompleteProps {
  /** List of trainers to search (optional - will self-fetch if not provided) */
  trainers?: Trainer[];
  /** Selected trainer ID */
  selectedTrainerId?: string | number | null;
  /** Alias for selectedTrainerId - also accepts full trainer object for convenience */
  value?: string | number | Trainer | null;
  /** Callback when trainer is selected (receives ID) */
  onSelect?: (id: string | number | null) => void;
  /** Alias for onSelect */
  onChange?: (id: string | number | null) => void;
  /** Callback when trainer is selected (receives full trainer object) */
  onSelectTrainer?: (trainer: Trainer | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  noPadding?: boolean;
  showOwnership?: boolean;
  id?: string;
  name?: string;
}

export function TrainerAutocomplete({
  trainers: externalTrainers,
  selectedTrainerId,
  value,
  onSelect,
  onChange,
  onSelectTrainer,
  label = 'Trainer',
  placeholder = 'Type to search trainers...',
  required = false,
  disabled = false,
  noPadding = false,
  showOwnership = false,
  id,
  name,
}: TrainerAutocompleteProps) {
  // Self-fetch trainers if not provided
  const [fetchedTrainers, setFetchedTrainers] = useState<Trainer[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (!externalTrainers) {
      setFetchLoading(true);
      api.get('/trainers/all')
        .then(response => {
          setFetchedTrainers(response.data.trainers || response.data.data || response.data || []);
        })
        .catch(() => {
          setFetchedTrainers([]);
        })
        .finally(() => {
          setFetchLoading(false);
        });
    }
  }, [externalTrainers]);

  const trainers = externalTrainers || fetchedTrainers;

  // Support both prop naming conventions and object values
  const resolvedSelectedId = useMemo(() => {
    if (selectedTrainerId != null) return selectedTrainerId;
    if (value == null) return null;
    // If value is an object with id, extract the id
    if (typeof value === 'object' && 'id' in value) return value.id;
    return value;
  }, [selectedTrainerId, value]);

  // Memoize the select handler
  const handleTrainerSelect = useCallback((option: AutocompleteOption | null) => {
    const id = option?.value ?? null;
    // Call ID-based callbacks
    onSelect?.(id);
    onChange?.(id);
    // Call object-based callback if provided
    if (onSelectTrainer) {
      const trainer = id != null ? trainers.find(t => t.id === id) ?? null : null;
      onSelectTrainer(trainer);
    }
  }, [onSelect, onChange, onSelectTrainer, trainers]);

  const formatTrainerDisplay = useCallback((trainer: Trainer): string => {
    let display = trainer.name;
    const extras: string[] = [];

    if (trainer.level !== undefined) {
      extras.push(`Lv. ${trainer.level}`);
    }

    if (extras.length > 0) {
      display += ` (${extras.join(', ')})`;
    }

    if (showOwnership && trainer.is_owned) {
      display += ' - Your Trainer';
    }

    if (trainer.displaySuffix) {
      display += ` (${trainer.displaySuffix})`;
    }

    return display;
  }, [showOwnership]);

  const options: AutocompleteOption[] = useMemo(() => {
    return trainers.map((trainer) => ({
      name: formatTrainerDisplay(trainer),
      value: trainer.id,
      matchNames: [trainer.name],
    }));
  }, [trainers, formatTrainerDisplay]);

  const selectedTrainer = useMemo(() => {
    if (resolvedSelectedId == null) return null;
    return trainers.find((t) => t.id === resolvedSelectedId) ?? null;
  }, [trainers, resolvedSelectedId]);

  const [inputValue, setInputValue] = useState('');

  // Sync input value when selectedTrainer changes
  useEffect(() => {
    setInputValue(selectedTrainer ? formatTrainerDisplay(selectedTrainer) : '');
  }, [selectedTrainer, formatTrainerDisplay]);

  const handleChange = useCallback((newValue: string) => {
    setInputValue(newValue);
  }, []);

  return (
    <AutocompleteInput
      id={id}
      name={name}
      value={inputValue}
      onChange={handleChange}
      options={options}
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled || fetchLoading}
      noPadding={noPadding}
      onSelect={handleTrainerSelect}
    />
  );
}
