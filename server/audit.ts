import crypto from "crypto";

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogger {
  private logs: AuditLog[] = [];

  log(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const auditEntry: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...entry
    };

    this.logs.push(auditEntry);
    
    // Log to console for immediate visibility
    console.log(`[AUDIT] ${auditEntry.timestamp.toISOString()} - ${auditEntry.userId}: ${auditEntry.action} on ${auditEntry.resource}`, auditEntry.details);
    
    // In production, this would also write to a secure audit database
    this.cleanupOldLogs();
  }

  getRecentLogs(limit: number = 100): AuditLog[] {
    return this.logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private cleanupOldLogs(): void {
    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
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