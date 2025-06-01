import { submissions, type Submission, type InsertSubmission } from "@shared/schema";
import crypto from "crypto";

export interface IStorage {
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  purgeOldSubmissions(): Promise<number>;
  getSubmissionCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private submissions: Map<number, Submission>;
  private currentId: number;

  constructor() {
    this.submissions = new Map();
    this.currentId = 1;
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.currentId++;
    const submission: Submission = {
      ...insertSubmission,
      id,
      submittedAt: new Date(),
    };
    
    this.submissions.set(id, submission);
    return submission;
  }

  async purgeOldSubmissions(): Promise<number> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    let purgedCount = 0;
    for (const [id, submission] of this.submissions.entries()) {
      if (submission.submittedAt < ninetyDaysAgo) {
        this.submissions.delete(id);
        purgedCount++;
      }
    }
    
    return purgedCount;
  }

  async getSubmissionCount(): Promise<number> {
    return this.submissions.size;
  }
}

export const storage = new MemStorage();
