import { Router } from 'express';
import { analyzeBirdRateLimiter } from '../middleware/rateLimiter';
import { getAIProvider } from '../providers/providerFactory';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { analyzeBirdUpload } from '../validators/analyzeBirdUpload';
import { parseSpeciesHint } from '../validators/analyzeBirdRequest';

export const analyzeBirdRouter = Router();

/**
 * POST /api/v1/analyze-bird
 *
 * multipart/form-data:
 *   - photo (file, required)         — JPEG/PNG/WEBP, size-limited via MAX_UPLOAD_MB
 *   - speciesHint (string, optional) — one of the SpeciesHint values
 *
 * This is the ONLY endpoint that will ever front an AI provider call. It is intentionally
 * mocked in this sprint (see providerFactory / MockAIProvider) — no real AI provider or
 * paid API secret exists anywhere in this codebase yet.
 */
analyzeBirdRouter.post(
  '/analyze-bird',
  analyzeBirdRateLimiter,
  analyzeBirdUpload,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, 'MISSING_FILE', 'A bird photo file is required (field name: "photo").');
    }

    const speciesHint = parseSpeciesHint(req.body?.speciesHint);
    const provider = getAIProvider();

    const result = await provider.analyzeBird({
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      speciesHint,
    });

    // Only safe metadata is logged — never the file bytes, filename content, or request body.
    logger.info('analyze-bird request completed', {
      requestId: req.id,
      route: req.path,
      statusCode: 200,
      provider: provider.name,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    });

    res.status(200).json({
      requestId: req.id,
      provider: provider.name,
      result,
    });
  })
);
