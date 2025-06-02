import { storage } from "./storage";

class AuditLogger {
  async log(entry: {
    userId: string;
    action: string;
    resource: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await storage.createAuditLog(entry);
      console.log(`[AUDIT] ${entry.action} by ${entry.userId} on ${entry.resource}`, entry.details);
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  }

  async getRecentLogs(limit: number = 100) {
    try {
      return await storage.getRecentAuditLogs(limit);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      return [];
    }
  }
}

export const auditLogger = new AuditLogger();

// Predefined audit actions
export const AUDIT_ACTIONS = {
  ADMIN_LOGIN: 'admin_login',
  ADMIN_LOGOUT: 'admin_logout',
  VIEW_SUBMISSIONS: 'view_submissions',
  DECRYPT_SUBMISSION: 'decrypt_submission',
  DELETE_SUBMISSION: 'delete_submission',
  PURGE_DATA: 'purge_data',
  EXPORT_DATA: 'export_data',
  VIEW_STATS: 'view_stats',
  SUBMISSION_RECEIVED: 'submission_received',
  SECURITY_THREAT_DETECTED: 'security_threat_detected',
  FILE_VIRUS_SCAN: 'file_virus_scan'
} as const;