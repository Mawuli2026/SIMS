import React from 'react';
import '../../styles/auth.css';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => (
  <main className="auth-page">
    <section className="auth-shell" aria-label={title || 'Sign in to SIMS'}>
      {(title || subtitle) && (
        <div className="auth-header">
          {title && <h1>{title}</h1>}
          {subtitle && <p>{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  </main>
);

export default AuthLayout;
