import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './AutocompleteInput.css';

/**
 * AutocompleteInput component with suggestions dropdown and validation indicator
 *
 * @param {Object} props
 * @param {string} props.id - Input id
 * @param {string} props.name - Input name for form handling
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Change handler (receives event-like object with { target: { name, value } })
 * @param {Array<string|{name: string, description: string}>} props.options - Array of options (strings or objects with name/description)
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.label - Label text
 * @param {string} props.helpText - Help text shown below input
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {string} props.className - Additional class names
 * @param {boolean} props.showDescriptionBelow - For abilities: show description below the selected value
 * @param {Function} props.onDescriptionFound - Callback when description is found for current value
 * @param {Function} props.onSelect - Callback when a valid option is selected (receives the full option object with name, description, value)
 */
const AutocompleteInput = ({
  id,
  name,
  value = '',
  onChange,
  options = [],
  placeholder = '',
  label = '',
  helpText = '',
  required = false,
  disabled = false,
  className = '',
  showDescriptionBelow = false,
  onDescriptionFound,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isValid, setIsValid] = useState(true);
  const [currentDescription, setCurrentDescription] = useState('');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const justSelectedRef = useRef(false);

  // Normalize options to always have { name, description, value } format
  // Memoize to prevent infinite re-render loops
  const normalizedOptions = useMemo(() =>
    options.map(opt =>
      typeof opt === 'string'
        ? { name: opt, description: '', value: undefined, matchNames: [] }
        : { description: '', value: undefined, matchNames: [], ...opt }
    ), [options]);

  // Check if current value matches any option (case-insensitive)
  // Also checks matchNames (aliases) so base names validate without decorators
  const checkValidity = useCallback((val) => {
    if (!val || val.trim() === '') {
      setIsValid(true);
      setCurrentDescription('');
      return null;
    }

    // First try exact match on display name
    let match = normalizedOptions.find(
      opt => opt.name.toLowerCase() === val.toLowerCase()
    );

    // If no exact match, try matchNames (aliases like base trainer/monster name)
    if (!match) {
      match = normalizedOptions.find(
        opt => opt.matchNames?.some(alias => alias.toLowerCase() === val.toLowerCase())
      );
    }

    setIsValid(!!match);

    if (match) {
      setCurrentDescription(match.description || '');
      if (onDescriptionFound) {
        onDescriptionFound(match.description || '');
      }
    } else {
      setCurrentDescription('');
      if (onDescriptionFound) {
        onDescriptionFound('');
      }
    }

    return match || null;
  }, [normalizedOptions, onDescriptionFound]);

  // Filter options based on input value (searches display name and matchNames)
  useEffect(() => {
    if (!value || value.trim() === '') {
      setFilteredOptions(normalizedOptions.slice(0, 20)); // Show first 20 when empty
    } else {
      const lowerVal = value.toLowerCase();
      const filtered = normalizedOptions.filter(opt =>
        opt.name.toLowerCase().includes(lowerVal) ||
        opt.matchNames?.some(alias => alias.toLowerCase().includes(lowerVal))
      );
      setFilteredOptions(filtered.slice(0, 20)); // Limit to 20 suggestions
    }
    checkValidity(value);
  }, [value, normalizedOptions, checkValidity]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    justSelectedRef.current = false;
    onChange({ target: { name, value: newValue } });
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow click on dropdown item
    setTimeout(() => {
      setIsOpen(false);
      // Skip if an option was just selected via click/keyboard
      if (justSelectedRef.current) {
        justSelectedRef.current = false;
        return;
      }
      const match = checkValidity(value);
      // If matched via alias (matchNames), auto-fill with full display name
      if (match && match.name.toLowerCase() !== value.toLowerCase()) {
        onChange({ target: { name, value: match.name } });
      }
      // If value matches an option on blur, fire onSelect
      if (onSelect && match) {
        onSelect(match);
      }
    }, 200);
  };

  const handleOptionClick = (option) => {
    justSelectedRef.current = true;
    onChange({ target: { name, value: option.name } });
    setIsOpen(false);
    setHighlightedIndex(-1);
    checkValidity(option.name);
    if (onSelect) {
      onSelect(option);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`autocomplete-input-container ${className}`}>
      {label && (
        <label htmlFor={id} className="autocomplete-label">
          {label}
          {required && <span className="required-indicator"> *</span>}
        </label>
      )}

      <div className="autocomplete-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`autocomplete-input ${!isValid && value ? 'invalid' : ''}`}
          autoComplete="off"
        />

        {/* Validation indicator */}
        {value && !isValid && (
          <span className="validation-indicator invalid" title="Value not in list">
            <i className="fas fa-exclamation-circle"></i>
          </span>
        )}

        {value && isValid && (
          <span className="validation-indicator valid" title="Valid value">
            <i className="fas fa-check-circle"></i>
          </span>
        )}

        {/* Dropdown suggestions */}
        {isOpen && filteredOptions.length > 0 && (
          <div ref={dropdownRef} className="autocomplete-dropdown">
            {filteredOptions.map((option, index) => (
              <div
                key={option.name}
                className={`autocomplete-option ${
                  highlightedIndex === index ? 'highlighted' : ''
                } ${value.toLowerCase() === option.name.toLowerCase() ? 'selected' : ''}`}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="option-name">{option.name}</span>
                {option.description && (
                  <span className="option-description">{option.description}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No matches message */}
        {isOpen && filteredOptions.length === 0 && value && (
          <div ref={dropdownRef} className="autocomplete-dropdown">
            <div className="autocomplete-no-matches">
              No matching options found
            </div>
          </div>
        )}
      </div>

      {/* Description display below input (for abilities) */}
      {showDescriptionBelow && currentDescription && (
        <div className="autocomplete-description-display">
          <i className="fas fa-info-circle"></i>
          <span>{currentDescription}</span>
        </div>
      )}

      {/* Help text */}
      {helpText && (
        <small className="autocomplete-help-text">{helpText}</small>
      )}
    </div>
  );
};

export default AutocompleteInput;
