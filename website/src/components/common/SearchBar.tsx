import { useState, useEffect, ChangeEvent } from 'react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounceTime?: number;
}

export function SearchBar({
  placeholder = 'Search...',
  value = '',
  onChange,
  debounceTime = 300,
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(value);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== value) {
        onChange(searchTerm);
      }
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [searchTerm, value, onChange, debounceTime]);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  return (
    <div className="search-bar">
      <div className="autocomplete-input-wrapper">
        <i className="fa-solid fa-search search-bar-icon" />
        <input
          type="text"
          className="input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleChange}
        />
        {searchTerm && (
          <button
            type="button"
            className="button icon ghost search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <i className="fa-solid fa-times" />
          </button>
        )}
      </div>
    </div>
  );
}
