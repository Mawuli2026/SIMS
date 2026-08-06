import React from 'react';

interface PasswordInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  error?: string;
  surface?: 'light' | 'dark';
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  name,
  value,
  onChange,
  showPassword,
  onToggleShow,
  error,
  surface = 'light',
}) => (
  <div className={`password-field password-field--${surface}`}>
    <label htmlFor={name} className="password-label">{label}</label>
    <div className="password-input-wrapper">
      <input
        id={name}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className="password-input"
        style={{ borderColor: error ? '#ef4444' : '#cbd5e1' }}
      />
      <button type="button" className="password-toggle" onClick={onToggleShow}
        aria-label={`${showPassword ? 'Hide' : 'Show'} password`}>
        {showPassword ? 'Hide' : 'Show'}
      </button>
    </div>
    {error && <span id={`${name}-error`} className="password-error">{error}</span>}
  </div>
);

export default PasswordInput;
