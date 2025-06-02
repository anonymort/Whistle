import { storage } from "./storage";

class AuditLogger {
  async log(entry: {
    userId: string;
    action: string;
    resource: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    outcome?: 'success' | 'failure' | 'blocked';
  }): Promise<void> {
    try {
      const auditEntry = {
        ...entry,
        severity: entry.severity || 'medium',
        outcome: entry.outcome || 'success',
        timestamp: new Date(),
        sessionId: this.generateSessionId(entry.userId, entry.ipAddress)
      };
      
      await storage.createAuditLog(auditEntry);
      
      // Enhanced logging with severity levels
      const logLevel = entry.severity === 'critical' ? 'ERROR' : 
                     entry.severity === 'high' ? 'WARN' : 'INFO';
      
      console.log(`[${logLevel}] [AUDIT] ${entry.action} by ${entry.userId} on ${entry.resource}`, 
                  entry.details || {});
      
      // Alert on critical security events
      if (entry.severity === 'critical') {
        console.error(`🚨 CRITICAL SECURITY EVENT: ${entry.action} by ${entry.userId}`);
      }
      
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Fallback to console logging for critical events
      if (entry.severity === 'critical') {
        console.error(`CRITICAL AUDIT FAILURE: ${entry.action} by ${entry.userId}`);
      }
    }
  }

  private generateSessionId(userId: string, ipAddress?: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(`${userId}-${ipAddress}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16);
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

// Predefined audit actions with enhanced security tracking
export const AUDIT_ACTIONS = {
  // Authentication Events
  ADMIN_LOGIN: 'admin_login',
  ADMIN_LOGIN_FAILED: 'admin_login_failed',
  ADMIN_LOGOUT: 'admin_logout',
  INVESTIGATOR_LOGIN: 'investigator_login',
  INVESTIGATOR_LOGIN_FAILED: 'investigator_login_failed',
  INVESTIGATOR_LOGOUT: 'investigator_logout',
  SESSION_EXPIRED: 'session_expired',
  
  // Data Access Events
  VIEW_SUBMISSIONS: 'view_submissions',
  DECRYPT_SUBMISSION: 'decrypt_submission',
  VIEW_SUBMISSION_DETAILS: 'view_submission_details',
  EXPORT_DATA: 'export_data',
  VIEW_STATS: 'view_stats',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  
  // Data Modification Events
  UPDATE_SUBMISSION: 'update_submission',
  DELETE_SUBMISSION: 'delete_submission',
  PURGE_DATA: 'purge_data',
  CREATE_CASE_NOTE: 'create_case_note',
  DELETE_CASE_NOTE: 'delete_case_note',
  
  // Investigator Management
  CREATE_INVESTIGATOR: 'create_investigator',
  UPDATE_INVESTIGATOR: 'update_investigator',
  ASSIGN_CASE: 'assign_case',
  
  // Security Events
  SUBMISSION_RECEIVED: 'submission_received',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_TOKEN: 'invalid_token',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  ENCRYPTION_ERROR: 'encryption_error',
  FILE_VALIDATION_FAILED: 'file_validation_failed',
  
  // System Events
  SYSTEM_STARTUP: 'system_startup',
  DATA_RETENTION_CLEANUP: 'data_retention_cleanup',
  KEY_ROTATION: 'key_rotation'
} as const;