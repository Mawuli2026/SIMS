import React from 'react';

interface PasswordInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  error?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  name,
  value,
  onChange,
  showPassword,
  onToggleShow,
  error,
}) => (
  <div style={styles.field}>
    <label htmlFor={name} style={styles.label}>{label}</label>
    <div style={styles.inputWrapper}>
      <input
        id={name}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        style={{ ...styles.input, borderColor: error ? '#ef4444' : '#cbd5e1' }}
      />
      <button
        type="button"
        style={styles.toggle}
        onClick={onToggleShow}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        title={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? '🙈' : '👁️'}
      </button>
    </div>
    {error && <span style={styles.error}>{error}</span>}
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  field: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: 'inherit',
    fontWeight: 600,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    width: '100%',
    padding: '10px 40px 10px 12px',
    borderRadius: '12px',
    border: '1px solid #D1D5DB',
    fontSize: '16px',
    outline: 'none',
    color: '#111827',
  },
  toggle: {
    position: 'absolute',
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: '#6B7280',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
    padding: 0,
  },
  error: {
    display: 'block',
    marginTop: '6px',
    color: '#DC2626',
    fontSize: '14px',
  },
};

export default PasswordInput;
