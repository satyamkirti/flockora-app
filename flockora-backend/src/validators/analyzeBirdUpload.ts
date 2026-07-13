import multer from 'multer';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Memory storage only — the file is held in-process for the duration of the request and
// never written to disk, never persisted, and never logged (see SECURITY.md Rule 8).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new ApiError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, or WEBP images are allowed.'));
      return;
    }
    callback(null, true);
  },
});

export const analyzeBirdUpload = upload.single('photo');
