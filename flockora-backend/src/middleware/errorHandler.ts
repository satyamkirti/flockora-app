import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/**
 * Single centralized error handler. Every error in the app — validation, upload, timeout,
 * rate-limit, or unexpected — is funneled here. The client always receives a generic,
 * safe JSON error shape; internals (stack traces, raw error messages, file contents,
 * request bodies) are never sent to the client and never logged. See SECURITY.md Rule 8.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    logger.warn(err.message, { requestId: req.id, route: req.path, statusCode: err.statusCode, code: err.code });
    res.status(err.statusCode).json({ requestId: req.id, code: err.code, message: err.message });
    return;
  }

  if (err instanceof multer.MulterError) {
    const code = err.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR';
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'The uploaded file exceeds the allowed size limit.' : 'The file upload was invalid.';
    logger.warn(message, { requestId: req.id, route: req.path, statusCode: 400, code });
    res.status(400).json({ requestId: req.id, code, message });
    return;
  }

  // Unknown/unexpected error — log only safe metadata, never the error's raw message or stack,
  // since either could incidentally contain request data.
  logger.error('Unhandled server error', { requestId: req.id, route: req.path, statusCode: 500 });
  res.status(500).json({ requestId: req.id, code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' });
}
