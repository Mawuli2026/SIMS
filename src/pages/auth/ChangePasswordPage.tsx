import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import AuthLayout from "../../components/auth/AuthLayout";
import LoadingButton from "../../components/auth/LoadingButton";
import PasswordInput from "../../components/auth/PasswordInput";
import { changeAccountPassword } from "../../services/authApi";
import { ChangePasswordFormValues } from "../../types/auth.types";
import { clearSession, getAuthToken, getStoredUser, saveSession } from "../../utils/authSession";

const emptyForm: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const token = getAuthToken();
  const storedUser = getStoredUser();
  const isRequired = storedUser?.mustChangePassword === true;
  const [form, setForm] = useState(emptyForm);
  const [showPasswords, setShowPasswords] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!token) return <Navigate replace to="/login" />;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setErrors({});
    setServerError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.currentPassword) nextErrors.currentPassword = "Current password is required.";
    if (form.newPassword.length < 12) nextErrors.newPassword = "New password must be at least 12 characters.";
    if (form.newPassword !== form.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    if (form.currentPassword && form.currentPassword === form.newPassword) nextErrors.newPassword = "New password must be different from your current password.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    setServerError("");
    try {
      const response = await changeAccountPassword(token, form);
      saveSession(response.token, response.user);
      navigate("/dashboard", { replace: true, state: { message: response.message } });
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to change your password.");
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout
      title={isRequired ? "Replace temporary password" : "Change password"}
      subtitle={isRequired
        ? "Create a private password before accessing SIMS. Your temporary password will stop working immediately."
        : "Confirm your current password, then choose a new password."}
    >
      <AuthCard>
        <form onSubmit={handleSubmit} noValidate>
          {isRequired && <p style={styles.notice} role="status">Password change is required before you can continue.</p>}
          {serverError && <p style={styles.error} role="alert">{serverError}</p>}
          <PasswordInput label="Current password" name="currentPassword" value={form.currentPassword}
            onChange={handleChange} showPassword={showPasswords} onToggleShow={() => setShowPasswords(!showPasswords)} error={errors.currentPassword} />
          <PasswordInput label="New password" name="newPassword" value={form.newPassword}
            onChange={handleChange} showPassword={showPasswords} onToggleShow={() => setShowPasswords(!showPasswords)} error={errors.newPassword} />
          <PasswordInput label="Confirm new password" name="confirmPassword" value={form.confirmPassword}
            onChange={handleChange} showPassword={showPasswords} onToggleShow={() => setShowPasswords(!showPasswords)} error={errors.confirmPassword} />
          <p style={styles.hint}>Use at least 12 characters and do not reuse your current password.</p>
          <LoadingButton isLoading={isLoading} type="submit">Change password</LoadingButton>
          <div style={styles.footer}>
            {isRequired
              ? <button type="button" style={styles.linkButton} onClick={signOut}>Sign out</button>
              : <Link to="/dashboard" style={styles.link}>Back to dashboard</Link>}
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  notice: { padding: "10px 12px", borderRadius: "10px", background: "#FFF7ED", color: "#9A3412", fontSize: "14px" },
  error: { padding: "10px 12px", borderRadius: "10px", background: "#FEE2E2", color: "#B91C1C", fontSize: "14px" },
  hint: { color: "#64748B", fontSize: "13px", lineHeight: 1.5, marginTop: "-4px" },
  footer: { textAlign: "center", marginTop: "16px" },
  link: { color: "#2563EB", textDecoration: "none", fontWeight: 600 },
  linkButton: { border: 0, background: "transparent", color: "#2563EB", cursor: "pointer", fontWeight: 600 },
};

export default ChangePasswordPage;
