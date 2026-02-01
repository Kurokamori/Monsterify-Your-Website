import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component for displaying a monster type badge
 * @param {Object} props - Component props
 * @param {string} props.type - The monster type
 * @param {string} props.context - The context of the badge (optional)
 * @returns {JSX.Element} - Rendered component
 */
const TypeBadge = ({ type, context}) => {
  if (!type) return null;
  
  const formattedType = type.toLowerCase();
  
  return (
    <span className={`type-badge type-${formattedType} ${context && `type-badge-${context}`}`}>
      {type}
    </span>
  );
};

TypeBadge.propTypes = {
  type: PropTypes.string.isRequired,
  context: PropTypes.string,
};

export default TypeBadge;
