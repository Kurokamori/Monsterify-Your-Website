import React, { useState, useEffect } from 'react';

/**
 * SearchBar component for filtering data
 * @param {Object} props - Component props
 * @param {string} props.placeholder - Placeholder text for the search input
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Function to call when search value changes
 * @param {number} props.debounceTime - Debounce time in milliseconds (default: 300)
 * @returns {JSX.Element} SearchBar component
 */
const SearchBar = ({ 
  placeholder = 'Search...', 
  value = '', 
  onChange, 
  debounceTime = 300 
}) => {
  const [searchTerm, setSearchTerm] = useState(value);

  // Handle input change
  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const handleClear = () => {
    setSearchTerm('');
    onChange('');
  };

  // Debounce search term changes
  useEffect(() => {
    const handler = setTimeout(() => {
      if (onChange && searchTerm !== value) {
        onChange(searchTerm);
      }
    }, debounceTime);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, value, onChange, debounceTime]);

  // Update local state if value prop changes
  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value);
    }
  }, [value]);

  return (
    <div className="search-bar">
      <div className="autocomplete-input-wrapper">
        <i className="fas fa-search search-bar-icon"></i>
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleChange}
        />
        {searchTerm && (
          <button
            type="button"
            className="button icon danger"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
