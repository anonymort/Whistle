import { submissions, type Submission, type InsertSubmission } from "@shared/schema";
import { db } from "./db";
import { eq, lt, sql } from "drizzle-orm";

export interface IStorage {
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  purgeOldSubmissions(): Promise<number>;
  getSubmissionCount(): Promise<number>;
  getAllSubmissions(): Promise<Submission[]>;
  getSubmissionById(id: number): Promise<Submission | undefined>;
  deleteSubmission(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values(insertSubmission)
      .returning();
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
      .select({ count: sql<number>`count(*)` })
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
}

export const storage = new DatabaseStorage();
