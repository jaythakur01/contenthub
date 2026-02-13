import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(err.details && { details: err.details })
      }
    });
  }

  // Handle unexpected errors
  return res.status(500).json({
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    }
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: 'Resource not found',
      code: 'NOT_FOUND'
    }
  });
}
