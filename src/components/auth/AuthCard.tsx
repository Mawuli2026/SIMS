import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
}

const AuthCard: React.FC<AuthCardProps> = ({ children }) => (
  <div className="auth-card">{children}</div>
);

export default AuthCard;
