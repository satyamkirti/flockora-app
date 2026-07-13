import express, { Express } from 'express';
import { env } from './config/env';
import { corsMiddleware } from './middleware/cors';
import { securityHeaders } from './middleware/securityHeaders';
import { requestId } from './middleware/requestId';
import { requestTimeout } from './middleware/requestTimeout';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { healthRouter } from './routes/health';
import { analyzeBirdRouter } from './routes/analyzeBird';

export function createApp(): Express {
  const app = express();

  // Order matters: identity + security posture first, then body/size limits, then routes,
  // then 404, then the centralized error handler last (Express requires this ordering for
  // a 4-arg error-handling middleware to be reached).
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(requestId);
  app.use(requestTimeout(env.REQUEST_TIMEOUT_MS));

  // Small limit — this API's only large payload is the multipart file upload, which multer
  // enforces separately via MAX_UPLOAD_MB. JSON/urlencoded bodies here are never expected
  // to be large, so a tight cap guards against unrelated body-based abuse.
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  app.use(healthRouter);
  app.use('/api/v1', analyzeBirdRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
