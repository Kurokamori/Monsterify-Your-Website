import { useMemo, useState, useCallback } from 'react';
import { AutocompleteInput, AutocompleteOption } from './AutocompleteInput';

interface Monster {
  id: string | number;
  name: string;
  level?: number;
  types?: string[];
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
}

interface MonsterAutocompleteProps {
  monsters: Monster[];
  selectedMonsterId?: string | number | null;
  onSelect: (value: string | number | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showTypes?: boolean;
  returnName?: boolean;
  allowFreeText?: boolean;
  id?: string;
  name?: string;
  noPadding?: boolean;
}

export function MonsterAutocomplete({
  monsters,
  selectedMonsterId,
  onSelect,
  label = 'Monster',
  placeholder = 'Type to search monsters...',
  required = false,
  disabled = false,
  showTypes = true,
  returnName = false,
  allowFreeText = false,
  id,
  name,
  noPadding = false,
}: MonsterAutocompleteProps) {
  const getMonsterTypes = useCallback((monster: Monster): string[] => {
    if (monster.types && monster.types.length > 0) {
      return monster.types;
    }
    const types: string[] = [];
    if (monster.type1) types.push(monster.type1);
    if (monster.type2) types.push(monster.type2);
    if (monster.type3) types.push(monster.type3);
    if (monster.type4) types.push(monster.type4);
    if (monster.type5) types.push(monster.type5);
    return types;
  }, []);

  const formatMonsterDisplay = useCallback((monster: Monster): string => {
    let display = monster.name;
    const extras: string[] = [];

    if (monster.level !== undefined) {
      extras.push(`Lv. ${monster.level}`);
    }

    if (showTypes) {
      const types = getMonsterTypes(monster);
      if (types.length > 0) {
        extras.push(types.join('/'));
      }
    }

    if (extras.length > 0) {
      display += ` (${extras.join(', ')})`;
    }

    return display;
  }, [showTypes, getMonsterTypes]);

  const options: AutocompleteOption[] = useMemo(() => {
    return monsters.map((monster) => ({
      name: formatMonsterDisplay(monster),
      value: monster.id,
      matchNames: [monster.name],
    }));
  }, [monsters, formatMonsterDisplay]);

  const selectedMonster = useMemo(() => {
    if (!selectedMonsterId) return null;
    return monsters.find((m) => m.id === selectedMonsterId);
  }, [monsters, selectedMonsterId]);

  const [inputValue, setInputValue] = useState(
    selectedMonster ? formatMonsterDisplay(selectedMonster) : ''
  );

  const handleChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSelect = useCallback(
    (option: AutocompleteOption | null) => {
      if (option) {
        onSelect(returnName ? option.matchNames?.[0] ?? option.name : option.value ?? null);
      } else if (allowFreeText && inputValue) {
        onSelect(returnName ? inputValue : null);
      } else {
        onSelect(null);
      }
    },
    [onSelect, returnName, allowFreeText, inputValue]
  );

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
      disabled={disabled}
      noPadding={noPadding}
      onSelect={handleSelect}
    />
  );
}
