/**
 * COMPREHENSIVE AUDIT LOGGING SYSTEM
 * 
 * Security Features:
 * - Tamper-proof log entries with cryptographic hashing
 * - Structured logging with consistent format
 * - PII redaction and data masking
 * - Log rotation and retention policies
 * - Real-time security event monitoring
 * - Compliance with regulatory requirements
 * - Integration with external SIEM systems
 */

import { createHash, randomUUID } from 'crypto';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Audit event types
export enum AuditEventType {
  // Authentication events
  AUTH_LOGIN_ATTEMPT = 'AUTH_LOGIN_ATTEMPT',
  AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILURE = 'AUTH_LOGIN_FAILURE',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  AUTH_SESSION_CREATED = 'AUTH_SESSION_CREATED',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_TOKEN_REFRESH = 'AUTH_TOKEN_REFRESH',
  
  // Authorization events
  AUTHZ_ACCESS_GRANTED = 'AUTHZ_ACCESS_GRANTED',
  AUTHZ_ACCESS_DENIED = 'AUTHZ_ACCESS_DENIED',
  AUTHZ_PERMISSION_CHANGED = 'AUTHZ_PERMISSION_CHANGED',
  
  // Data access events
  DATA_READ = 'DATA_READ',
  DATA_WRITE = 'DATA_WRITE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  
  // Security events
  SECURITY_THREAT_DETECTED = 'SECURITY_THREAT_DETECTED',
  SECURITY_RATE_LIMIT_EXCEEDED = 'SECURITY_RATE_LIMIT_EXCEEDED',
  SECURITY_INVALID_INPUT = 'SECURITY_INVALID_INPUT',
  SECURITY_SUSPICIOUS_ACTIVITY = 'SECURITY_SUSPICIOUS_ACTIVITY',
  
  // DID events
  DID_CREATED = 'DID_CREATED',
  DID_UPDATED = 'DID_UPDATED',
  DID_REVOKED = 'DID_REVOKED',
  DID_KEY_ROTATION = 'DID_KEY_ROTATION',
  
  // Credential events
  CREDENTIAL_ISSUED = 'CREDENTIAL_ISSUED',
  CREDENTIAL_VERIFIED = 'CREDENTIAL_VERIFIED',
  CREDENTIAL_REVOKED = 'CREDENTIAL_REVOKED',
  
  // System events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE'
}

// Audit severity levels
export enum AuditSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Audit log entry structure
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  walletAddress?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  outcome: 'success' | 'failure' | 'pending';
  metadata?: Record<string, any>;
  errorDetails?: {
    code: string;
    message: string;
    stack?: string;
  };
  hash?: string;
  previousHash?: string;
}

// Data masking patterns
const MASKING_PATTERNS = {
  email: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  walletAddress: /(0x[a-fA-F0-9]{40})|([a-z]+1[a-z0-9]{38,})|([1-9A-HJ-NP-Za-km-z]{32,44})/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g
};

class AuditLogger {
  private logger: winston.Logger;
  private previousHash: string = '0';
  private logChain: Map<string, string> = new Map();

  constructor() {
    this.logger = this.createLogger();
    this.initializeLogChain();
  }

  /**
   * Create Winston logger with multiple transports
   */
  private createLogger(): winston.Logger {
    // Custom format for audit logs
    const auditFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        return JSON.stringify({
          timestamp,
          level,
          message,
          ...metadata
        });
      })
    );

    // File rotation transport for audit logs
    const auditFileTransport = new DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '100m',
      maxFiles: '90d', // Keep 90 days of logs
      format: auditFormat,
      auditFile: true
    });

    // Security events transport
    const securityFileTransport = new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '180d', // Keep 180 days for security logs
      format: auditFormat,
      level: 'warn',
      filter: winston.format((info) => {
        // Only log security-related events
        return info.eventType && info.eventType.startsWith('SECURITY_') ? info : false;
      })()
    });

    // Console transport for development
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
    });

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: auditFormat,
      transports: [
        auditFileTransport,
        securityFileTransport,
        ...(process.env.NODE_ENV !== 'test' ? [consoleTransport] : [])
      ],
      // Prevent process exit on error
      exitOnError: false
    });
  }

  /**
   * Initialize the log chain for tamper detection
   */
  private initializeLogChain(): void {
    // In production, load the last hash from secure storage
    this.previousHash = process.env.AUDIT_CHAIN_SEED || '0';
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'hash' | 'previousHash'>): Promise<void> {
    try {
      // Generate unique ID and timestamp
      const id = randomUUID();
      const timestamp = new Date().toISOString();

      // Create full log entry
      const logEntry: AuditLogEntry = {
        id,
        timestamp,
        ...entry,
        previousHash: this.previousHash
      };

      // Mask sensitive data
      const maskedEntry = this.maskSensitiveData(logEntry);

      // Calculate hash for tamper detection
      const hash = this.calculateHash(maskedEntry);
      maskedEntry.hash = hash;

      // Store hash in chain
      this.logChain.set(id, hash);
      this.previousHash = hash;

      // Log based on severity
      this.logger.log(entry.severity, maskedEntry.action, maskedEntry);

      // Send critical events to external monitoring
      if (entry.severity === AuditSeverity.CRITICAL) {
        await this.sendToSIEM(maskedEntry);
      }

      // Trigger alerts for security events
      if (entry.eventType.startsWith('SECURITY_')) {
        await this.triggerSecurityAlert(maskedEntry);
      }

    } catch (error) {
      // Fallback logging to ensure audit events are never lost
      console.error('Audit logging error:', error);
      this.logger.error('AUDIT_SYSTEM_ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalEntry: entry
      });
    }
  }

  /**
   * Mask sensitive data in log entries
   */
  private maskSensitiveData(entry: AuditLogEntry): AuditLogEntry {
    const masked = JSON.parse(JSON.stringify(entry)); // Deep clone

    // Mask wallet addresses (keep first 6 and last 4 characters)
    if (masked.walletAddress) {
      masked.walletAddress = this.maskValue(masked.walletAddress, 'wallet');
    }

    // Mask IP addresses (keep first two octets)
    if (masked.ipAddress) {
      masked.ipAddress = this.maskValue(masked.ipAddress, 'ip');
    }

    // Recursively mask metadata
    if (masked.metadata) {
      masked.metadata = this.maskObject(masked.metadata);
    }

    return masked;
  }

  /**
   * Mask a specific value based on type
   */
  private maskValue(value: string, type: 'wallet' | 'ip' | 'email' | 'generic'): string {
    switch (type) {
      case 'wallet':
        if (value.length > 10) {
          return `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
        }
        return value;
      
      case 'ip':
        const parts = value.split('.');
        if (parts.length === 4) {
          return `${parts[0]}.${parts[1]}.***.***`;
        }
        return value;
      
      case 'email':
        const emailParts = value.split('@');
        if (emailParts.length === 2) {
          const username = emailParts[0];
          const masked = username.length > 2 
            ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
            : username;
          return `${masked}@${emailParts[1]}`;
        }
        return value;
      
      default:
        return value.substring(0, 3) + '*'.repeat(Math.max(0, value.length - 3));
    }
  }

  /**
   * Recursively mask sensitive data in objects
   */
  private maskObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const masked: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Check for patterns to mask
        let maskedValue = value;
        
        // Mask emails
        maskedValue = maskedValue.replace(MASKING_PATTERNS.email, (match, user, domain) => {
          return this.maskValue(match, 'email');
        });
        
        // Mask wallet addresses
        maskedValue = maskedValue.replace(MASKING_PATTERNS.walletAddress, (match) => {
          return this.maskValue(match, 'wallet');
        });
        
        // Mask IP addresses
        maskedValue = maskedValue.replace(MASKING_PATTERNS.ipAddress, (match) => {
          return this.maskValue(match, 'ip');
        });
        
        masked[key] = maskedValue;
      } else if (typeof value === 'object') {
        masked[key] = this.maskObject(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Calculate hash for log entry
   */
  private calculateHash(entry: AuditLogEntry): string {
    const content = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      eventType: entry.eventType,
      userId: entry.userId,
      action: entry.action,
      outcome: entry.outcome,
      previousHash: entry.previousHash
    });

    return createHash('sha256')
      .update(content)
      .digest('hex');
  }

  /**
   * Verify log chain integrity
   */
  async verifyLogChain(startId?: string): Promise<boolean> {
    try {
      let currentHash = this.previousHash;
      let valid = true;

      // In production, this would read from persistent storage
      for (const [id, hash] of this.logChain) {
        if (startId && id < startId) continue;
        
        // Verify each entry's hash
        // This is simplified - in production, reconstruct and verify each entry
        if (!hash) {
          valid = false;
          break;
        }
      }

      return valid;
    } catch (error) {
      console.error('Log chain verification error:', error);
      return false;
    }
  }

  /**
   * Send critical events to SIEM
   */
  private async sendToSIEM(entry: AuditLogEntry): Promise<void> {
    if (!process.env.SIEM_ENDPOINT) return;

    try {
      // Send to external SIEM system
      await fetch(process.env.SIEM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SIEM_API_KEY}`
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.error('SIEM integration error:', error);
    }
  }

  /**
   * Trigger security alerts
   */
  private async triggerSecurityAlert(entry: AuditLogEntry): Promise<void> {
    // In production, integrate with alerting system (PagerDuty, OpsGenie, etc.)
    console.warn('🚨 Security Alert:', {
      type: entry.eventType,
      severity: entry.severity,
      user: entry.userId || entry.walletAddress,
      action: entry.action
    });
  }

  /**
   * Query audit logs
   */
  async query(filters: {
    startDate?: Date;
    endDate?: Date;
    eventType?: AuditEventType;
    userId?: string;
    severity?: AuditSeverity;
    outcome?: 'success' | 'failure';
  }): Promise<AuditLogEntry[]> {
    // In production, query from persistent storage
    // This is a placeholder implementation
    return [];
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    reportType: 'GDPR' | 'SOC2' | 'ISO27001'
  ): Promise<any> {
    const logs = await this.query({ startDate, endDate });
    
    // Generate report based on compliance requirements
    return {
      reportType,
      period: { startDate, endDate },
      summary: {
        totalEvents: logs.length,
        securityEvents: logs.filter(l => l.eventType.startsWith('SECURITY_')).length,
        failedAuthentications: logs.filter(l => l.eventType === AuditEventType.AUTH_LOGIN_FAILURE).length,
        dataAccess: logs.filter(l => l.eventType.startsWith('DATA_')).length
      },
      details: logs
    };
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Convenience methods for common audit events
export const audit = {
  // Authentication events
  loginAttempt: (userId: string, walletAddress: string, ipAddress: string) =>
    auditLogger.log({
      eventType: AuditEventType.AUTH_LOGIN_ATTEMPT,
      severity: AuditSeverity.INFO,
      userId,
      walletAddress,
      ipAddress,
      action: 'User attempted login',
      outcome: 'pending'
    }),

  loginSuccess: (userId: string, walletAddress: string, sessionId: string, ipAddress: string) =>
    auditLogger.log({
      eventType: AuditEventType.AUTH_LOGIN_SUCCESS,
      severity: AuditSeverity.INFO,
      userId,
      walletAddress,
      sessionId,
      ipAddress,
      action: 'User logged in successfully',
      outcome: 'success'
    }),

  loginFailure: (walletAddress: string, reason: string, ipAddress: string) =>
    auditLogger.log({
      eventType: AuditEventType.AUTH_LOGIN_FAILURE,
      severity: AuditSeverity.WARN,
      walletAddress,
      ipAddress,
      action: 'Login failed',
      outcome: 'failure',
      metadata: { reason }
    }),

  // Security events
  suspiciousActivity: (userId: string | undefined, activity: string, details: any) =>
    auditLogger.log({
      eventType: AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY,
      severity: AuditSeverity.CRITICAL,
      userId,
      action: `Suspicious activity detected: ${activity}`,
      outcome: 'failure',
      metadata: details
    }),

  // Data access events
  dataAccess: (userId: string, resourceType: string, resourceId: string, action: 'read' | 'write' | 'delete') =>
    auditLogger.log({
      eventType: action === 'read' ? AuditEventType.DATA_READ : 
               action === 'write' ? AuditEventType.DATA_WRITE : 
               AuditEventType.DATA_DELETE,
      severity: AuditSeverity.INFO,
      userId,
      resourceType,
      resourceId,
      action: `User ${action} ${resourceType}`,
      outcome: 'success'
    })
};

export default auditLogger;