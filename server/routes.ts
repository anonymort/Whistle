import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubmissionSchema } from "@shared/schema";
import crypto from "crypto";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { getAdminPublicKey, decryptData, rotateAdminKeys } from "./encryption";
import { verifyPassword } from "./auth";

// File signature validation for security
function validateFileSignature(signature: Buffer): boolean {
  const validSignatures = [
    // Images
    [0xFF, 0xD8, 0xFF], // JPEG
    [0x89, 0x50, 0x4E, 0x47], // PNG
    [0x47, 0x49, 0x46, 0x38], // GIF
    [0x52, 0x49, 0x46, 0x46], // WEBP/RIFF
    // Documents
    [0x25, 0x50, 0x44, 0x46], // PDF
    [0x50, 0x4B, 0x03, 0x04], // ZIP/DOCX/XLSX
    [0xD0, 0xCF, 0x11, 0xE0], // DOC/XLS
    // Audio
    [0x49, 0x44, 0x33], // MP3
    [0x52, 0x49, 0x46, 0x46], // WAV
    [0x4F, 0x67, 0x67, 0x53], // OGG
  ];

  return validSignatures.some(validSig => 
    validSig.every((byte, index) => signature[index] === byte)
  );
}

// Rate limiters
const submitRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: "Too many submissions. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts per 15 minutes
  message: { error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Session configuration
function setupSession(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const sessionTtl = 4 * 60 * 60 * 1000; // 4 hours for admin sessions
  const pgStore = connectPg(session);
  
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "admin_sessions",
  });

  app.use(session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'strict'
    },
    name: 'whistlelite_admin_session'
  }));
}

// Authentication middleware
const requireAdminAuth: RequestHandler = (req, res, next) => {
  const session = req.session as any;
  if (!session || !session.isAdminAuthenticated || !session.adminId) {
    return res.status(401).json({ error: "Unauthorized access" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup secure session management
  setupSession(app);
  // Apply rate limiting to submission endpoint
  app.use("/api/submit", submitRateLimit);

  // Setup automated data retention cleanup (runs daily)
  setInterval(async () => {
    try {
      const deletedCount = await storage.purgeOldSubmissions();
      if (deletedCount > 0) {
        console.log(`Automated cleanup: Purged ${deletedCount} old submissions`);
      }
    } catch (error) {
      console.error("Automated cleanup failed:", error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours

  // Submit encrypted whistleblowing report
  app.post("/api/submit", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertSubmissionSchema.parse(req.body);

      // Additional validation
      if (!validatedData.encryptedMessage || validatedData.encryptedMessage.length < 10) {
        return res.status(400).json({ error: "Invalid message content" });
      }

      // Enhanced file validation if present
      if (validatedData.encryptedFile) {
        try {
          // Parse the encrypted file data
          const encryptedData = JSON.parse(validatedData.encryptedFile);
          
          // Validate the encrypted data structure
          if (!encryptedData.data || !encryptedData.algorithm) {
            return res.status(400).json({ error: "Invalid encrypted file structure." });
          }
          
          const fileBuffer = Buffer.from(encryptedData.data, 'base64');
          
          // For very large encrypted payloads, reject regardless (4MB limit)
          if (fileBuffer.length > 4 * 1024 * 1024) {
            return res.status(413).json({ error: "Encrypted file data too large." });
          }
          
          // Validate file signature for security
          if (fileBuffer.length > 4) {
            const signature = fileBuffer.slice(0, 4);
            if (!validateFileSignature(signature)) {
              return res.status(400).json({ error: "Invalid or unsupported file type" });
            }
          }
          
        } catch (error) {
          console.error("File validation error:", error);
          return res.status(400).json({ error: "Invalid encrypted file format." });
        }
      }

      // Validate email format if provided
      if (validatedData.replyEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(validatedData.replyEmail)) {
          return res.status(400).json({ error: "Invalid email format" });
        }
      }

      // Create submission hash for deduplication
      const submissionHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(validatedData))
        .digest('hex');

      const submissionData = {
        ...validatedData,
        sha256Hash: submissionHash,
      };

      // Store the submission
      const submission = await storage.createSubmission(submissionData);

      // Clean up old submissions (90-day retention)
      await storage.purgeOldSubmissions();

      res.status(201).json({ 
        message: "Submission received successfully",
        id: submission.id,
        submittedAt: submission.submittedAt 
      });

    } catch (error) {
      console.error("Submission error:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid submission data" });
      }
      
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const submissionCount = await storage.getSubmissionCount();
      res.json({ 
        status: "healthy",
        submissionCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ status: "unhealthy", error: "Storage error" });
    }
  });

  // Data purge endpoint (for admin use)
  app.post("/api/purge", async (req, res) => {
    try {
      const purgedCount = await storage.purgeOldSubmissions();
      res.json({ 
        message: `Purged ${purgedCount} old submissions`,
        purgedCount 
      });
    } catch (error) {
      console.error("Purge error:", error);
      res.status(500).json({ error: "Purge operation failed" });
    }
  });

  // Admin authentication with proper session management
  app.post("/api/admin/login", adminLoginRateLimit, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      // Get credentials from environment variables
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminUsername || !adminPassword) {
        console.error("Admin credentials not configured in environment variables");
        return res.status(500).json({ error: "Server configuration error" });
      }
      
      // Verify credentials with secure hashing and timing-attack resistant comparison
      const usernameValid = crypto.timingSafeEqual(
        Buffer.from(username),
        Buffer.from(adminUsername)
      );
      
      const passwordValid = verifyPassword(password, adminPassword);
      
      if (usernameValid && passwordValid) {
        // Create secure session
        const session = req.session as any;
        session.isAdminAuthenticated = true;
        session.adminId = crypto.randomUUID();
        session.loginTime = new Date();
        
        res.json({ 
          success: true, 
          message: "Authentication successful",
          sessionId: session.adminId
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", requireAdminAuth, async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie('whistlelite_admin_session');
        res.json({ success: true, message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Check admin session status
  app.get("/api/admin/status", (req, res) => {
    const session = req.session as any;
    res.json({ 
      authenticated: !!(session && session.isAdminAuthenticated),
      sessionId: session?.adminId || null
    });
  });

  // Admin endpoints - all protected with authentication
  app.get("/api/admin/submissions", requireAdminAuth, async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Admin submissions error:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
      const submissionCount = await storage.getSubmissionCount();
      res.json({ submissionCount });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/submission/:id", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid submission ID" });
      }
      
      const submission = await storage.getSubmissionById(id);
      
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      res.json(submission);
    } catch (error) {
      console.error("Admin submission detail error:", error);
      res.status(500).json({ error: "Failed to fetch submission" });
    }
  });

  // Decrypt submission content for admin
  app.post("/api/admin/decrypt", requireAdminAuth, async (req, res) => {
    try {
      const { encryptedData } = req.body;
      
      if (!encryptedData) {
        return res.status(400).json({ error: "No encrypted data provided" });
      }
      
      // Use the new encryption system
      const { decryptData } = await import("./encryption");
      const decryptedText = await decryptData(encryptedData);
      
      res.json({ decryptedText });
    } catch (error) {
      console.error("Decryption error:", error);
      res.status(500).json({ error: "Decryption failed" });
    }
  });

  // Admin file download endpoint
  app.get("/api/admin/download/:submissionId", requireAdminAuth, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.submissionId);
      if (isNaN(submissionId)) {
        return res.status(400).json({ error: "Invalid submission ID" });
      }
      
      const submission = await storage.getSubmissionById(submissionId);
      
      if (!submission || !submission.encryptedFile) {
        return res.status(404).json({ error: "File not found" });
      }

      // Decrypt the file
      const { decryptData } = await import("./encryption");
      const decryptedFileData = await decryptData(submission.encryptedFile);
      
      // Parse the file data (it should contain filename, mimetype, and data)
      const fileInfo = JSON.parse(decryptedFileData);
      const fileBuffer = Buffer.from(fileInfo.data, 'base64');
      
      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename || 'attachment'}"`);
      res.setHeader('Content-Type', fileInfo.mimetype || 'application/octet-stream');
      res.setHeader('Content-Length', fileBuffer.length);
      
      res.send(fileBuffer);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Download failed" });
    }
  });

  // Get admin public key for client encryption
  app.get("/api/admin/public-key", async (req, res) => {
    try {
      const { getAdminPublicKey } = await import("./encryption");
      const publicKey = getAdminPublicKey();
      
      if (!publicKey) {
        return res.status(500).json({ error: "Public key not available" });
      }
      
      res.json({ publicKey });
    } catch (error) {
      console.error("Public key retrieval error:", error);
      res.status(500).json({ error: "Failed to get public key" });
    }
  });

  // Rotate admin keys (security endpoint)
  app.post("/api/admin/rotate-keys", requireAdminAuth, async (req, res) => {
    try {
      const { rotateAdminKeys } = await import("./encryption");
      const newKeys = await rotateAdminKeys();
      
      res.json({ 
        message: "Keys rotated successfully",
        publicKey: newKeys.encryptionKeys.publicKey
      });
    } catch (error) {
      console.error("Key rotation error:", error);
      res.status(500).json({ error: "Key rotation failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
