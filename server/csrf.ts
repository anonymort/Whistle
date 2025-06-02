import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

interface CSRFSession {
  csrfSecret?: string;
}

// Generate CSRF token
export function generateCSRFToken(req: Request): string {
  const session = req.session as CSRFSession;
  
  if (!session.csrfSecret) {
    session.csrfSecret = crypto.randomBytes(32).toString('hex');
  }
  
  const token = crypto.randomBytes(32).toString('hex');
  const hmac = crypto.createHmac('sha256', session.csrfSecret);
  hmac.update(token);
  const signature = hmac.digest('hex');
  
  return `${token}.${signature}`;
}

// Verify CSRF token
export function verifyCSRFToken(req: Request, token: string): boolean {
  const session = req.session as CSRFSession;
  
  if (!session.csrfSecret || !token) {
    return false;
  }
  
  const [tokenPart, signature] = token.split('.');
  if (!tokenPart || !signature) {
    return false;
  }
  
  const hmac = crypto.createHmac('sha256', session.csrfSecret);
  hmac.update(tokenPart);
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// CSRF middleware
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] as string || req.body._csrf;
  
  if (!verifyCSRFToken(req, token)) {
    res.status(403).json({ 
      error: "Invalid CSRF token",
      code: "CSRF_TOKEN_INVALID"
    });
    return;
  }
  
  next();
}