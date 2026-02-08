import React from 'react';

const FormCheckbox = ({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  error,
  helpText,
  ...props
}) => {
  return (
    <div className="form-group">
      <div className="form-checkbox-group">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={`form-checkbox${error ? 'has-error' : ''}`}
          {...props}
        />
        
        {label && (
          <label htmlFor={name} className="form-checkbox-label">
            {label}
          </label>
        )}
      </div>
      
      {error && <div className="form-error">{error}</div>}
      {helpText && <div className="form-help">{helpText}</div>}
    </div>
  );
};

export default FormCheckbox;
