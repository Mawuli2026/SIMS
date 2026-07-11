import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
}

const AuthCard: React.FC<AuthCardProps> = ({ children }) => (
  <div style={styles.card}>{children}</div>
);

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: '16px',
    borderRadius: '14px',
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
  },
};

export default AuthCard;
