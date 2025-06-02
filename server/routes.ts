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
import { verifyPassword, hashPassword } from "./auth";
import { auditLogger, AUDIT_ACTIONS } from "./audit";
import { generateCSRFToken, csrfProtection } from "./csrf";
import { errorHandler, asyncHandler, ValidationError, AuthenticationError } from "./error-handler";




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

  const sessionTtl = 30 * 60 * 1000; // 30 minutes for admin sessions - reduced for security
  const pgStore = connectPg(session);
  
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
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
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }
  
  // Check if user has admin role
  if (session.userRole !== 'admin') {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

const requireAuth: RequestHandler = (req, res, next) => {
  interface AuthenticatedSession {
    isAdminAuthenticated?: boolean;
    isInvestigatorAuthenticated?: boolean;
    userRole?: string;
    adminId?: string;
    investigatorId?: number;
  }
  
  const session = req.session as any as AuthenticatedSession;
  
  if (!session || (!session.isAdminAuthenticated && !session.isInvestigatorAuthenticated)) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

const requireInvestigatorAuth: RequestHandler = (req, res, next) => {
  const session = req.session as Express.Session & {
    isInvestigatorAuthenticated?: boolean;
    investigatorId?: number;
    userRole?: string;
  };
  
  if (!session || !session.isInvestigatorAuthenticated || !session.investigatorId) {
    res.status(401).json({ error: "Investigator access required" });
    return;
  }
  next();
};

// Store cleanup interval reference to prevent memory leaks
let cleanupInterval: NodeJS.Timeout | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup secure session management
  setupSession(app);
  // Apply rate limiting to submission endpoint
  app.use("/api/submit", submitRateLimit);

  // Setup automated data retention cleanup (runs daily)
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  
  cleanupInterval = setInterval(async () => {
    try {
      const deletedCount = await storage.purgeOldSubmissions();
      if (deletedCount > 0) {
        console.log(`Automated cleanup: Purged ${deletedCount} old submissions`);
      }
    } catch (error) {
      console.error("Automated cleanup failed:", error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours

  // Get CSRF token
  app.get("/api/csrf-token", (req, res) => {
    try {
      const token = generateCSRFToken(req);
      res.json({ csrfToken: token });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate CSRF token" });
    }
  });

  // Submit encrypted whistleblowing report (with CSRF protection)
  app.post("/api/submit", csrfProtection, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = insertSubmissionSchema.parse(req.body);

      // Additional validation
      if (!validatedData.encryptedMessage || validatedData.encryptedMessage.length < 10) {
        res.status(400).json({ error: "Invalid message content" });
        return;
      }

      // Enhanced file validation if present
      if (validatedData.encryptedFile) {
        try {
          // Parse the file data (metadata-stripped only, not encrypted)
          const fileData = JSON.parse(validatedData.encryptedFile);
          
          // Validate the file data structure
          if (!fileData.data || !fileData.filename || !fileData.mimetype) {
            res.status(400).json({ error: "Invalid file data structure." });
            return;
          }
          
          const fileBuffer = Buffer.from(fileData.data, 'base64');
          
          // For very large files, reject (4MB limit)
          if (fileBuffer.length > 4 * 1024 * 1024) {
            res.status(413).json({ error: "File data too large." });
            return;
          }
          
          // Validate file type based on mimetype and extension
          const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
            'application/msword', // .doc
            'text/plain', // .txt
            'text/csv' // .csv
          ];
          
          const allowedExtensions = ['.pdf', '.docx', '.pptx', '.doc', '.txt', '.csv'];
          const fileExtension = fileData.filename.toLowerCase().substring(fileData.filename.lastIndexOf('.'));
          
          if (!allowedTypes.includes(fileData.mimetype) || !allowedExtensions.includes(fileExtension)) {
            res.status(400).json({ error: "Unsupported file type. Only PDF, DOC, DOCX, PPT, CSV, and TXT files are allowed." });
            return;
          }

          // Log file upload for audit trail
          auditLogger.log({
            userId: 'anonymous_user',
            action: 'file_upload',
            resource: 'submission',
            details: {
              filename: fileData.filename,
              mimetype: fileData.mimetype,
              size: fileData.size,
              fileHash: crypto.createHash('sha256').update(fileBuffer).digest('hex')
            }
          });
          
        } catch (error) {
          console.error("File validation error:", error);
          res.status(400).json({ error: "Invalid encrypted file format." });
          return;
        }
      }

      // Validate email format if provided
      if (validatedData.replyEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(validatedData.replyEmail)) {
          res.status(400).json({ error: "Invalid email format" });
          return;
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
        reference: submissionHash.substring(0, 8) // Use hash prefix instead of sequential ID
      });

    } catch (error) {
      console.error("Submission error:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        res.status(400).json({ error: "Invalid submission data" });
        return;
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
  app.post("/api/purge", requireAdminAuth, csrfProtection, async (req, res) => {
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
      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
      
      if (!adminUsername || !adminPasswordHash) {
        console.error("Admin credentials not configured in environment variables");
        return res.status(500).json({ error: "Server configuration error" });
      }
      
      // Verify credentials with secure hashing and timing-attack resistant comparison
      const usernameValid = crypto.timingSafeEqual(
        Buffer.from(username),
        Buffer.from(adminUsername)
      );
      
      const passwordValid = await verifyPassword(password, adminPasswordHash);
      
      if (usernameValid && passwordValid) {
        // Create secure session
        const session = req.session as any;
        session.isAdminAuthenticated = true;
        session.adminId = crypto.randomUUID();
        session.userRole = 'admin';
        session.loginTime = new Date();
        
        // Audit log successful login
        auditLogger.log({
          userId: username,
          action: AUDIT_ACTIONS.ADMIN_LOGIN,
          resource: 'admin_session',
          details: { sessionId: session.adminId },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        res.json({ 
          success: true, 
          message: "Authentication successful",
          sessionId: session.adminId
        });
      } else {
        // Audit log failed login attempt
        auditLogger.log({
          userId: username || 'unknown',
          action: 'admin_login_failed',
          resource: 'admin_session',
          details: { reason: 'invalid_credentials' },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", requireAdminAuth, csrfProtection, async (req, res) => {
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
      const session = req.session as any;
      const submissions = await storage.getAllSubmissions();
      
      // Audit log viewing submissions
      await auditLogger.log({
        userId: session.adminId,
        action: AUDIT_ACTIONS.VIEW_SUBMISSIONS,
        resource: 'submissions',
        details: { count: submissions.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json(submissions);
    } catch (error) {
      console.error("Admin submissions error:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
      const submissionCount = await storage.getSubmissionCount();
      
      auditLogger.log({
        userId: (req.session as any).adminId,
        action: AUDIT_ACTIONS.VIEW_STATS,
        resource: 'statistics',
        details: { submissionCount }
      });
      
      res.json({ 
        submissionCount,
        fileValidationEnabled: true,
        allowedFileTypes: ['PDF', 'DOC', 'DOCX', 'PPT', 'CSV', 'TXT']
      });
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

  // Delete submission
  app.delete("/api/admin/submission/:id", requireAdminAuth, csrfProtection, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid submission ID" });
      }
      
      const submission = await storage.getSubmissionById(id);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }
      
      // Clean up associated files if they exist
      if (submission.encryptedFile) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          // Files are typically stored with submission ID as filename
          const filePath = path.join(process.cwd(), 'uploads', `submission_${id}`);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error("Failed to delete associated file:", fileError);
          // Continue with database deletion even if file cleanup fails
        }
      }
      
      await storage.deleteSubmission(id);
      
      await auditLogger.log({
        userId: (req.session as any).adminId,
        action: AUDIT_ACTIONS.DELETE_SUBMISSION,
        resource: 'submission',
        details: { submissionId: id, originalHash: submission.sha256Hash },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({ message: "Submission deleted successfully" });
    } catch (error) {
      console.error("Delete submission error:", error);
      res.status(500).json({ error: "Failed to delete submission" });
    }
  });

  // Decrypt submission content for admin
  app.post("/api/admin/decrypt", requireAdminAuth, csrfProtection, async (req, res) => {
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

      // Parse the file data directly (no decryption needed - HTTPS provides encryption)
      const fileInfo = JSON.parse(submission.encryptedFile);
      console.log("File info:", {
        filename: fileInfo.filename,
        mimetype: fileInfo.mimetype,
        size: fileInfo.size,
        dataLength: fileInfo.data?.length || 0
      });
      
      const fileBuffer = Buffer.from(fileInfo.data, 'base64');
      console.log("Final buffer length:", fileBuffer.length);
      
      // Set appropriate headers for download with original filename and mimetype
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename || 'attachment'}"`);
      res.setHeader('Content-Type', fileInfo.mimetype || 'application/octet-stream');
      res.setHeader('Content-Length', fileBuffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      
      // Send the buffer directly
      res.end(fileBuffer);
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
  app.post("/api/admin/rotate-keys", requireAdminAuth, csrfProtection, async (req, res) => {
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

  // Case Management API Routes

  // Update submission case details
  app.patch("/api/admin/submission/:id", requireAdminAuth, csrfProtection, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid submission ID" });
      }

      const submission = await storage.updateSubmission(id, updates);
      
      await auditLogger.log({
        userId: (req.session as any).adminId,
        action: "UPDATE_CASE",
        resource: 'submission',
        details: { submissionId: id, updates },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(submission);
    } catch (error) {
      console.error("Update submission error:", error);
      res.status(500).json({ error: "Failed to update submission" });
    }
  });

  // Get case notes for a submission
  app.get("/api/admin/submission/:id/notes", requireAdminAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid submission ID" });
      }

      const notes = await storage.getCaseNotes(id);
      res.json(notes);
    } catch (error) {
      console.error("Get case notes error:", error);
      res.status(500).json({ error: "Failed to fetch case notes" });
    }
  });

  // Add case note
  app.post("/api/admin/submission/:id/notes", requireAdminAuth, csrfProtection, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const { note, noteType, isInternal } = req.body;
      
      if (isNaN(submissionId)) {
        return res.status(400).json({ error: "Invalid submission ID" });
      }

      if (!note) {
        return res.status(400).json({ error: "Note content is required" });
      }

      const caseNote = await storage.createCaseNote({
        submissionId,
        note,
        createdBy: (req.session as any).adminId || 'admin',
        noteType: noteType || 'general',
        isInternal: isInternal || 'true'
      });

      await auditLogger.log({
        userId: (req.session as any).adminId,
        action: "ADD_CASE_NOTE",
        resource: 'case_note',
        details: { submissionId, noteType },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(caseNote);
    } catch (error) {
      console.error("Add case note error:", error);
      res.status(500).json({ error: "Failed to add case note" });
    }
  });

  // Get all investigators
  app.get("/api/admin/investigators", requireAdminAuth, async (req, res) => {
    try {
      const investigators = await storage.getAllInvestigators();
      res.json(investigators);
    } catch (error) {
      console.error("Get investigators error:", error);
      res.status(500).json({ error: "Failed to fetch investigators" });
    }
  });

  // Add new investigator
  app.post("/api/admin/investigators", requireAdminAuth, csrfProtection, async (req, res) => {
    try {
      const { name, email, department } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }

      const investigator = await storage.createInvestigator({
        name,
        email,
        department: department || null,
        isActive: 'true'
      });

      await auditLogger.log({
        userId: (req.session as any).adminId,
        action: "ADD_INVESTIGATOR",
        resource: 'investigator',
        details: { name, email, department },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(investigator);
    } catch (error) {
      console.error("Add investigator error:", error);
      res.status(500).json({ error: "Failed to add investigator" });
    }
  });

  // Update investigator
  app.patch("/api/admin/investigators/:id", requireAdminAuth, csrfProtection, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid investigator ID" });
      }

      const investigator = await storage.updateInvestigator(id, updates);

      await auditLogger.log({
        userId: (req.session as any).adminId,
        action: "UPDATE_INVESTIGATOR",
        resource: 'investigator',
        details: { investigatorId: id, updates },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(investigator);
    } catch (error) {
      console.error("Update investigator error:", error);
      res.status(500).json({ error: "Failed to update investigator" });
    }
  });

  // Send assignment notification email
  app.post("/api/admin/notify-assignment", requireAdminAuth, csrfProtection, async (req, res) => {
    try {
      const { submissionId, investigatorName } = req.body;

      // Find the investigator by name
      const investigators = await storage.getAllInvestigators();
      const investigator = investigators.find(inv => inv.name === investigatorName);
      
      if (!investigator) {
        return res.status(404).json({ error: "Investigator not found" });
      }

      // Get submission details
      const submission = await storage.getSubmissionById(submissionId);
      if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
      }

      // Check if SendGrid is configured
      if (!process.env.SENDGRID_API_KEY) {
        console.warn("SendGrid API key not configured - email notification skipped");
        return res.json({ message: "Assignment completed - email notifications not configured" });
      }

      // Send email notification using SendGrid
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: investigator.email,
          from: 'noreply@whistlelite.nhs.uk', // Replace with verified sender
          subject: `NHS WhistleLite - New Case Assignment #${submissionId}`,
          html: `
            <h2>New Case Assignment</h2>
            <p>Dear ${investigator.name},</p>
            <p>You have been assigned to investigate a new whistleblowing case:</p>
            <ul>
              <li><strong>Case ID:</strong> #${submissionId}</li>
              <li><strong>Priority:</strong> ${submission.priority || 'Standard'}</li>
              <li><strong>Hospital Trust:</strong> ${submission.hospitalTrust || 'Not specified'}</li>
              <li><strong>Submitted:</strong> ${new Date(submission.submittedAt).toLocaleDateString()}</li>
            </ul>
            <p>Please log into the NHS WhistleLite admin portal to review the case details and begin your investigation.</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          `
        };

        await sgMail.send(msg);

        await auditLogger.log({
          userId: (req.session as any).adminId,
          action: "SEND_EMAIL_NOTIFICATION",
          resource: 'notification',
          details: { submissionId, investigatorEmail: investigator.email, investigatorName },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({ message: "Assignment notification sent successfully" });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        res.status(500).json({ error: "Assignment completed but email notification failed" });
      }
    } catch (error) {
      console.error("Error sending assignment notification:", error);
      res.status(500).json({ error: "Failed to process assignment notification" });
    }
  });

  // Investigator Authentication Routes
  app.post("/api/investigator/login", csrfProtection, async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const investigator = await storage.getInvestigatorByEmail(email);
      if (!investigator || !investigator.passwordHash) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await verifyPassword(password, investigator.passwordHash);
      if (!isValidPassword) {
        await auditLogger.log({
          userId: email,
          action: "FAILED_LOGIN_ATTEMPT",
          resource: 'investigator_auth',
          details: { email },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (investigator.isActive !== 'true') {
        return res.status(401).json({ error: "Account inactive" });
      }

      (req.session as any).isInvestigatorAuthenticated = true;
      (req.session as any).investigatorId = investigator.id;
      (req.session as any).investigatorName = investigator.name;
      (req.session as any).userRole = 'investigator';

      await auditLogger.log({
        userId: investigator.id.toString(),
        action: "LOGIN_SUCCESS",
        resource: 'investigator_auth',
        details: { investigatorName: investigator.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ 
        message: "Login successful",
        investigator: {
          id: investigator.id,
          name: investigator.name,
          email: investigator.email,
          department: investigator.department,
          role: 'investigator'
        }
      });
    } catch (error) {
      console.error("Investigator login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Investigator logout
  app.post("/api/investigator/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        res.status(500).json({ error: "Failed to logout" });
        return;
      }
      res.clearCookie('whistlelite_admin_session');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user info (works for both admin and investigator)
  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const session = req.session as any;
      
      if (session.isAdminAuthenticated) {
        res.json({
          id: session.adminId,
          role: 'admin',
          name: 'Administrator'
        });
      } else if (session.isInvestigatorAuthenticated) {
        const investigator = await storage.getInvestigatorById(session.investigatorId);
        res.json({
          id: investigator?.id,
          role: 'investigator',
          name: investigator?.name,
          email: investigator?.email,
          department: investigator?.department
        });
      } else {
        res.status(401).json({ error: "Not authenticated" });
      }
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user info" });
    }
  });

  // Get assigned submissions for investigators
  app.get("/api/investigator/submissions", requireInvestigatorAuth, async (req, res) => {
    try {
      const session = req.session as any;
      const submissions = await storage.getAssignedSubmissions(session.investigatorName);
      
      await auditLogger.log({
        userId: session.investigatorId.toString(),
        action: "VIEW_ASSIGNED_SUBMISSIONS",
        resource: 'submissions',
        details: { count: submissions.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(submissions);
    } catch (error) {
      console.error("Get investigator submissions error:", error);
      res.status(500).json({ error: "Failed to fetch assigned submissions" });
    }
  });

  // Set investigator password (admin only)
  app.post("/api/admin/investigators/:id/password", requireAdminAuth, csrfProtection, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { password } = req.body;

      if (!password || password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const passwordHash = await hashPassword(password);
      await storage.updateInvestigator(id, { passwordHash });

      await auditLogger.log({
        userId: (req.session as any).adminId,
        action: "SET_INVESTIGATOR_PASSWORD",
        resource: 'investigator',
        details: { investigatorId: id },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: "Password set successfully" });
    } catch (error) {
      console.error("Set investigator password error:", error);
      res.status(500).json({ error: "Failed to set password" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
