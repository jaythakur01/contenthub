import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware to validate request body, query, or params using Zod schema
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validated = schema.parse(data);

      // Replace the original data with validated data
      req[source] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};

        error.errors.forEach((err) => {
          const field = err.path.join('.');
          fieldErrors[field] = err.message;
        });

        return res.status(400).json({
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: fieldErrors
          }
        });
      }

      // Unexpected error
      return res.status(500).json({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  };
}
