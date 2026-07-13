import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

/**
 * Foundation-level timeout guard. If a request has not finished within `timeoutMs`, the
 * client receives a safe 504 rather than hanging indefinitely. This matters once a real AI
 * provider (with real network latency) replaces the mock provider — the mock resolves
 * near-instantly today, so this middleware is architecture-in-place rather than something
 * that currently triggers in normal operation.
 */
export function requestTimeout(timeoutMs: number) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        next(new ApiError(504, 'REQUEST_TIMEOUT', 'The request took too long to process.'));
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}
