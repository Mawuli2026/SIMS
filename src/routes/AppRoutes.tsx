import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardPage from '../pages/auth/DashboardPage';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/change-password" element={<ChangePasswordPage />} />
    <Route path="/dashboard/*" element={<DashboardPage />} />
    <Route path="/" element={<Navigate replace to="/login" />} />
    <Route path="*" element={<Navigate replace to="/login" />} />
  </Routes>
);

export default AppRoutes;
