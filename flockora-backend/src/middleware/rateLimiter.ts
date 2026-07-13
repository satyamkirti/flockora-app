import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

/**
 * IP-based rate limiting. This is a temporary architecture, not a complete solution:
 * Flockora has no authentication anywhere yet, so there is no user identity to key a
 * per-user quota on. Per SECURITY.md Rule 7, real per-user quotas (in addition to this
 * global/IP layer) are required once auth exists and a real AI provider is connected —
 * see PROJECT_CONTEXT.md "remaining work before real AI integration".
 */
export const analyzeBirdRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please try again later.'));
  },
});
