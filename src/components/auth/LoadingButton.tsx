import React from 'react';

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

const LoadingButton: React.FC<LoadingButtonProps> = ({ isLoading, children, onClick, type = 'button' }) => (
  <button type={type} onClick={onClick} disabled={isLoading} style={{ ...styles.button, opacity: isLoading ? 0.75 : 1 }}>
    {isLoading ? (
      <span style={styles.spinner} aria-label="Loading" />
    ) : null}
    <span>{children}</span>
  </button>
);

const styles: Record<string, React.CSSProperties> = {
  button: {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderRadius: '14px',
    border: 'none',
    background: '#2563EB',
    color: '#FFFFFF',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255, 255, 255, 0.4)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

export default LoadingButton;
