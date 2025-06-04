import { 
  submissions, 
  auditLogs, 
  caseNotes, 
  investigators,
  aliasMapping,
  type Submission, 
  type InsertSubmission, 
  type UpdateSubmission,
  type AuditLog, 
  type InsertAuditLog,
  type CaseNote,
  type InsertCaseNote,
  type Investigator,
  type InsertInvestigator,
  type AliasMapping,
  type InsertAliasMapping
} from "@shared/schema";
import { db } from "./db";
import { eq, lt, sql, desc } from "drizzle-orm";

export interface IStorage {
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  purgeOldSubmissions(): Promise<number>;
  getSubmissionCount(): Promise<number>;
  getAllSubmissions(): Promise<Submission[]>;
  getSubmissionById(id: number): Promise<Submission | undefined>;
  deleteSubmission(id: number): Promise<void>;
  updateSubmission(id: number, updates: UpdateSubmission): Promise<Submission>;
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getRecentAuditLogs(limit?: number): Promise<AuditLog[]>;
  // Case Notes
  createCaseNote(caseNote: InsertCaseNote): Promise<CaseNote>;
  getCaseNotes(submissionId: number): Promise<CaseNote[]>;
  deleteCaseNote(noteId: number): Promise<void>;
  // Investigators
  getAllInvestigators(): Promise<Investigator[]>;
  createInvestigator(investigator: InsertInvestigator): Promise<Investigator>;
  updateInvestigator(id: number, investigator: Partial<InsertInvestigator>): Promise<Investigator>;
  getInvestigatorByEmail(email: string): Promise<Investigator | undefined>;
  getInvestigatorById(id: number): Promise<Investigator | undefined>;
  getAssignedSubmissions(investigatorName: string): Promise<Submission[]>;
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

  async updateSubmission(id: number, updates: UpdateSubmission): Promise<Submission> {
    const updateData = {
      ...updates,
      lastUpdated: new Date()
    };
    
    const [submission] = await db
      .update(submissions)
      .set(updateData)
      .where(eq(submissions.id, id))
      .returning();
    
    if (!submission) {
      throw new Error("Failed to update submission");
    }
    return submission;
  }

  // Case Notes methods
  async createCaseNote(insertCaseNote: InsertCaseNote): Promise<CaseNote> {
    const [caseNote] = await db
      .insert(caseNotes)
      .values(insertCaseNote)
      .returning();
    
    if (!caseNote) {
      throw new Error("Failed to create case note");
    }
    return caseNote;
  }

  async getCaseNotes(submissionId: number): Promise<CaseNote[]> {
    return await db
      .select()
      .from(caseNotes)
      .where(eq(caseNotes.submissionId, submissionId))
      .orderBy(desc(caseNotes.createdAt));
  }

  async deleteCaseNote(noteId: number): Promise<void> {
    await db.delete(caseNotes).where(eq(caseNotes.id, noteId));
  }

  // Investigator methods
  async getAllInvestigators(): Promise<Investigator[]> {
    return await db
      .select()
      .from(investigators)
      .where(eq(investigators.isActive, "true"))
      .orderBy(investigators.name);
  }

  async createInvestigator(insertInvestigator: InsertInvestigator): Promise<Investigator> {
    const [investigator] = await db
      .insert(investigators)
      .values(insertInvestigator)
      .returning();
    
    if (!investigator) {
      throw new Error("Failed to create investigator");
    }
    return investigator;
  }

  async updateInvestigator(id: number, investigatorData: Partial<InsertInvestigator>): Promise<Investigator> {
    const [investigator] = await db
      .update(investigators)
      .set(investigatorData)
      .where(eq(investigators.id, id))
      .returning();
    
    if (!investigator) {
      throw new Error("Failed to update investigator");
    }
    return investigator;
  }

  async getInvestigatorByEmail(email: string): Promise<Investigator | undefined> {
    const [investigator] = await db
      .select()
      .from(investigators)
      .where(eq(investigators.email, email));
    return investigator;
  }

  async getInvestigatorById(id: number): Promise<Investigator | undefined> {
    const [investigator] = await db
      .select()
      .from(investigators)
      .where(eq(investigators.id, id));
    return investigator;
  }

  async getAssignedSubmissions(investigatorName: string): Promise<Submission[]> {
    const submissionData = await db
      .select()
      .from(submissions)
      .where(eq(submissions.assignedTo, investigatorName))
      .orderBy(submissions.submittedAt);
    return submissionData;
  }
}

export const storage = new DatabaseStorage();
