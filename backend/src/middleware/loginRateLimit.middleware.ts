import { NextFunction, Request, Response } from "express";
import { getLoginSecurityConfig } from "../config/loginSecurity";
import { getAuditRequestContext, recordAuditEvent } from "../services/audit.service";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface LoginRateLimiterOptions {
  maxRequests?: number;
  windowMilliseconds?: number;
  maxEntries?: number;
  now?: () => number;
  auditEventRecorder?: typeof recordAuditEvent;
}

const rateLimitMessage = "Too many login requests from this connection. Try again later.";

export const createLoginRateLimiter = (options: LoginRateLimiterOptions = {}) => {
  const config = getLoginSecurityConfig();
  const maxRequests = options.maxRequests ?? config.ipRateLimitMax;
  const windowMilliseconds = options.windowMilliseconds ?? config.ipRateLimitWindowMinutes * 60_000;
  const maxEntries = options.maxEntries ?? 10_000;
  const now = options.now ?? Date.now;
  const auditEventRecorder = options.auditEventRecorder ?? recordAuditEvent;
  const entries = new Map<string, RateLimitEntry>();

  return (request: Request, response: Response, next: NextFunction) => {
    const currentTime = now();
    const key = request.ip || request.socket.remoteAddress || "unknown";
    let entry = entries.get(key);

    if (!entry || currentTime >= entry.resetAt) {
      if (!entry && entries.size >= maxEntries) {
        for (const [storedKey, storedEntry] of entries) {
          if (currentTime >= storedEntry.resetAt) entries.delete(storedKey);
        }
        if (entries.size >= maxEntries) {
          const oldestKey = entries.keys().next().value as string | undefined;
          if (oldestKey) entries.delete(oldestKey);
        }
      }
      entry = { count: 0, resetAt: currentTime + windowMilliseconds };
      entries.set(key, entry);
    }

    if (entry.count >= maxRequests) {
      void auditEventRecorder({
        action: "AUTH_LOGIN_RATE_LIMITED",
        entityType: "authentication",
        outcome: "failure",
        details: { reason: "ip_rate_limit" },
        ...getAuditRequestContext(request),
      });
      response.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1_000))));
      response.status(429).json({ message: rateLimitMessage });
      return;
    }

    entry.count += 1;
    next();
  };
};

export const loginRateLimit = createLoginRateLimiter();
