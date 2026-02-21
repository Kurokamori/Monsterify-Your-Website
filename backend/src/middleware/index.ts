// Authentication
export {
  authenticate,
  optionalAuth,
  authenticateDiscord,
  authenticateAny,
} from './auth.middleware.js';

// Permissions & Authorization
export {
  requireAdmin,
  requireOwnership,
  requireBotOrigin,
  requireWebOrigin,
} from './permissions.middleware.js';

// Rate Limiting / Cooldowns
export { cooldown, rateLimits } from './cooldown.middleware.js';

// Error Handling
export {
  notFound,
  errorHandler,
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
} from './error.middleware.js';

// File Uploads
export { upload } from './upload.middleware.js';
