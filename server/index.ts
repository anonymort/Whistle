import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import { dataRetentionManager } from "./data-retention";
import crypto from "crypto";

// Load environment variables
dotenv.config();

// SECURITY FIX: Enhanced environment variable validation
function validateEnvironment() {
  const requiredVars = ['SESSION_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'DATABASE_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:", missingVars.join(', '));
    process.exit(1);
  }

  // Validate SESSION_SECRET strength
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    console.error("❌ SESSION_SECRET must be at least 32 characters long for security.");
    process.exit(1);
  }

  // Warn about missing optional but recommended variables
  const recommendedVars = ['POSTMARK_API_TOKEN', 'SENDGRID_API_KEY'];
  const missingRecommended = recommendedVars.filter(varName => !process.env[varName]);
  
  if (missingRecommended.length > 0) {
    console.warn("⚠️  Missing recommended environment variables:", missingRecommended.join(', '));
    console.warn("   Email functionality may be limited.");
  }

  // Validate encryption keys are set for production
  const encryptionVars = ['ADMIN_ENCRYPTION_PUBLIC_KEY', 'ADMIN_ENCRYPTION_PRIVATE_KEY', 'ADMIN_SIGNING_PUBLIC_KEY', 'ADMIN_SIGNING_PRIVATE_KEY'];
  const missingEncryption = encryptionVars.filter(varName => !process.env[varName]);
  
  if (process.env.NODE_ENV === 'production' && missingEncryption.length > 0) {
    console.warn("⚠️  Missing encryption keys in production:", missingEncryption.join(', '));
    console.warn("   New keys will be generated but should be set via environment variables.");
  }
}

// Validate required environment variables
validateEnvironment();

const app = express();

// Configure trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// SECURITY FIX: Generate CSP nonce middleware
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// SECURITY FIX: Improved security headers for production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    // SECURITY FIX: More restrictive CSP with proper nonce
    res.setHeader("Content-Security-Policy", 
      "default-src 'self'; " +
      "script-src 'self' 'nonce-" + res.locals.nonce + "'; " +
      "style-src 'self' 'nonce-" + res.locals.nonce + "'; " +
      "img-src 'self' data: blob:; " +
      "connect-src 'self'; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "media-src 'self'; " +
      "frame-src 'none'; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self';"
    );
    next();
  });
} else {
  // Development CSP (more permissive for hot reload)
  app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", 
      "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "connect-src 'self' ws: wss:; " +
      "img-src 'self' data: blob:;"
    );
    next();
  });
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// SECURITY FIX: Improved logging that doesn't expose sensitive data
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Only log non-sensitive endpoints
  const isApiCall = path.startsWith("/api");
  const isSensitiveEndpoint = path.includes('/decrypt') || 
                             path.includes('/submissions') || 
                             path.includes('/private-key') ||
                             path.includes('/download');

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (isApiCall && !isSensitiveEndpoint) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Never log response bodies for security
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    } else if (isApiCall && isSensitiveEndpoint) {
      // Minimal logging for sensitive endpoints
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms [SENSITIVE]`);
    }
  });

  next();
});

(async () => {
  // Initialize encryption system
  const { initializeServerEncryption } = await import("./encryption");
  const encryptionInitialized = await initializeServerEncryption();
  if (!encryptionInitialized) {
    console.error("Failed to initialize encryption system");
    process.exit(1);
  }

  const server = await registerRoutes(app);

  // SECURITY FIX: Improved error handler that doesn't expose sensitive information
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Generic error messages for production
    let message = "Internal Server Error";
    if (status === 400) message = "Bad Request";
    else if (status === 401) message = "Unauthorized";
    else if (status === 403) message = "Forbidden";
    else if (status === 404) message = "Not Found";
    else if (status === 429) message = "Too Many Requests";
    
    // Only expose detailed errors in development
    if (process.env.NODE_ENV === "development") {
      message = err.message || message;
    }

    res.status(status).json({ error: message });
    
    // Log error for debugging (but not to client)
    console.error(`Error ${status}:`, err.message);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
