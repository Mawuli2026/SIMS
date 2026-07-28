import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import PasswordInput from '../../components/auth/PasswordInput';
import LoadingButton from '../../components/auth/LoadingButton';
import { doPasswordsMatch, isStrongPassword } from '../../utils/validation';
import { ResetPasswordFormValues } from '../../types/auth.types';
import { resetAccountPassword } from '../../services/authApi';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('resetToken')?.trim() ?? '';
  const [formValues, setFormValues] = useState<ResetPasswordFormValues>({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
    setServerError('');
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!isStrongPassword(formValues.password)) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }
    if (!doPasswordsMatch(formValues.password, formValues.confirmPassword)) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    if (!resetToken) {
      setServerError('This password reset link is invalid. Request a new link and try again.');
      return;
    }
    setIsLoading(true);
    setServerError('');
    try {
      await resetAccountPassword({ resetToken, ...formValues });
      setCompleted(true);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to reset your password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter a new password and confirm it to complete your reset.">
      <AuthCard>
        <form onSubmit={handleSubmit} noValidate>
          {serverError && <p style={styles.serverError} role="alert">{serverError}</p>}
          {!resetToken && (
            <p style={styles.serverError} role="alert">
              This password reset link is invalid. <Link to="/forgot-password" style={styles.link}>Request a new link</Link>.
            </p>
          )}

          {!completed && resetToken && (
            <>
              <PasswordInput
                label="New Password"
                name="password"
                value={formValues.password}
                onChange={handleChange}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((prev) => !prev)}
                error={errors.password}
              />

              <PasswordInput
                label="Confirm New Password"
                name="confirmPassword"
                value={formValues.confirmPassword}
                onChange={handleChange}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword((prev) => !prev)}
                error={errors.confirmPassword}
              />

              <LoadingButton isLoading={isLoading} type="submit">Reset password</LoadingButton>
            </>
          )}

          {completed && <p style={styles.success}>Your password has been reset. <Link to="/login" style={styles.link}>Sign in now</Link>.</p>}
        </form>
      </AuthCard>
    </AuthLayout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  success: {
    marginTop: '18px',
    color: '#166534',
    fontWeight: 600,
    lineHeight: 1.6,
  },
  link: {
    color: '#2563EB',
    textDecoration: 'none',
    fontWeight: 600,
  },
  serverError: {
    padding: '10px 12px',
    borderRadius: '10px',
    background: '#FEE2E2',
    color: '#B91C1C',
    fontSize: '14px',
  },
};

export default ResetPasswordPage;
