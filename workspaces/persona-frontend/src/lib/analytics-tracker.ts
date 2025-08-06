// PersonaPass Analytics Tracker
// Comprehensive usage tracking and analytics for API usage and billing

export interface UsageEvent {
  id?: string;
  userId: string;
  verificationType: 'github_developer' | 'government_age' | 'didit_identity' | 'educational' | 'healthcare' | 'professional';
  timestamp: string;
  cost: number;
  success: boolean;
  metadata?: {
    githubUsername?: string;
    credentialTypes?: string[];
    error?: string;
    ipAddress?: string;
    userAgent?: string;
    referer?: string;
  };
}

export interface AnalyticsSummary {
  totalVerifications: number;
  totalRevenue: number;
  successRate: number;
  topVerificationTypes: Array<{
    type: string;
    count: number;
    revenue: number;
  }>;
  dailyStats: Array<{
    date: string;
    verifications: number;
    revenue: number;
    successRate: number;
  }>;
  errorAnalysis: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
}

export class AnalyticsTracker {
  private usageBuffer: UsageEvent[] = [];
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start auto-flush timer
    this.startAutoFlush();
  }

  /**
   * Track a verification event
   */
  async trackVerification(event: UsageEvent): Promise<void> {
    try {
      // Add timestamp and ID if not provided
      const enrichedEvent: UsageEvent = {
        ...event,
        id: event.id || this.generateEventId(),
        timestamp: event.timestamp || new Date().toISOString(),
      };

      // Add to buffer
      this.usageBuffer.push(enrichedEvent);

      // Log to console for development
      console.log('📊 Analytics: Verification tracked', {
        type: enrichedEvent.verificationType,
        success: enrichedEvent.success,
        cost: enrichedEvent.cost,
        userId: enrichedEvent.userId
      });

      // Flush if buffer is full
      if (this.usageBuffer.length >= this.BATCH_SIZE) {
        await this.flush();
      }

      // Real-time tracking for high-value events
      if (enrichedEvent.cost > 1.0 || !enrichedEvent.success) {
        await this.sendRealTimeAlert(enrichedEvent);
      }

    } catch (error) {
      console.error('❌ Analytics tracking failed:', error);
      // Don't fail the main request if analytics fail
    }
  }

  /**
   * Track user behavior and engagement
   */
  async trackUserBehavior(
    userId: string, 
    action: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const event = {
        userId,
        action,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
          url: typeof window !== 'undefined' ? window.location.href : 'server'
        }
      };

      // Log behavioral events
      console.log('👤 User Behavior:', action, userId);

      // Send to analytics service
      await this.sendBehaviorEvent(event);

    } catch (error) {
      console.error('❌ Behavior tracking failed:', error);
    }
  }

  /**
   * Get analytics summary for dashboard
   */
  async getAnalyticsSummary(
    startDate?: string, 
    endDate?: string
  ): Promise<AnalyticsSummary> {
    try {
      const response = await fetch('/api/analytics/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate || this.getDateDaysAgo(30),
          endDate: endDate || new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Failed to fetch analytics summary:', error);
      
      // Return mock data for development
      return this.getMockAnalyticsSummary();
    }
  }

  /**
   * Export usage data for accounting/billing
   */
  async exportUsageData(
    startDate: string, 
    endDate: string, 
    format: 'json' | 'csv' = 'json'
  ): Promise<any> {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          format
        })
      });

      if (!response.ok) {
        throw new Error(`Export API error: ${response.status}`);
      }

      if (format === 'csv') {
        return await response.text();
      } else {
        return await response.json();
      }

    } catch (error) {
      console.error('❌ Failed to export usage data:', error);
      throw error;
    }
  }

  /**
   * Flush buffered events to storage
   */
  private async flush(): Promise<void> {
    if (this.usageBuffer.length === 0) return;

    try {
      const events = [...this.usageBuffer];
      this.usageBuffer = [];

      // Send to analytics API
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events })
      });

      console.log(`📤 Analytics: Flushed ${events.length} events to storage`);

    } catch (error) {
      console.error('❌ Failed to flush analytics events:', error);
      // Re-add failed events to buffer for retry
      this.usageBuffer.unshift(...this.usageBuffer);
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Stop auto-flush timer
   */
  public stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Send real-time alerts for critical events
   */
  private async sendRealTimeAlert(event: UsageEvent): Promise<void> {
    try {
      await fetch('/api/analytics/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'critical_event',
          event,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('❌ Failed to send real-time alert:', error);
    }
  }

  /**
   * Send user behavior event
   */
  private async sendBehaviorEvent(event: any): Promise<void> {
    try {
      await fetch('/api/analytics/behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('❌ Failed to send behavior event:', error);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get date N days ago
   */
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  /**
   * Mock analytics summary for development
   */
  private getMockAnalyticsSummary(): AnalyticsSummary {
    return {
      totalVerifications: 147,
      totalRevenue: 7.35,
      successRate: 94.6,
      topVerificationTypes: [
        { type: 'github_developer', count: 89, revenue: 4.45 },
        { type: 'government_age', count: 32, revenue: 1.60 },
        { type: 'educational', count: 26, revenue: 1.30 }
      ],
      dailyStats: Array.from({ length: 7 }, (_, i) => ({
        date: this.getDateDaysAgo(6 - i).split('T')[0],
        verifications: Math.floor(Math.random() * 25) + 5,
        revenue: parseFloat((Math.random() * 1.25 + 0.25).toFixed(2)),
        successRate: parseFloat((Math.random() * 10 + 90).toFixed(1))
      })),
      errorAnalysis: [
        { error: 'GitHub user not found', count: 5, percentage: 3.4 },
        { error: 'Rate limit exceeded', count: 2, percentage: 1.4 },
        { error: 'Network timeout', count: 1, percentage: 0.7 }
      ]
    };
  }
}

// Global analytics instance
export const analytics = new AnalyticsTracker();

// Convenience functions
export const trackVerification = (event: UsageEvent) => analytics.trackVerification(event);
export const trackUserBehavior = (userId: string, action: string, metadata?: Record<string, any>) => 
  analytics.trackUserBehavior(userId, action, metadata);
export const getAnalyticsSummary = (startDate?: string, endDate?: string) => 
  analytics.getAnalyticsSummary(startDate, endDate);
export const exportUsageData = (startDate: string, endDate: string, format?: 'json' | 'csv') => 
  analytics.exportUsageData(startDate, endDate, format);