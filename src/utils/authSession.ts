import { ApiUser } from "../types/auth.types";
import { UserProfile } from "../types/dashboard.types";

export const AUTH_TOKEN_KEY = "sims-auth-token";
export const AUTH_USER_KEY = "sims-auth-user";

export const toUserProfile = (user: ApiUser): UserProfile => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  role: user.role,
  dateJoined: new Date(user.createdAt).toLocaleDateString(),
  initial: user.firstName.charAt(0).toUpperCase(),
});

export const saveSession = (token: string, user: ApiUser) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(toUserProfile(user)));
};

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getStoredUser = (): UserProfile | null => {
  try {
    const value = localStorage.getItem(AUTH_USER_KEY);
    if (!value) return null;
    const user = JSON.parse(value) as UserProfile;
    return user.fullName && user.email && (user.role === "Admin" || user.role === "Cashier") ? user : null;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};
