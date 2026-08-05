export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
}

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

const configuredPort = () => {
  const value = Number(process.env.SMTP_PORT ?? "587");
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new EmailConfigurationError("SMTP_PORT must be an integer between 1 and 65535.");
  }
  return value;
};

const configuredSecure = (port: number) => {
  const value = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (!value) return port === 465;
  if (value !== "true" && value !== "false") {
    throw new EmailConfigurationError("SMTP_SECURE must be true or false.");
  }
  return value === "true";
};

export const getEmailConfig = (): EmailConfig | null => {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  if (!host && !from) return null;
  if (!host || !from) {
    throw new EmailConfigurationError("SMTP_HOST and EMAIL_FROM must both be configured.");
  }

  const user = process.env.SMTP_USER?.trim() || undefined;
  const password = process.env.SMTP_PASSWORD || undefined;
  if (Boolean(user) !== Boolean(password)) {
    throw new EmailConfigurationError("SMTP_USER and SMTP_PASSWORD must either both be set or both be omitted.");
  }

  const port = configuredPort();
  return { host, port, secure: configuredSecure(port), user, password, from };
};

export const isEmailConfigured = () => getEmailConfig() !== null;

export const assertProductionEmailConfiguration = () => {
  if (process.env.NODE_ENV === "production" && !getEmailConfig()) {
    throw new EmailConfigurationError("SMTP email delivery must be configured in production.");
  }
};
