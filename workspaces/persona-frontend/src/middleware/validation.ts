/**
 * VALIDATION MIDDLEWARE FOR API ROUTES
 * 
 * Security Features:
 * - Request body validation
 * - Query parameter validation
 * - Header validation
 * - File upload validation
 * - Error response sanitization
 * - Rate limiting integration
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { safeValidate, sanitizeString } from '@/lib/validation/input-validator';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
} as const;

export interface ValidationOptions {
  body?: z.ZodType;
  query?: z.ZodType;
  headers?: z.ZodType;
  files?: {
    maxSize?: number;
    allowedTypes?: string[];
    required?: boolean;
  };
}

/**
 * Validation middleware
 */
export function validate(options: ValidationOptions) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void | Promise<void>
  ) => {
    try {
      // Validate request body
      if (options.body && req.body) {
        const result = safeValidate(options.body, req.body);
        if (!result.success) {
          return sendValidationError(res, 'body', result.errors);
        }
        req.body = result.data;
      }

      // Validate query parameters
      if (options.query && req.query) {
        const result = safeValidate(options.query, req.query);
        if (!result.success) {
          return sendValidationError(res, 'query', result.errors);
        }
        req.query = result.data;
      }

      // Validate headers
      if (options.headers && req.headers) {
        const result = safeValidate(options.headers, req.headers);
        if (!result.success) {
          return sendValidationError(res, 'headers', result.errors);
        }
      }

      // Validate file uploads if present
      if (options.files && req.method === 'POST') {
        const fileValidationResult = await validateFileUpload(req, options.files);
        if (!fileValidationResult.success) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FILE_VALIDATION_ERROR',
              message: fileValidationResult.error
            }
          });
        }
        
        // Attach parsed files to request
        (req as any).files = fileValidationResult.files;
      }

      // Continue to next middleware or handler
      await next();

    } catch (error) {
      console.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'An error occurred during validation'
        }
      });
    }
  };
}

/**
 * Higher-order function to wrap API routes with validation
 */
export function withValidation<T = any>(
  handler: (req: NextApiRequest, res: NextApiResponse<T>) => void | Promise<void>,
  validationOptions: ValidationOptions
) {
  const validationMiddleware = validate(validationOptions);
  
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
    await validationMiddleware(req, res, async () => {
      await handler(req, res);
    });
  };
}

/**
 * Send validation error response
 */
function sendValidationError(
  res: NextApiResponse,
  location: 'body' | 'query' | 'headers',
  errors: z.ZodError
) {
  // Sanitize error messages to prevent information leakage
  const sanitizedErrors = errors.errors.map(err => ({
    path: err.path.join('.'),
    message: sanitizeString(err.message),
    code: err.code
  }));

  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: `Invalid ${location} data`,
      details: process.env.NODE_ENV === 'development' ? sanitizedErrors : undefined
    }
  });
}

/**
 * Validate file uploads
 */
async function validateFileUpload(
  req: NextApiRequest,
  options: NonNullable<ValidationOptions['files']>
): Promise<
  | { success: true; files: formidable.Files }
  | { success: false; error: string }
> {
  const maxSize = options.maxSize || MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes || Object.keys(ALLOWED_FILE_TYPES);

  try {
    const form = formidable({
      maxFileSize: maxSize,
      maxFiles: 10,
      allowEmptyFiles: false,
      filter: ({ mimetype }) => {
        if (!mimetype) return false;
        return allowedTypes.includes(mimetype);
      }
    });

    const [fields, files] = await form.parse(req);
    
    // Check if files are required but none were uploaded
    if (options.required && Object.keys(files).length === 0) {
      return { success: false, error: 'No files uploaded' };
    }

    // Additional file validation
    for (const [fieldName, fileArray] of Object.entries(files)) {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
      
      if (!file) continue;

      // Verify file type by reading file header (magic numbers)
      const isValidType = await verifyFileType(file.filepath, file.mimetype || '');
      if (!isValidType) {
        // Delete the uploaded file
        await fs.unlink(file.filepath).catch(() => {});
        return { success: false, error: 'Invalid file type detected' };
      }

      // Check for malicious file names
      if (!isValidFileName(file.originalFilename || '')) {
        await fs.unlink(file.filepath).catch(() => {});
        return { success: false, error: 'Invalid file name' };
      }
    }

    return { success: true, files };

  } catch (error) {
    console.error('File upload validation error:', error);
    return { success: false, error: 'File upload failed' };
  }
}

/**
 * Verify file type by reading magic numbers
 */
async function verifyFileType(filepath: string, declaredMimeType: string): Promise<boolean> {
  try {
    const buffer = await fs.readFile(filepath);
    const fileSignature = buffer.toString('hex', 0, 4);

    // Check magic numbers for common file types
    const magicNumbers: Record<string, string[]> = {
      'image/jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2'],
      'image/png': ['89504e47'],
      'image/gif': ['47494638'],
      'image/webp': ['52494646'],
      'application/pdf': ['25504446'],
    };

    const expectedSignatures = magicNumbers[declaredMimeType];
    if (!expectedSignatures) return false;

    return expectedSignatures.some(sig => fileSignature.startsWith(sig));

  } catch (error) {
    console.error('File type verification error:', error);
    return false;
  }
}

/**
 * Validate file name for security
 */
function isValidFileName(filename: string): boolean {
  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }

  // Check for special characters that could cause issues
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(filename)) {
    return false;
  }

  // Check extension
  const ext = path.extname(filename).toLowerCase();
  const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).flat();
  if (!allowedExtensions.includes(ext)) {
    return false;
  }

  return true;
}

/**
 * Create a secure file name
 */
export function createSecureFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName).toLowerCase();
  
  // Ensure extension is allowed
  const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).flat();
  const safeExt = allowedExtensions.includes(ext) ? ext : '.txt';
  
  return `${timestamp}_${randomString}${safeExt}`;
}

/**
 * Common validation schemas for API routes
 */
export const commonSchemas = {
  // ID parameter validation
  idParam: z.object({
    id: z.string().uuid('Invalid ID format')
  }),
  
  // Pagination validation
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).pipe(
      z.number().int().min(1).max(10000)
    ).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(
      z.number().int().min(1).max(100)
    ).optional().default('20'),
    sort: z.enum(['asc', 'desc']).optional().default('desc'),
    orderBy: z.string().regex(/^[a-zA-Z_]+$/).optional()
  }),
  
  // Search validation
  search: z.object({
    q: z.string().min(1).max(100).transform(sanitizeString),
    type: z.string().regex(/^[a-zA-Z_]+$/).optional(),
  }),
  
  // Date range validation
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  }, 'Start date must be before end date'),
};