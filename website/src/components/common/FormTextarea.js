import React from 'react';

const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  rows = 4,
  ...props
}) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`form-input ${error ? 'has-error' : ''}`}
        {...props}
      />
      
      {error && <div className="form-error">{error}</div>}
      {helpText && <div className="form-help">{helpText}</div>}
    </div>
  );
};

export default FormTextarea;
