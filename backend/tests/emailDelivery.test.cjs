const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const {
  assertProductionEmailConfiguration,
  EmailConfigurationError,
  getEmailConfig,
} = require("../dist/config/email.js");
const {
  buildPasswordResetEmail,
  sendPasswordResetEmail,
} = require("../dist/services/email.service.js");

const environmentKeys = [
  "NODE_ENV",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "EMAIL_FROM",
];
const originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));

const clearEmailEnvironment = () => {
  for (const key of environmentKeys.slice(1)) delete process.env[key];
};

afterEach(() => {
  for (const key of environmentKeys) {
    const original = originalEnvironment[key];
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
});

test("email configuration validates SMTP pairing and TLS settings", () => {
  clearEmailEnvironment();
  assert.equal(getEmailConfig(), null);

  process.env.SMTP_HOST = "smtp.example.com";
  process.env.EMAIL_FROM = "SIMS <no-reply@example.com>";
  process.env.SMTP_PORT = "465";
  assert.deepEqual(getEmailConfig(), {
    host: "smtp.example.com",
    port: 465,
    secure: true,
    user: undefined,
    password: undefined,
    from: "SIMS <no-reply@example.com>",
  });

  process.env.SMTP_USER = "smtp-user";
  assert.throws(() => getEmailConfig(), EmailConfigurationError);
});

test("production refuses to start without complete SMTP configuration", () => {
  clearEmailEnvironment();
  process.env.NODE_ENV = "production";
  assert.throws(() => assertProductionEmailConfiguration(), /must be configured/i);

  process.env.SMTP_HOST = "smtp.example.com";
  process.env.EMAIL_FROM = "SIMS <no-reply@example.com>";
  assert.doesNotThrow(() => assertProductionEmailConfiguration());
});

test("password reset email contains safe text and HTML content", () => {
  const message = buildPasswordResetEmail({
    recipientEmail: "employee@example.com",
    recipientName: "Esi <Manager>",
    resetUrl: "https://sims.example.com/reset-password?resetToken=abc&source=email",
    expiresMinutes: 30,
  }, "SIMS <no-reply@example.com>");

  assert.equal(message.to, "employee@example.com");
  assert.match(message.subject, /reset your sims password/i);
  assert.match(message.text, /resetToken=abc&source=email/);
  assert.match(message.text, /30 minutes/);
  assert.match(message.html, /Esi &lt;Manager&gt;/);
  assert.match(message.html, /resetToken=abc&amp;source=email/);
  assert.doesNotMatch(message.html, /Esi <Manager>/);
});

test("password reset delivery sends through the configured reusable transport contract", async () => {
  clearEmailEnvironment();
  process.env.SMTP_HOST = "smtp.example.com";
  process.env.SMTP_PORT = "587";
  process.env.SMTP_SECURE = "false";
  process.env.SMTP_USER = "smtp-user";
  process.env.SMTP_PASSWORD = "smtp-password";
  process.env.EMAIL_FROM = "SIMS <no-reply@example.com>";
  const messages = [];
  const transport = { async sendMail(message) { messages.push(message); return { messageId: "test-message" }; } };

  await sendPasswordResetEmail({
    recipientEmail: "employee@example.com",
    recipientName: "Esi Mensah",
    resetUrl: "https://sims.example.com/reset-password?resetToken=test-token",
    expiresMinutes: 30,
  }, transport);

  assert.equal(messages.length, 1);
  assert.equal(messages[0].from, "SIMS <no-reply@example.com>");
  assert.equal(messages[0].to, "employee@example.com");
});
