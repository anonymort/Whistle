import { pgTable, text, serial, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  encryptedMessage: text("encrypted_message").notNull(),
  encryptedFile: text("encrypted_file"),
  replyEmail: text("reply_email"),
  hospitalTrust: text("hospital_trust"),
  sha256Hash: text("sha256_hash").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
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

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  encryptedMessage: true,
  encryptedFile: true,
  replyEmail: true,
  hospitalTrust: true,
  sha256Hash: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  action: true,
  resource: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
