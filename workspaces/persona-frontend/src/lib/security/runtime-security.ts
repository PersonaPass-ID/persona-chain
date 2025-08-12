/**
 * RUNTIME SECURITY CONFIGURATION
 * 
 * This module provides runtime security measures including:
 * - Request rate limiting
 * - IP-based blocking
 * - Anomaly detection
 * - Security event monitoring
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import { audit, AuditEventType, AuditSeverity } from '@/lib/audit/audit-logger';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: NextApiRequest) => string;
}

// IP blocking configuration
interface IPBlockingConfig {
  maxFailedAttempts: number;
  blockDurationMs: number;
  whitelist?: string[];
  blacklist?: string[];
}

// Security monitoring configuration
interface SecurityMonitoringConfig {
  enableAnomalyDetection: boolean;
  anomalyThreshold: number;
  alertThreshold: number;
}

// In-memory stores (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const ipBlockStore = new Map<string, { attempts: number; blockedUntil?: number }>();
const anomalyStore = new Map<string, number[]>();

export class RuntimeSecurity {
  /**
   * Rate limiting middleware
   */
  static rateLimit(config: RateLimitConfig) {
    const {
      windowMs,
      maxRequests,
      message = 'Too many requests, please try again later',
      skipSuccessfulRequests = false,
      keyGenerator = (req) => this.getClientIdentifier(req)
    } = config;

    return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const key = keyGenerator(req);
      const now = Date.now();
      
      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);
      
      if (!entry || now > entry.resetTime) {
        entry = { count: 0, resetTime: now + windowMs };
        rateLimitStore.set(key, entry);
      }
      
      // Check if limit exceeded
      if (entry.count >= maxRequests) {
        // Log rate limit violation
        await audit.log({
          eventType: AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
          severity: AuditSeverity.WARN,
          ipAddress: this.getClientIP(req),
          userAgent: req.headers['user-agent'],
          action: 'Rate limit exceeded',
          outcome: 'failure',
          metadata: {
            endpoint: req.url,
            limit: maxRequests,
            window: windowMs
          }
        });
        
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message,
            retryAfter: Math.ceil((entry.resetTime - now) / 1000)
          }
        });
      }
      
      // Increment counter
      entry.count++;
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
      res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
      
      next();
    };
  }

  /**
   * IP blocking middleware
   */
  static ipBlocking(config: IPBlockingConfig) {
    const {
      maxFailedAttempts,
      blockDurationMs,
      whitelist = [],
      blacklist = []
    } = config;

    return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const clientIP = this.getClientIP(req);
      
      // Check whitelist
      if (whitelist.includes(clientIP)) {
        return next();
      }
      
      // Check blacklist
      if (blacklist.includes(clientIP)) {
        await audit.log({
          eventType: AuditEventType.SECURITY_THREAT_DETECTED,
          severity: AuditSeverity.CRITICAL,
          ipAddress: clientIP,
          action: 'Blacklisted IP attempted access',
          outcome: 'failure'
        });
        
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Access denied'
          }
        });
      }
      
      // Check if IP is blocked
      const blockEntry = ipBlockStore.get(clientIP);
      if (blockEntry?.blockedUntil && Date.now() < blockEntry.blockedUntil) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'IP_BLOCKED',
            message: 'Your IP has been temporarily blocked due to suspicious activity'
          }
        });
      }
      
      next();
    };
  }

  /**
   * Track failed authentication attempts
   */
  static async trackFailedAttempt(
    req: NextApiRequest,
    reason: string,
    config: IPBlockingConfig
  ): Promise<void> {
    const clientIP = this.getClientIP(req);
    const { maxFailedAttempts, blockDurationMs } = config;
    
    let entry = ipBlockStore.get(clientIP) || { attempts: 0 };
    entry.attempts++;
    
    if (entry.attempts >= maxFailedAttempts) {
      entry.blockedUntil = Date.now() + blockDurationMs;
      
      await audit.log({
        eventType: AuditEventType.SECURITY_THREAT_DETECTED,
        severity: AuditSeverity.CRITICAL,
        ipAddress: clientIP,
        action: 'IP blocked due to multiple failed attempts',
        outcome: 'failure',
        metadata: {
          attempts: entry.attempts,
          reason,
          blockDuration: blockDurationMs
        }
      });
    }
    
    ipBlockStore.set(clientIP, entry);
  }

  /**
   * Anomaly detection
   */
  static async detectAnomaly(
    req: NextApiRequest,
    metric: number,
    config: SecurityMonitoringConfig
  ): Promise<boolean> {
    if (!config.enableAnomalyDetection) return false;
    
    const key = this.getClientIdentifier(req);
    const history = anomalyStore.get(key) || [];
    
    // Add current metric
    history.push(metric);
    
    // Keep last 100 data points
    if (history.length > 100) {
      history.shift();
    }
    
    anomalyStore.set(key, history);
    
    // Calculate statistics
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);
    
    // Check if current metric is anomalous
    const zScore = Math.abs((metric - mean) / stdDev);
    const isAnomaly = zScore > config.anomalyThreshold;
    
    if (isAnomaly) {
      await audit.log({
        eventType: AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY,
        severity: zScore > config.alertThreshold ? AuditSeverity.CRITICAL : AuditSeverity.WARN,
        ipAddress: this.getClientIP(req),
        action: 'Anomaly detected in user behavior',
        outcome: 'failure',
        metadata: {
          metric,
          mean,
          stdDev,
          zScore,
          threshold: config.anomalyThreshold
        }
      });
    }
    
    return isAnomaly;
  }

  /**
   * Security headers validation
   */
  static validateSecurityHeaders(req: NextApiRequest): string[] {
    const violations: string[] = [];
    
    // Check for missing security headers
    const requiredHeaders = [
      'x-forwarded-proto',
      'x-real-ip',
      'user-agent'
    ];
    
    for (const header of requiredHeaders) {
      if (!req.headers[header]) {
        violations.push(`Missing required header: ${header}`);
      }
    }
    
    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-original-url',
      'x-rewrite-url'
    ];
    
    for (const header of suspiciousHeaders) {
      if (req.headers[header]) {
        violations.push(`Suspicious header detected: ${header}`);
      }
    }
    
    return violations;
  }

  /**
   * Get client IP address
   */
  private static getClientIP(req: NextApiRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    
    const realIP = req.headers['x-real-ip'];
    if (typeof realIP === 'string') {
      return realIP;
    }
    
    return req.socket.remoteAddress || 'unknown';
  }

  /**
   * Get client identifier for rate limiting
   */
  private static getClientIdentifier(req: NextApiRequest): string {
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userId = (req as any).session?.userId || 'anonymous';
    
    return createHash('sha256')
      .update(ip)
      .update(userAgent)
      .update(userId)
      .digest('hex');
  }

  /**
   * Clean up expired entries (run periodically)
   */
  static cleanup(): void {
    const now = Date.now();
    
    // Clean rate limit store
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
    
    // Clean IP block store
    for (const [key, entry] of ipBlockStore.entries()) {
      if (entry.blockedUntil && now > entry.blockedUntil) {
        ipBlockStore.delete(key);
      }
    }
    
    // Clean anomaly store (remove old entries)
    if (anomalyStore.size > 1000) {
      const entries = Array.from(anomalyStore.entries());
      anomalyStore.clear();
      entries.slice(-500).forEach(([key, value]) => {
        anomalyStore.set(key, value);
      });
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => RuntimeSecurity.cleanup(), 5 * 60 * 1000);
}

// Export convenience middleware
export const rateLimiter = (windowMs: number, maxRequests: number) => 
  RuntimeSecurity.rateLimit({ windowMs, maxRequests });

export const ipBlocker = (maxFailedAttempts = 5, blockDurationMs = 15 * 60 * 1000) =>
  RuntimeSecurity.ipBlocking({ maxFailedAttempts, blockDurationMs });

export default RuntimeSecurity;