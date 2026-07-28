const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const {
  createPasswordResetToken,
  getPasswordResetTtlMinutes,
  hashPasswordResetToken,
} = require("../dist/utils/passwordReset.js");
const {
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../dist/utils/validation.js");

const originalTtl = process.env.PASSWORD_RESET_TTL_MINUTES;

afterEach(() => {
  if (originalTtl === undefined) {
    delete process.env.PASSWORD_RESET_TTL_MINUTES;
  } else {
    process.env.PASSWORD_RESET_TTL_MINUTES = originalTtl;
  }
});

test("password reset tokens are random 256-bit hexadecimal values", () => {
  const firstToken = createPasswordResetToken();
  const secondToken = createPasswordResetToken();

  assert.match(firstToken, /^[a-f0-9]{64}$/);
  assert.match(secondToken, /^[a-f0-9]{64}$/);
  assert.notEqual(firstToken, secondToken);
});

test("password reset tokens are stored as deterministic hashes", () => {
  const token = createPasswordResetToken();
  const hash = hashPasswordResetToken(token);

  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
  assert.equal(hashPasswordResetToken(token), hash);
});

test("password reset expiry uses a safe default for invalid configuration", () => {
  process.env.PASSWORD_RESET_TTL_MINUTES = "invalid";
  assert.equal(getPasswordResetTtlMinutes(), 30);

  process.env.PASSWORD_RESET_TTL_MINUTES = "45";
  assert.equal(getPasswordResetTtlMinutes(), 45);
});

test("forgot-password validation rejects malformed email addresses", () => {
  assert.equal(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success, false);
  assert.equal(forgotPasswordSchema.safeParse({ email: "user@sims.com" }).success, true);
});

test("reset-password validation requires matching passwords and a token", () => {
  assert.equal(resetPasswordSchema.safeParse({
    resetToken: "",
    password: "NewSecret123!",
    confirmPassword: "NewSecret123!",
  }).success, false);

  assert.equal(resetPasswordSchema.safeParse({
    resetToken: "development-token",
    password: "NewSecret123!",
    confirmPassword: "DifferentSecret123!",
  }).success, false);

  assert.equal(resetPasswordSchema.safeParse({
    resetToken: "development-token",
    password: "NewSecret123!",
    confirmPassword: "NewSecret123!",
  }).success, true);
});
