import React from 'react';

const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  icon,
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
      
      <div className={`input-wrapper ${icon ? 'has-icon' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`form-input ${error ? 'has-error' : ''}`}
          {...props}
        />
      </div>
      
      {error && <div className="form-error">{error}</div>}
      {helpText && <div className="form-help">{helpText}</div>}
    </div>
  );
};

export default FormInput;
