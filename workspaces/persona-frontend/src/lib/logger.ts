/**
 * LOGGER UTILITY
 * 
 * Centralized logging system with different log levels and 
 * structured output for debugging and monitoring.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: any
  userId?: string
  sessionId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private minLevel: LogLevel = this.isDevelopment ? 'debug' : 'info'

  private getLevelPriority(level: LogLevel): number {
    const priorities = { debug: 0, info: 1, warn: 2, error: 3 }
    return priorities[level] || 0
  }

  private shouldLog(level: LogLevel): boolean {
    return this.getLevelPriority(level) >= this.getLevelPriority(this.minLevel)
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp
    const level = entry.level.toUpperCase().padEnd(5)
    const message = entry.message
    
    let formatted = `[${timestamp}] ${level} ${message}`
    
    if (entry.context) {
      formatted += ` | Context: ${JSON.stringify(entry.context)}`
    }
    
    if (entry.userId) {
      formatted += ` | User: ${entry.userId}`
    }
    
    if (entry.sessionId) {
      formatted += ` | Session: ${entry.sessionId}`
    }
    
    return formatted
  }

  private log(level: LogLevel, message: string, context?: any, metadata?: { userId?: string, sessionId?: string }) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...metadata
    }

    const formattedMessage = this.formatMessage(entry)

    // Console output with appropriate method
    switch (level) {
      case 'debug':
        console.debug(formattedMessage)
        break
      case 'info':
        console.info(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'error':
        console.error(formattedMessage)
        break
    }

    // In production, you might want to send logs to a service
    if (!this.isDevelopment) {
      this.sendToLoggingService(entry)
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    // Placeholder for external logging service integration
    // e.g., DataDog, CloudWatch, Sentry, etc.
    try {
      // Example: await fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })
    } catch (error) {
      // Silently fail - don't break app due to logging issues
      console.error('Failed to send log to external service:', error)
    }
  }

  // Public logging methods
  debug(message: string, context?: any, metadata?: { userId?: string, sessionId?: string }) {
    this.log('debug', message, context, metadata)
  }

  info(message: string, context?: any, metadata?: { userId?: string, sessionId?: string }) {
    this.log('info', message, context, metadata)
  }

  warn(message: string, context?: any, metadata?: { userId?: string, sessionId?: string }) {
    this.log('warn', message, context, metadata)
  }

  error(message: string, context?: any, metadata?: { userId?: string, sessionId?: string }) {
    this.log('error', message, context, metadata)
  }

  // Structured logging for specific use cases
  apiRequest(method: string, path: string, statusCode: number, duration: number, userId?: string) {
    this.info(`API ${method} ${path}`, {
      method,
      path,
      statusCode,
      duration: `${duration}ms`
    }, { userId })
  }

  apiError(method: string, path: string, error: Error, userId?: string) {
    this.error(`API ${method} ${path} failed`, {
      method,
      path,
      error: error.message,
      stack: error.stack
    }, { userId })
  }

  authEvent(event: string, userId: string, success: boolean, details?: any) {
    const level = success ? 'info' : 'warn'
    this.log(level, `Auth event: ${event}`, {
      event,
      success,
      ...details
    }, { userId })
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high' = 'medium', details?: any, userId?: string) {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info'
    this.log(level, `Security event: ${event}`, {
      severity,
      ...details
    }, { userId })
  }

  blockchainEvent(event: string, txHash?: string, blockHeight?: number, details?: any) {
    this.info(`Blockchain event: ${event}`, {
      event,
      txHash,
      blockHeight,
      ...details
    })
  }

  zkProofEvent(event: string, proofId: string, success: boolean, details?: any) {
    const level = success ? 'info' : 'error'
    this.log(level, `ZK Proof event: ${event}`, {
      event,
      proofId,
      success,
      ...details
    })
  }
}

// Export singleton instance
export const logger = new Logger()
export default logger

// Convenience exports for common patterns
export const logApiRequest = logger.apiRequest.bind(logger)
export const logApiError = logger.apiError.bind(logger)
export const logAuthEvent = logger.authEvent.bind(logger)
export const logSecurityEvent = logger.securityEvent.bind(logger)
export const logBlockchainEvent = logger.blockchainEvent.bind(logger)
export const logZkProofEvent = logger.zkProofEvent.bind(logger)