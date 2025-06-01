import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  encryptedMessage: text("encrypted_message").notNull(),
  encryptedFile: text("encrypted_file"),
  replyEmail: text("reply_email"),
  sha256Hash: text("sha256_hash").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  encryptedMessage: true,
  encryptedFile: true,
  replyEmail: true,
  sha256Hash: true,
});

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
