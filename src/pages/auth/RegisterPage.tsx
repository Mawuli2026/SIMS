import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import PasswordInput from '../../components/auth/PasswordInput';
import LoadingButton from '../../components/auth/LoadingButton';
import { isValidEmail, doPasswordsMatch, isStrongPassword } from '../../utils/validation';
import { RegisterFormValues, UserRole } from '../../types/auth.types';
import { registerAccount } from '../../services/authApi';

const roles: UserRole[] = ['Admin', 'Cashier'];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState<RegisterFormValues>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Cashier',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
    setServerError('');
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formValues.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!formValues.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!formValues.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!isValidEmail(formValues.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

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
    setIsLoading(true);
    setServerError('');
    try {
      const result = await registerAccount(formValues);
      navigate('/login', { replace: true, state: { message: result.message } });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Account creation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Register as an Admin or Cashier to access the system dashboard.">
      <AuthCard>
        <form onSubmit={handleSubmit} noValidate>
          {serverError && <p style={styles.serverError} role="alert">{serverError}</p>}
          <div style={styles.row}>
            <div style={styles.halfField}>
              <label htmlFor="firstName" style={styles.label}>First Name</label>
              <input
                id="firstName"
                name="firstName"
                value={formValues.firstName}
                onChange={handleChange}
                style={{ ...styles.input, borderColor: errors.firstName ? '#ef4444' : '#cbd5e1' }}
              />
              {errors.firstName && <span style={styles.error}>{errors.firstName}</span>}
            </div>
            <div style={styles.halfField}>
              <label htmlFor="lastName" style={styles.label}>Last Name</label>
              <input
                id="lastName"
                name="lastName"
                value={formValues.lastName}
                onChange={handleChange}
                style={{ ...styles.input, borderColor: errors.lastName ? '#ef4444' : '#cbd5e1' }}
              />
              {errors.lastName && <span style={styles.error}>{errors.lastName}</span>}
            </div>
          </div>

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

          <div style={styles.field}>
            <label htmlFor="role" style={styles.label}>Role</label>
            <select id="role" name="role" value={formValues.role} onChange={handleChange} style={styles.input}>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
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

          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={formValues.confirmPassword}
            onChange={handleChange}
            showPassword={showPassword}
            onToggleShow={() => setShowPassword((prev) => !prev)}
            error={errors.confirmPassword}
          />

          <LoadingButton isLoading={isLoading} type="submit">Create account</LoadingButton>

          <p style={styles.ctaText}>
            Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    marginBottom: '12px',
  },
  halfField: {
    display: 'flex',
    flexDirection: 'column',
  },
  field: {
    marginBottom: '12px',
  },
  label: {
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
  serverError: {
    padding: '10px 12px',
    borderRadius: '10px',
    background: '#FEE2E2',
    color: '#B91C1C',
    fontSize: '14px',
  },
};

export default RegisterPage;
