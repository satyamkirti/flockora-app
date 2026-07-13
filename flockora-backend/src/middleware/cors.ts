import cors from 'cors';
import { env } from '../config/env';

// Native mobile requests (the only client Flockora has today) do not send an Origin header,
// so CORS does not gate them. This exists for browser-based testing and any future Expo web
// build, allowlisted explicitly via ALLOWED_ORIGINS rather than left wide open.
export const corsMiddleware = cors({
  origin: env.ALLOWED_ORIGINS,
  methods: ['GET', 'POST'],
});
