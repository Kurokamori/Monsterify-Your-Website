import React, { useState, useEffect, useMemo } from 'react';
import AutocompleteInput from './AutocompleteInput';

/**
 * TrainerAutocomplete - Autocomplete wrapper for trainer selection
 *
 * @param {Object} props
 * @param {Array} props.trainers - Array of trainer objects with id, name, level, is_owned
 * @param {string|number} props.selectedTrainerId - Currently selected trainer ID
 * @param {Function} props.onSelect - Callback when trainer is selected (receives trainerId)
 * @param {string} props.label - Label text
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {string} props.className - Additional CSS class names
 * @param {boolean} props.showOwnership - Show "(Your Trainer)" suffix for owned trainers
 * @param {string} props.id - HTML id for the input
 * @param {string} props.name - Form field name
 */
const TrainerAutocomplete = ({
  trainers = [],
  selectedTrainerId = '',
  onSelect,
  label = 'Trainer',
  placeholder = 'Type to search trainers...',
  required = false,
  disabled = false,
  className = '',
  showOwnership = false,
  id,
  name = 'trainer'
}) => {
  const [inputValue, setInputValue] = useState('');

  // Build options from trainers
  // Uses trainer.name as the base name for matching; decorators (level, ownership,
  // displaySuffix) are appended to the display name but the base name is preserved
  // in matchNames so users can type just the name and still validate.
  const options = useMemo(() => {
    return trainers.map(trainer => {
      const baseName = trainer.name;
      let displayName = baseName;
      if (trainer.level !== undefined && trainer.level !== null) {
        displayName += ` (Lv. ${trainer.level})`;
      }
      if (showOwnership && trainer.is_owned) {
        displayName += ' - Your Trainer';
      }
      if (trainer.displaySuffix) {
        displayName += ` (${trainer.displaySuffix})`;
      }
      return {
        name: displayName,
        value: trainer.id,
        description: '',
        matchNames: [baseName]
      };
    });
  }, [trainers, showOwnership]);

  // Build a lookup map from trainer ID to display name
  const idToDisplayName = useMemo(() => {
    const map = {};
    options.forEach(opt => {
      map[opt.value] = opt.name;
    });
    return map;
  }, [options]);

  // Sync input value when selectedTrainerId changes externally
  useEffect(() => {
    if (selectedTrainerId && idToDisplayName[selectedTrainerId]) {
      setInputValue(idToDisplayName[selectedTrainerId]);
    } else if (!selectedTrainerId) {
      setInputValue('');
    }
  }, [selectedTrainerId, idToDisplayName]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // If cleared, notify parent
    if (!newValue || newValue.trim() === '') {
      if (onSelect) {
        onSelect('');
      }
    }
  };

  const handleSelect = (option) => {
    if (onSelect && option.value !== undefined) {
      onSelect(option.value);
    }
  };

  return (
    <AutocompleteInput
      id={id}
      name={name}
      value={inputValue}
      onChange={handleChange}
      onSelect={handleSelect}
      options={options}
      placeholder={placeholder}
      label={label}
      required={required}
      disabled={disabled}
      className={className}
    />
  );
};

export default TrainerAutocomplete;
