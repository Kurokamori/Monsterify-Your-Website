import { useState, useRef, useEffect, useCallback, KeyboardEvent, ChangeEvent } from 'react';

export interface AutocompleteOption {
  name: string;
  value?: string | number;
  description?: string;
  matchNames?: string[];
}

interface AutocompleteInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | AutocompleteOption)[];
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  noPadding?: boolean;
  showDescriptionBelow?: boolean;
  onDescriptionFound?: (description: string | null) => void;
  onSelect?: (option: AutocompleteOption | null) => void;
}

const MAX_DISPLAYED_OPTIONS = 20;

export function AutocompleteInput({
  id,
  name,
  value,
  onChange,
  options,
  label,
  placeholder = 'Type to search...',
  helpText,
  required = false,
  disabled = false,
  noPadding = false,
  showDescriptionBelow = false,
  onDescriptionFound,
  onSelect,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isValid, setIsValid] = useState(false);
  const [currentDescription, setCurrentDescription] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizeOptions = useCallback((opts: (string | AutocompleteOption)[]): AutocompleteOption[] => {
    return opts.map((opt) =>
      typeof opt === 'string' ? { name: opt, value: opt } : opt
    );
  }, []);

  const findMatch = useCallback((searchValue: string, opts: AutocompleteOption[]): AutocompleteOption | null => {
    const lowerValue = searchValue.toLowerCase();
    return opts.find((opt) => {
      if (opt.name.toLowerCase() === lowerValue) return true;
      if (opt.matchNames?.some((alias) => alias.toLowerCase() === lowerValue)) return true;
      return false;
    }) || null;
  }, []);

  const filterOptions = useCallback((searchValue: string, opts: AutocompleteOption[]): AutocompleteOption[] => {
    if (!searchValue) return opts.slice(0, MAX_DISPLAYED_OPTIONS);
    const lowerValue = searchValue.toLowerCase();
    return opts
      .filter((opt) => {
        if (opt.name.toLowerCase().includes(lowerValue)) return true;
        if (opt.matchNames?.some((alias) => alias.toLowerCase().includes(lowerValue))) return true;
        return false;
      })
      .slice(0, MAX_DISPLAYED_OPTIONS);
  }, []);

  useEffect(() => {
    const normalized = normalizeOptions(options);
    const match = findMatch(value, normalized);
    setIsValid(!!match);

    const desc = match?.description || null;
    setCurrentDescription(desc);
    onDescriptionFound?.(desc);

    if (isOpen) {
      setFilteredOptions(filterOptions(value, normalized));
    }
  }, [value, options, isOpen, normalizeOptions, findMatch, filterOptions, onDescriptionFound]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    const normalized = normalizeOptions(options);
    setFilteredOptions(filterOptions(value, normalized));
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    const normalized = normalizeOptions(options);
    const match = findMatch(value, normalized);

    if (match && match.name !== value) {
      onChange(match.name);
    }

    onSelect?.(match);
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    onChange(option.name);
    setIsOpen(false);
    onSelect?.(option);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={`form-group${noPadding ? ' form-group--no-padding' : ''}`} ref={wrapperRef}>
      {label && (
        <label htmlFor={id || name} className="form-label">
          {label}
          {required && <span className="required-indicator"> *</span>}
        </label>
      )}
      <div className="autocomplete-input-wrapper">
        <input
          ref={inputRef}
          id={id || name}
          name={name}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="input"
          autoComplete="off"
        />
        {value && (
          <span className={`validation-indicator ${isValid ? 'valid' : 'invalid'}`}>
            {isValid ? (
              <i className="fa-solid fa-check" />
            ) : (
              <i className="fa-solid fa-exclamation" />
            )}
          </span>
        )}
        {isOpen && !disabled && (
          <div className="autocomplete-dropdown">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value ?? option.name}
                  className={`autocomplete-option${
                    index === highlightedIndex ? ' highlighted' : ''
                  }${option.name === value ? ' selected' : ''}`}
                  onMouseDown={() => handleOptionClick(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="option-name">{option.name}</span>
                  {option.description && (
                    <span className="option-description">{option.description}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="autocomplete-no-matches">No matches found</div>
            )}
          </div>
        )}
      </div>
      {showDescriptionBelow && currentDescription && (
        <div className="autocomplete-description-display">
          <i className="fa-solid fa-info-circle" />
          <span>{currentDescription}</span>
        </div>
      )}
      {helpText && <div className="form-help-text">{helpText}</div>}
    </div>
  );
}
