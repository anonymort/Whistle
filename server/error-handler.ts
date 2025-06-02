import type { Request, Response, NextFunction } from "express";
import { auditLogger } from "./audit";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class ValidationError extends Error {
  statusCode = 400;
  code = "VALIDATION_ERROR";
  isOperational = true;
  
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  code = "AUTHENTICATION_ERROR";
  isOperational = true;
  
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = "AUTHORIZATION_ERROR";
  isOperational = true;
  
  constructor(message: string = "Insufficient permissions") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  code = "RATE_LIMIT_EXCEEDED";
  isOperational = true;
  
  constructor(message: string = "Too many requests") {
    super(message);
    this.name = "RateLimitError";
  }
}

// Global error handler
export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction): void {
  // Log error for audit purposes
  auditLogger.log({
    userId: (req.session as any)?.adminId || 'anonymous',
    action: 'error_occurred',
    resource: req.path,
    details: {
      error: err.name,
      message: err.message,
      statusCode: err.statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't expose sensitive error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  
  let errorResponse: any = {
    error: err.isOperational ? err.message : "Internal server error",
    code: err.code || "INTERNAL_ERROR"
  };

  // Add stack trace in development
  if (isDevelopment && err.stack) {
    errorResponse.stack = err.stack;
  }

  // Specific error handling
  if (err.name === 'ValidationError' && (err as ValidationError).field) {
    errorResponse.field = (err as ValidationError).field;
  }

  res.status(statusCode).json(errorResponse);
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}