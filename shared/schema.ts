import { pgTable, text, serial, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  encryptedMessage: text("encrypted_message").notNull(),
  encryptedFile: text("encrypted_file"),
  // Hybrid Model - Optional Identity Fields
  contactMethod: varchar("contact_method", { length: 50 }).default("anonymous"), // 'anonymous', 'email', 'anonymous_reply'
  encryptedContactDetails: text("encrypted_contact_details"), // Encrypted email or AnonAddy address
  remainsAnonymous: varchar("remains_anonymous", { length: 10 }).notNull().default("true"),
  // Non-identifying metadata (safe to store)
  hospitalTrust: text("hospital_trust"),
  sha256Hash: text("sha256_hash").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  // Case Management Fields
  status: varchar("status", { length: 50 }).notNull().default("new"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  category: varchar("category", { length: 100 }),
  reportType: varchar("report_type", { length: 100 }),
  evidenceType: varchar("evidence_type", { length: 100 }),
  eventDate: varchar("event_date", { length: 10 }),
  eventTime: varchar("event_time", { length: 8 }),
  riskLevel: varchar("risk_level", { length: 20 }).notNull().default("low"),
  verificationStatus: varchar("verification_status", { length: 50 }).notNull().default("pending"),
  legalReviewStatus: varchar("legal_review_status", { length: 50 }).notNull().default("not_required"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  // Escalation and correspondence tracking
  requiresEscalation: varchar("requires_escalation", { length: 10 }).notNull().default("false"),
  hasOngoingCorrespondence: varchar("has_ongoing_correspondence", { length: 10 }).notNull().default("false"),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const caseNotes = pgTable("case_notes", {
  id: serial("id").primaryKey(),
  submissionId: serial("submission_id").references(() => submissions.id),
  note: text("note").notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  isInternal: varchar("is_internal", { length: 10 }).notNull().default("true"),
  noteType: varchar("note_type", { length: 50 }).notNull().default("general"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const investigators = pgTable("investigators", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  role: varchar("role", { length: 20 }).notNull().default("investigator"),
  isActive: varchar("is_active", { length: 10 }).notNull().default("true"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  encryptedMessage: true,
  encryptedFile: true,
  replyEmail: true,
  hospitalTrust: true,
  sha256Hash: true,
  category: true,
  reportType: true,
  evidenceType: true,
  eventDate: true,
  eventTime: true,
});

export const updateSubmissionSchema = createInsertSchema(submissions).pick({
  status: true,
  priority: true,
  assignedTo: true,
  category: true,
  riskLevel: true,
}).partial();

export const insertCaseNoteSchema = createInsertSchema(caseNotes).pick({
  submissionId: true,
  note: true,
  createdBy: true,
  isInternal: true,
  noteType: true,
});

export const insertInvestigatorSchema = createInsertSchema(investigators).pick({
  name: true,
  email: true,
  department: true,
  passwordHash: true,
  role: true,
  isActive: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  action: true,
  resource: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

// Status and Priority enums
export const CaseStatus = {
  NEW: 'new',
  UNDER_REVIEW: 'under_review',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
} as const;

export const CasePriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

export const RiskLevel = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

export const NoteType = {
  GENERAL: 'general',
  INVESTIGATION: 'investigation',
  COMMUNICATION: 'communication',
  DECISION: 'decision',
  ESCALATION: 'escalation'
} as const;

export const UserRole = {
  ADMIN: 'admin',
  INVESTIGATOR: 'investigator'
} as const;

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type UpdateSubmission = z.infer<typeof updateSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertCaseNote = z.infer<typeof insertCaseNoteSchema>;
export type CaseNote = typeof caseNotes.$inferSelect;
export type InsertInvestigator = z.infer<typeof insertInvestigatorSchema>;
export type Investigator = typeof investigators.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
