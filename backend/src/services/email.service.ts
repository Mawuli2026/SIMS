import nodemailer from "nodemailer";
import { EmailConfig, EmailConfigurationError, getEmailConfig } from "../config/email";

interface PasswordResetEmailInput {
  recipientEmail: string;
  recipientName: string;
  resetUrl: string;
  expiresMinutes: number;
}

interface EmailTransport {
  sendMail(message: PasswordResetEmailMessage): Promise<unknown>;
}

export interface PasswordResetEmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

let sharedTransport: EmailTransport | null = null;

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

export const buildPasswordResetEmail = (
  input: PasswordResetEmailInput,
  from: string,
): PasswordResetEmailMessage => {
  const safeName = escapeHtml(input.recipientName);
  const safeUrl = escapeHtml(input.resetUrl);
  return {
    from,
    to: input.recipientEmail,
    subject: "Reset your SIMS password",
    text: [
      `Hello ${input.recipientName},`,
      "",
      "A password reset was requested for your SIMS account.",
      `Open this link to choose a new password: ${input.resetUrl}`,
      `This link expires in ${input.expiresMinutes} minutes and can be used only once.`,
      "",
      "If you did not request this reset, you can ignore this email.",
    ].join("\n"),
    html: `<p>Hello ${safeName},</p>
      <p>A password reset was requested for your SIMS account.</p>
      <p><a href="${safeUrl}">Choose a new password</a></p>
      <p>This link expires in ${input.expiresMinutes} minutes and can be used only once.</p>
      <p>If you did not request this reset, you can ignore this email.</p>`,
  };
};

const createEmailTransport = (config: EmailConfig): EmailTransport => nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: config.secure,
  ...(config.user && config.password ? { auth: { user: config.user, pass: config.password } } : {}),
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
  disableFileAccess: true,
  disableUrlAccess: true,
});

export const sendPasswordResetEmail = async (
  input: PasswordResetEmailInput,
  transport?: EmailTransport,
) => {
  const config = getEmailConfig();
  if (!config) throw new EmailConfigurationError("SMTP email delivery is not configured.");
  const activeTransport = transport ?? (sharedTransport ||= createEmailTransport(config));
  await activeTransport.sendMail(buildPasswordResetEmail(input, config.from));
};
