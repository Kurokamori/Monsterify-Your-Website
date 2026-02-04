import React, { useState, useEffect, useMemo } from 'react';
import AutocompleteInput from './AutocompleteInput';

/**
 * MonsterAutocomplete - Autocomplete wrapper for monster selection
 *
 * @param {Object} props
 * @param {Array} props.monsters - Array of monster objects with id, name, level, types, etc.
 * @param {string|number} props.selectedMonsterId - Currently selected monster ID
 * @param {Function} props.onSelect - Callback when monster is selected (receives monsterId, or name if returnName is true)
 * @param {string} props.label - Label text
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {string} props.className - Additional CSS class names
 * @param {boolean} props.showTypes - Show type info in display (default true)
 * @param {boolean} props.returnName - If true, onSelect receives monster name instead of ID
 * @param {string} props.id - HTML id for the input
 * @param {string} props.name - Form field name
 * @param {boolean} props.allowFreeText - If true, allows entering text not in the list (for free-text monster names)
 */
const MonsterAutocomplete = ({
  monsters = [],
  selectedMonsterId = '',
  onSelect,
  label = 'Monster',
  placeholder = 'Type to search monsters...',
  required = false,
  disabled = false,
  className = '',
  showTypes = true,
  returnName = false,
  id,
  name = 'monster',
  allowFreeText = false
}) => {
  const [inputValue, setInputValue] = useState('');

  // Build options from monsters
  const options = useMemo(() => {
    return monsters.map(monster => {
      let displayName = monster.name || 'Unknown';
      if (monster.level !== undefined && monster.level !== null) {
        displayName += ` (Lv. ${monster.level}`;
        if (showTypes) {
          const types = monster.types || [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5].filter(Boolean);
          if (types.length > 0) {
            displayName += `, ${types.join('/')}`;
          }
        }
        displayName += ')';
      }
      return {
        name: displayName,
        value: monster.id,
        monsterName: monster.name,
        description: '',
        matchNames: [monster.name || 'Unknown']
      };
    });
  }, [monsters, showTypes]);

  // Build a lookup map from monster ID to display name
  const idToDisplayName = useMemo(() => {
    const map = {};
    options.forEach(opt => {
      map[opt.value] = opt.name;
    });
    return map;
  }, [options]);

  // Sync input value when selectedMonsterId changes externally
  useEffect(() => {
    if (selectedMonsterId && idToDisplayName[selectedMonsterId]) {
      setInputValue(idToDisplayName[selectedMonsterId]);
    } else if (!selectedMonsterId) {
      setInputValue('');
    }
  }, [selectedMonsterId, idToDisplayName]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // If cleared, notify parent
    if (!newValue || newValue.trim() === '') {
      if (onSelect) {
        onSelect('');
      }
    } else if (allowFreeText && onSelect) {
      // In free text mode, always pass the typed value
      onSelect(newValue);
    }
  };

  const handleSelect = (option) => {
    if (onSelect) {
      if (returnName) {
        onSelect(option.monsterName || option.name);
      } else if (option.value !== undefined) {
        onSelect(option.value);
      }
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

export default MonsterAutocomplete;
