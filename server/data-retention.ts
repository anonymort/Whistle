import { storage } from "./storage";
import { auditLogger, AUDIT_ACTIONS } from "./audit";

/**
 * GDPR Compliance: Automated Data Retention and Deletion
 * Article 5(1)(e) - Data kept no longer than necessary
 * Hard-coded 90-day retention policy for whistleblowing submissions
 */

const RETENTION_DAYS = 90;

export class DataRetentionManager {
  private static instance: DataRetentionManager;
  private deletionTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): DataRetentionManager {
    if (!DataRetentionManager.instance) {
      DataRetentionManager.instance = new DataRetentionManager();
    }
    return DataRetentionManager.instance;
  }

  /**
   * Start automated deletion cron job
   * Runs daily at 02:00 UTC to purge old submissions
   */
  public startAutomatedDeletion(): void {
    console.log(`[DATA RETENTION] Starting automated deletion service - ${RETENTION_DAYS} day retention policy`);
    
    // Run immediately on startup
    this.performRetentionCheck();
    
    // Schedule daily checks at 02:00 UTC
    const scheduleNextCheck = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(2, 0, 0, 0); // 02:00 UTC
      
      const timeUntilNext = tomorrow.getTime() - now.getTime();
      
      this.deletionTimer = setTimeout(() => {
        this.performRetentionCheck();
        scheduleNextCheck(); // Schedule next day
      }, timeUntilNext);
      
      console.log(`[DATA RETENTION] Next automated deletion scheduled for ${tomorrow.toISOString()}`);
    };
    
    scheduleNextCheck();
  }

  /**
   * Stop automated deletion service
   */
  public stopAutomatedDeletion(): void {
    if (this.deletionTimer) {
      clearTimeout(this.deletionTimer);
      this.deletionTimer = null;
      console.log('[DATA RETENTION] Automated deletion service stopped');
    }
  }

  /**
   * Perform retention check and delete old submissions
   */
  public async performRetentionCheck(): Promise<number> {
    try {
      console.log('[DATA RETENTION] Starting retention check...');
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
      
      const deletedCount = await storage.purgeOldSubmissions();
      
      // Log the retention action
      await auditLogger.log({
        action: AUDIT_ACTIONS.DATA_RETENTION,
        userId: 'system',
        details: {
          retentionDays: RETENTION_DAYS,
          cutoffDate: cutoffDate.toISOString(),
          deletedCount,
          timestamp: new Date().toISOString()
        },
        severity: 'medium'
      });

      console.log(`[DATA RETENTION] Deleted ${deletedCount} submissions older than ${RETENTION_DAYS} days`);
      return deletedCount;
      
    } catch (error) {
      console.error('[DATA RETENTION] Error during retention check:', error);
      
      // Log the error
      await auditLogger.log({
        action: 'data_retention_error',
        userId: 'system',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        severity: 'high'
      });
      
      throw error;
    }
  }

  /**
   * Get current retention policy information
   */
  public getRetentionPolicy(): {
    retentionDays: number;
    description: string;
    legalBasis: string;
  } {
    return {
      retentionDays: RETENTION_DAYS,
      description: `Submissions are automatically deleted after ${RETENTION_DAYS} days to comply with GDPR data minimization principles`,
      legalBasis: 'Article 5(1)(e) GDPR - Storage limitation principle'
    };
  }

  /**
   * Manual retention check (for testing or admin use)
   */
  public async manualRetentionCheck(): Promise<{
    deletedCount: number;
    cutoffDate: Date;
    retentionDays: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    
    const deletedCount = await this.performRetentionCheck();
    
    return {
      deletedCount,
      cutoffDate,
      retentionDays: RETENTION_DAYS
    };
  }
}

// Export singleton instance
export const dataRetentionManager = DataRetentionManager.getInstance();