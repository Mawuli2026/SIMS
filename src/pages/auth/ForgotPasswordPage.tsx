import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import LoadingButton from '../../components/auth/LoadingButton';
import { isValidEmail } from '../../utils/validation';
import { ForgotPasswordFormValues } from '../../types/auth.types';
import { requestPasswordReset } from '../../services/authApi';

const ForgotPasswordPage: React.FC = () => {
  const [formValues, setFormValues] = useState<ForgotPasswordFormValues>({ email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [serverError, setServerError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ email: event.target.value });
    setSuccessMessage('');
    setResetUrl('');
    setServerError('');
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formValues.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(formValues.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setServerError('');
    try {
      const result = await requestPasswordReset(formValues);
      setSuccessMessage(result.message);
      setResetUrl(result.resetUrl ?? '');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to request a password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="Enter your email to receive a password reset link.">
      <AuthCard>
        <form onSubmit={handleSubmit} noValidate>
          {serverError && <p style={styles.serverError} role="alert">{serverError}</p>}
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              style={{ ...styles.input, borderColor: errors.email ? '#ef4444' : '#cbd5e1' }}
            />
            {errors.email && <span style={styles.error}>{errors.email}</span>}
          </div>

          <LoadingButton isLoading={isLoading} type="submit">Send reset link</LoadingButton>

          {successMessage && <p style={styles.success} role="status">{successMessage}</p>}
          {resetUrl && (
            <p style={styles.developmentLink}>
              Development only: <a href={resetUrl} style={styles.link}>open the password reset page</a>.
            </p>
          )}

          <p style={styles.ctaText}>
            Remembered your password? <Link to="/login" style={styles.link}>Sign in</Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  field: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    color: '#111827',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1px solid #D1D5DB',
    fontSize: '16px',
    outline: 'none',
    color: '#111827',
  },
  success: {
    marginTop: '18px',
    color: '#166534',
    fontWeight: 600,
  },
  developmentLink: {
    marginTop: '12px',
    color: '#6B7280',
    fontSize: '14px',
  },
  serverError: {
    padding: '10px 12px',
    borderRadius: '10px',
    background: '#FEE2E2',
    color: '#B91C1C',
    fontSize: '14px',
  },
  ctaText: {
    marginTop: '12px',
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '14px',
  },
  link: {
    color: '#2563EB',
    textDecoration: 'none',
    fontWeight: 600,
  },
  error: {
    display: 'block',
    marginTop: '8px',
    color: '#DC2626',
    fontSize: '14px',
  },
};

export default ForgotPasswordPage;
