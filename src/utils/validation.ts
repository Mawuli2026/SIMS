export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const doPasswordsMatch = (password: string, confirmPassword: string): boolean => password === confirmPassword;

export const isStrongPassword = (password: string): boolean => password.length >= 8;
