import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { env } from '../config/environment.js';

/**
 * Base application error with a machine-readable error code and HTTP status.
 *
 * Throw this (or a subclass) from controllers and services so the global
 * error handler can return a structured JSON response with the correct status.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 Bad Request — invalid input, malformed request body, etc. */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: Record<string, string[]>) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

/** 401 Unauthorized — missing or invalid credentials. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/** 403 Forbidden — authenticated but lacks permissions. */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/** 404 Not Found — resource doesn't exist. */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/** 409 Conflict — duplicate resource, state conflict, etc. */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/** 422 Unprocessable Entity — validation failure. */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: Record<string, string[]>) {
    super(message, 422, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/** 429 Too Many Requests. */
export class RateLimitError extends AppError {
  readonly retryAfter: number;

  constructor(retryAfter: number, message = 'Too many requests') {
    super(message, 429, 'RATE_LIMITED');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * 404 handler for unmatched routes.
 *
 * Creates a "Not Found" error with the requested URL and forwards
 * it to the error handler middleware.
 */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
}

/**
 * Global error handler.
 *
 * Catches all errors forwarded via `next(error)` and returns a
 * consistent JSON error response. Handles both AppError instances
 * (with proper status codes) and unexpected errors (as 500s).
 * Stack traces are only included in non-production environments.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Handle our structured AppError instances
  if (err instanceof AppError) {
    const response: Record<string, unknown> = {
      success: false,
      error: err.errorCode,
      message: err.message,
      statusCode: err.statusCode,
    };

    if (err.details) {
      response.details = err.details;
    }

    if (err instanceof RateLimitError) {
      res.setHeader('Retry-After', err.retryAfter);
      response.retryAfter = err.retryAfter;
    }

    if (env.NODE_ENV !== 'production') {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle multer file upload errors
  if (err instanceof multer.MulterError) {
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'File is too large. Maximum file size is 5MB.',
      LIMIT_FILE_COUNT: 'Too many files uploaded.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
      LIMIT_FIELD_KEY: 'Field name is too long.',
      LIMIT_FIELD_VALUE: 'Field value is too long.',
      LIMIT_PART_COUNT: 'Too many parts in the upload.',
    };

    res.status(400).json({
      success: false,
      error: 'UPLOAD_ERROR',
      message: messages[err.code] ?? `Upload error: ${err.message}`,
      statusCode: 400,
    });
    return;
  }

  // Handle multer file filter errors (e.g. invalid file type)
  if (err.message?.includes('Only image files are allowed')) {
    res.status(400).json({
      success: false,
      error: 'UPLOAD_ERROR',
      message: err.message,
      statusCode: 400,
    });
    return;
  }

  // Handle unexpected errors
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  console.error('Unhandled error:', err);

  res.status(statusCode).json({
    success: false,
    error: err.name ?? 'Error',
    message: env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    statusCode,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
