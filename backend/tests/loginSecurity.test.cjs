const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { getLoginSecurityConfig, getTrustProxyHops } = require("../dist/config/loginSecurity.js");
const { createLoginRateLimiter } = require("../dist/middleware/loginRateLimit.middleware.js");

const environmentKeys = [
  "LOGIN_MAX_FAILED_ATTEMPTS",
  "LOGIN_FAILED_ATTEMPT_WINDOW_MINUTES",
  "LOGIN_LOCKOUT_MINUTES",
  "LOGIN_RATE_LIMIT_MAX",
  "LOGIN_RATE_LIMIT_WINDOW_MINUTES",
  "TRUST_PROXY_HOPS",
];
const originalEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of environmentKeys) {
    const original = originalEnvironment[key];
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
});

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  headers: {},
  setHeader(name, value) { this.headers[name] = String(value); },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("login security configuration uses bounded defaults for invalid values", () => {
  process.env.LOGIN_MAX_FAILED_ATTEMPTS = "0";
  process.env.LOGIN_LOCKOUT_MINUTES = "invalid";
  process.env.LOGIN_RATE_LIMIT_MAX = "20000";

  assert.deepEqual(getLoginSecurityConfig(), {
    maxFailedAttempts: 5,
    failedAttemptWindowMinutes: 15,
    lockoutMinutes: 15,
    ipRateLimitMax: 20,
    ipRateLimitWindowMinutes: 15,
  });
  process.env.TRUST_PROXY_HOPS = "invalid";
  assert.equal(getTrustProxyHops(), 0);
  process.env.TRUST_PROXY_HOPS = "1";
  assert.equal(getTrustProxyHops(), 1);
});

test("login rate limiter blocks an IP until its fixed window expires", () => {
  let currentTime = 1_000;
  const auditEvents = [];
  const middleware = createLoginRateLimiter({
    maxRequests: 2,
    windowMilliseconds: 10_000,
    now: () => currentTime,
    auditEventRecorder: async (event) => { auditEvents.push(event); },
  });
  const request = { ip: "203.0.113.10", socket: {} };
  let allowed = 0;

  middleware(request, createResponse(), () => { allowed += 1; });
  middleware(request, createResponse(), () => { allowed += 1; });
  const blockedResponse = createResponse();
  middleware(request, blockedResponse, () => { allowed += 1; });

  assert.equal(allowed, 2);
  assert.equal(blockedResponse.statusCode, 429);
  assert.equal(blockedResponse.headers["Retry-After"], "10");
  assert.match(blockedResponse.body.message, /too many login requests/i);
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].action, "AUTH_LOGIN_RATE_LIMITED");
  assert.equal(auditEvents[0].ipAddress, "203.0.113.10");

  currentTime += 10_000;
  middleware(request, createResponse(), () => { allowed += 1; });
  assert.equal(allowed, 3);
});

test("login rate limiter tracks different IP addresses independently", () => {
  const middleware = createLoginRateLimiter({
    maxRequests: 1,
    windowMilliseconds: 10_000,
    now: () => 1_000,
    auditEventRecorder: async () => undefined,
  });
  let allowed = 0;
  middleware({ ip: "203.0.113.10", socket: {} }, createResponse(), () => { allowed += 1; });
  middleware({ ip: "203.0.113.11", socket: {} }, createResponse(), () => { allowed += 1; });
  assert.equal(allowed, 2);
});
