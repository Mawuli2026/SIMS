export interface LoginSecurityConfig {
  maxFailedAttempts: number;
  failedAttemptWindowMinutes: number;
  lockoutMinutes: number;
  ipRateLimitMax: number;
  ipRateLimitWindowMinutes: number;
}

const positiveInteger = (value: string | undefined, fallback: number, maximum: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : fallback;
};

export const getLoginSecurityConfig = (): LoginSecurityConfig => ({
  maxFailedAttempts: positiveInteger(process.env.LOGIN_MAX_FAILED_ATTEMPTS, 5, 100),
  failedAttemptWindowMinutes: positiveInteger(process.env.LOGIN_FAILED_ATTEMPT_WINDOW_MINUTES, 15, 1_440),
  lockoutMinutes: positiveInteger(process.env.LOGIN_LOCKOUT_MINUTES, 15, 10_080),
  ipRateLimitMax: positiveInteger(process.env.LOGIN_RATE_LIMIT_MAX, 20, 10_000),
  ipRateLimitWindowMinutes: positiveInteger(process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES, 15, 1_440),
});

export const getTrustProxyHops = () => {
  const parsed = Number(process.env.TRUST_PROXY_HOPS);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 10 ? parsed : 0;
};
