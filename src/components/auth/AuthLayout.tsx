import React from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => (
  <div style={styles.page}>
    <div style={styles.card}>
      {(title || subtitle) && (
        <div style={styles.header}>
          {title && <h1 style={styles.title}>{title}</h1>}
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundImage: 'url(/Sims-background.png)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center top',
    backgroundSize: 'cover',
    backgroundAttachment: 'fixed',
    padding: '24px 20px',
    overflowY: 'auto',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    minHeight: 'auto',
    borderRadius: '20px',
    padding: '22px',
    background: 'linear-gradient(180deg, #0b1220 0%, #071033 100%)',
    color: '#E6EEF8',
    boxShadow: '0 20px 50px rgba(2, 6, 23, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  header: {
    marginBottom: '12px',
    textAlign: 'center',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    color: '#E6EEF8',
    fontWeight: 700,
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#F97316',
    lineHeight: 1.6,
    fontWeight: 700,
  },
};

export default AuthLayout;
