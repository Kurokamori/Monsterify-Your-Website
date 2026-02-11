import React from 'react';

/**
 * Page header component
 * @param {Object} props Component props
 * @param {string} props.title Page title
 * @param {string} props.subtitle Optional subtitle
 * @param {React.ReactNode} props.actions Optional actions (buttons, etc.)
 * @returns {JSX.Element} Page header component
 */
const PageHeader = ({ title, subtitle, actions, children }) => {
  return (
    <div className="lore-header">
      <div className="option-row">
        <div className="page-header-title">
          <h1>{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
};

export default PageHeader;
