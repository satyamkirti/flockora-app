import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Only "mock" is implemented in Phase 3 Sprint 3.1. Extending this enum is how a future
  // provider (e.g. "gemini") gets registered — see src/providers/providerFactory.ts.
  AI_PROVIDER: z.enum(['mock']).default('mock'),

  MAX_UPLOAD_MB: z.coerce.number().positive().max(25).default(8),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().positive().default(15),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),

  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),

  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:19006')
    .transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Report which variables are invalid by name only — never echo process.env values,
    // since a misconfigured secret could otherwise leak into startup logs.
    const invalidKeys = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    // eslint-disable-next-line no-console
    console.error(`[startup] Invalid or missing environment variables: ${invalidKeys}`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
