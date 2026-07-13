import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ requestId: req.id, code: 'NOT_FOUND', message: 'This endpoint does not exist.' });
}
