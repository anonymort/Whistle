import { submissions, auditLogs, type Submission, type InsertSubmission, type AuditLog, type InsertAuditLog } from "@shared/schema";
import { db } from "./db";
import { eq, lt, sql, desc } from "drizzle-orm";

export interface IStorage {
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  purgeOldSubmissions(): Promise<number>;
  getSubmissionCount(): Promise<number>;
  getAllSubmissions(): Promise<Submission[]>;
  getSubmissionById(id: number): Promise<Submission | undefined>;
  deleteSubmission(id: number): Promise<void>;
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getRecentAuditLogs(limit?: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values(insertSubmission)
      .returning();
    
    if (!submission) {
      throw new Error("Failed to create submission");
    }
    return submission;
  }

  async purgeOldSubmissions(): Promise<number> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const result = await db
      .delete(submissions)
      .where(lt(submissions.submittedAt, ninetyDaysAgo));
    
    return result.rowCount || 0;
  }

  async getSubmissionCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(${submissions.id})` })
      .from(submissions);
    return Number(result[0]?.count || 0);
  }

  async getAllSubmissions(): Promise<Submission[]> {
    return await db.select().from(submissions);
  }

  async getSubmissionById(id: number): Promise<Submission | undefined> {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id));
    return submission || undefined;
  }

  async deleteSubmission(id: number): Promise<void> {
    await db.delete(submissions).where(eq(submissions.id, id));
  }

  async createAuditLog(insertAuditLog: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(insertAuditLog)
      .returning();
    
    if (!auditLog) {
      throw new Error("Failed to create audit log");
    }
    return auditLog;
  }

  async getRecentAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
