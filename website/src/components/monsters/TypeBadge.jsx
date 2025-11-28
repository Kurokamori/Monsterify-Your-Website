import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component for displaying a monster type badge
 * @param {Object} props - Component props
 * @param {string} props.type - The monster type
 * @returns {JSX.Element} - Rendered component
 */
const TypeBadge = ({ type }) => {
  if (!type) return null;
  
  const formattedType = type.toLowerCase();
  
  return (
    <span className={`type-badge type-${formattedType}`}>
      {type}
    </span>
  );
};

TypeBadge.propTypes = {
  type: PropTypes.string.isRequired
};

export default TypeBadge;
