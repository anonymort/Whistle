import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubmissionSchema } from "@shared/schema";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

// Rate limiter: 5 submissions per minute per IP
const submitRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: "Too many submissions. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to submission endpoint
  app.use("/api/submit", submitRateLimit);

  // Submit encrypted whistleblowing report
  app.post("/api/submit", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertSubmissionSchema.parse(req.body);

      // Additional validation
      if (!validatedData.encryptedMessage || validatedData.encryptedMessage.length < 10) {
        return res.status(400).json({ error: "Invalid message content" });
      }

      // Check file size if present (2MB limit for base64 encoded data)
      if (validatedData.encryptedFile) {
        const fileBuffer = Buffer.from(validatedData.encryptedFile, 'base64');
        if (fileBuffer.length > 2 * 1024 * 1024) {
          return res.status(413).json({ error: "File too large. Maximum size is 2MB." });
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

  // Admin authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123"; // Default for development
      
      if (password === adminPassword) {
        res.json({ success: true, message: "Login successful" });
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/submissions", async (req, res) => {
    try {
      const submissions = await storage.getAllSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Admin submissions error:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const submissionCount = await storage.getSubmissionCount();
      res.json({ submissionCount });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/submission/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
  app.post("/api/admin/decrypt", async (req, res) => {
    try {
      const { encryptedData } = req.body;
      
      if (!encryptedData) {
        return res.status(400).json({ error: "No encrypted data provided" });
      }
      
      // Handle the mock encryption format used in development
      if (encryptedData.startsWith('eyJ')) {
        try {
          const decoded = JSON.parse(atob(encryptedData));
          if (decoded.algorithm === "development-mock-encryption") {
            const decryptedText = atob(decoded.data);
            res.json({ decryptedText });
            return;
          }
        } catch (e) {
          // Fall through to error handling
        }
      }
      
      res.status(400).json({ error: "Unable to decrypt data" });
    } catch (error) {
      console.error("Decryption error:", error);
      res.status(500).json({ error: "Decryption failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
