import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import PasswordInput from '../../components/auth/PasswordInput';
import LoadingButton from '../../components/auth/LoadingButton';
import { doPasswordsMatch, isStrongPassword } from '../../utils/validation';
import { ResetPasswordFormValues } from '../../types/auth.types';

const ResetPasswordPage: React.FC = () => {
  const [formValues, setFormValues] = useState<ResetPasswordFormValues>({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
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
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsLoading(false);
    setCompleted(true);
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter a new password and confirm it to complete your reset.">
      <AuthCard>
        <form onSubmit={handleSubmit} noValidate>
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
};

export default ResetPasswordPage;
