import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component for displaying a monster attribute badge
 * @param {Object} props - Component props
 * @param {string} props.attribute - The monster attribute
 * @returns {JSX.Element} - Rendered component
 */
const AttributeBadge = ({ attribute }) => {
  if (!attribute) return null;
  
  const formattedAttribute = attribute.toLowerCase();
  
  return (
    <span className={`attribute-badge attribute-${formattedAttribute}`}>
      {attribute}
    </span>
  );
};

AttributeBadge.propTypes = {
  attribute: PropTypes.string.isRequired
};

export default AttributeBadge;
