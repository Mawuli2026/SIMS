import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import PasswordInput from '../../components/auth/PasswordInput';
import LoadingButton from '../../components/auth/LoadingButton';
import { isValidEmail } from '../../utils/validation';
import { LoginFormValues } from '../../types/auth.types';

const LoginPage: React.FC = () => {
  const [formValues, setFormValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formValues.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(formValues.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!formValues.password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsLoading(false);
    alert('Login successful — dashboard access granted by role.');
    setFormValues({ email: '', password: '' });
    setErrors({});
    setShowPassword(false);
  };

  return (
    <AuthLayout title="">
      <div style={styles.header}>
        <div style={styles.logoContainer}>
          <img src="/sims-logo.png" alt="SIMS logo" style={styles.logo} />
        </div>
        <p style={styles.subtitle}>Sign in with your email and password to access the dashboard.</p>
      </div>
      <form onSubmit={handleSubmit} noValidate style={styles.form}>
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

          <PasswordInput
            label="Password"
            name="password"
            value={formValues.password}
            onChange={handleChange}
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((prev) => !prev)}
            error={errors.password}
          />

          <div style={styles.footerRow}>
            <Link to="/forgot-password" style={styles.link}>Forgot password?</Link>
          </div>

          <LoadingButton isLoading={isLoading} type="submit">Log in</LoadingButton>

          <p style={styles.ctaText}>
            Don&apos;t have an account? <Link to="/register" style={styles.link}>Create account</Link>
          </p>
        </form>
    </AuthLayout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  field: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#E6EEF8',
    fontWeight: 600,
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
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  logo: {
    width: '110px',
    maxWidth: '100%',
    height: 'auto',
  },
  subtitle: {
    margin: 0,
    color: '#F97316',
    textAlign: 'center',
    lineHeight: 1.6,
    fontSize: '15px',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '20px',
  },
  link: {
    color: '#2563EB',
    textDecoration: 'none',
    fontWeight: 600,
  },
  form: {
    width: '100%',
    maxWidth: '360px',
    margin: '0 auto',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '110px',
    height: '110px',
    background: '#FFF7ED',
    borderRadius: '24px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
    padding: '12px',
  },
  ctaText: {
    marginTop: '12px',
    textAlign: 'center',
    color: '#B9C9E6',
    fontSize: '14px',
  },
  error: {
    display: 'block',
    marginTop: '8px',
    color: '#DC2626',
    fontSize: '14px',
  },
};

export default LoginPage;
