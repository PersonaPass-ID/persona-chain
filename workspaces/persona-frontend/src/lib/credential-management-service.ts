// Credential Management Service
// Handles credential lifecycle, history tracking, renewal, and analytics

import type { VerifiableCredential } from './github-verification'
import type { PersonaChainCredential } from './personachain-service'
import { personaChainService } from './personachain-service'
import { githubOAuthService } from './github-oauth-service'

export interface CredentialHistory {
  id: string
  credentialId: string
  action: 'created' | 'renewed' | 'revoked' | 'expired' | 'shared' | 'verified'
  timestamp: string
  metadata: {
    version?: number
    renewalReason?: string
    sharedWith?: string
    verificationResult?: boolean
    txHash?: string
    blockHeight?: number
  }
  description: string
}

export interface CredentialAnalytics {
  credentialId: string
  totalShares: number
  totalVerifications: number
  successfulVerifications: number
  lastShared?: string
  lastVerified?: string
  popularityScore: number
  trustScore: number
  usagePattern: 'high' | 'medium' | 'low'
  renewalDue?: string
  recommendations: string[]
}

export interface RenewalStatus {
  credentialId: string
  isEligible: boolean
  daysUntilExpiry?: number
  renewalRequired: boolean
  renewalReason: 'expiring' | 'data_stale' | 'security_update' | 'user_request'
  estimatedCost?: number
  benefits: string[]
}

export interface CredentialInsights {
  totalCredentials: number
  activeCredentials: number
  expiredCredentials: number
  totalShares: number
  totalVerifications: number
  averageTrustScore: number
  mostPopularCredential?: string
  recentActivity: CredentialHistory[]
  renewalAlerts: RenewalStatus[]
  performanceMetrics: {
    verificationSuccessRate: number
    averageResponseTime: number
    uptimePercentage: number
  }
}

export class CredentialManagementService {
  private readonly STORAGE_KEY = 'personapass_credential_history'
  private readonly ANALYTICS_KEY = 'personapass_credential_analytics'
  private readonly RENEWAL_THRESHOLD_DAYS = 30

  constructor() {
    console.log('📊 Credential Management Service initialized')
  }

  /**
   * Generate comprehensive credential insights for dashboard
   */
  async generateInsights(walletAddress: string): Promise<CredentialInsights> {
    return this.getCredentialInsights(walletAddress)
  }

  /**
   * Get comprehensive credential insights for dashboard
   */
  async getCredentialInsights(walletAddress: string): Promise<CredentialInsights> {
    try {
      console.log(`📊 Generating credential insights for ${walletAddress}`)

      const credentials = await personaChainService.getCredentials(walletAddress)
      const history = this.getCredentialHistory(walletAddress)
      const analytics = this.getAllCredentialAnalytics(walletAddress)

      // Ensure credentials is an array
      const credentialsArray = Array.isArray(credentials) ? credentials : []

      // Calculate metrics
      const activeCredentials = credentialsArray.filter(c => c.status === 'active')
      const expiredCredentials = credentialsArray.filter(c => c.status === 'expired')
      
      const totalShares = analytics.reduce((sum, a) => sum + a.totalShares, 0)
      const totalVerifications = analytics.reduce((sum, a) => sum + a.totalVerifications, 0)
      const avgTrustScore = analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + a.trustScore, 0) / analytics.length 
        : 0

      // Performance metrics
      const successfulVerifications = analytics.reduce((sum, a) => sum + a.successfulVerifications, 0)
      const verificationSuccessRate = totalVerifications > 0 
        ? (successfulVerifications / totalVerifications) * 100 
        : 0

      // Find most popular credential
      const mostPopular = analytics.sort((a, b) => b.popularityScore - a.popularityScore)[0]

      // Recent activity (last 10 items)
      const recentActivity = history
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)

      // Check renewal status for all credentials
      const renewalAlerts = await Promise.all(
        credentialsArray.map(c => this.checkRenewalStatus(c))
      )

      const insights: CredentialInsights = {
        totalCredentials: credentialsArray.length,
        activeCredentials: activeCredentials.length,
        expiredCredentials: expiredCredentials.length,
        totalShares,
        totalVerifications,
        averageTrustScore: Math.round(avgTrustScore * 100) / 100,
        mostPopularCredential: mostPopular?.credentialId,
        recentActivity,
        renewalAlerts: renewalAlerts.filter(r => r.renewalRequired),
        performanceMetrics: {
          verificationSuccessRate: Math.round(verificationSuccessRate * 100) / 100,
          averageResponseTime: 245, // Mock value in ms
          uptimePercentage: 99.8 // Mock value
        }
      }

      console.log(`✅ Generated insights:`, insights)
      return insights

    } catch (error) {
      console.error('❌ Error generating credential insights:', error)
      throw new Error(`Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Track credential lifecycle event
   */
  trackCredentialEvent(
    walletAddress: string,
    credentialId: string,
    action: CredentialHistory['action'],
    metadata: CredentialHistory['metadata'] = {}
  ): void {
    try {
      const history = this.getCredentialHistory(walletAddress)
      
      const event: CredentialHistory = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        credentialId,
        action,
        timestamp: new Date().toISOString(),
        metadata,
        description: this.generateEventDescription(action, metadata)
      }

      history.push(event)
      this.saveCredentialHistory(walletAddress, history)

      // Update analytics
      this.updateCredentialAnalytics(walletAddress, credentialId, action, metadata)

      console.log(`📝 Tracked event: ${action} for credential ${credentialId}`)

    } catch (error) {
      console.error('❌ Error tracking credential event:', error)
    }
  }

  /**
   * Check if credential needs renewal
   */
  async checkRenewalStatus(credential: PersonaChainCredential): Promise<RenewalStatus> {
    try {
      const credentialData = credential.credentialData
      const issuanceDate = credentialData?.issuanceDate || credential.createdAt
      if (!issuanceDate) {
        console.warn('⚠️ No issuanceDate found for credential:', credential.id)
        return {
          status: 'valid',
          daysUntilExpiry: 365,
          recommendRenewal: false,
          message: 'Unable to check renewal status - missing issuance date'
        }
      }
      const issuedDate = new Date(issuanceDate)
      const now = new Date()
      
      // Calculate age in days
      const ageDays = Math.floor((now.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Determine renewal status based on credential type and age
      let renewalRequired = false
      let renewalReason: RenewalStatus['renewalReason'] = 'user_request'
      let daysUntilExpiry: number | undefined
      
      // GitHub credentials should be renewed every 90 days for freshness
      if (credentialData.type.includes('GitHubDeveloperCredential')) {
        if (ageDays >= 90) {
          renewalRequired = true
          renewalReason = 'data_stale'
        } else if (ageDays >= 60) {
          daysUntilExpiry = 90 - ageDays
          renewalReason = 'expiring'
        }
      }

      // Security updates (simulated)
      if (Math.random() > 0.95) { // 5% chance of security update needed
        renewalRequired = true
        renewalReason = 'security_update'
      }

      const status: RenewalStatus = {
        credentialId: credential.id,
        isEligible: true,
        daysUntilExpiry,
        renewalRequired,
        renewalReason,
        estimatedCost: 0, // Free renewals for now
        benefits: this.getRenewalBenefits(renewalReason, ageDays)
      }

      return status

    } catch (error) {
      console.error('❌ Error checking renewal status:', error)
      return {
        credentialId: credential.id,
        isEligible: false,
        renewalRequired: false,
        renewalReason: 'user_request',
        benefits: []
      }
    }
  }

  /**
   * Renew a credential with fresh data
   */
  async renewCredential(
    walletAddress: string,
    credentialId: string,
    renewalReason: string
  ): Promise<PersonaChainCredential> {
    try {
      console.log(`🔄 Renewing credential ${credentialId} for ${walletAddress}`)

      // Get original credential
      const credentials = await personaChainService.getCredentials(walletAddress)
      const credentialsArray = Array.isArray(credentials) ? credentials : []
      const originalCredential = credentialsArray.find(c => c.id === credentialId)
      
      if (!originalCredential) {
        throw new Error('Credential not found')
      }

      // For GitHub credentials, fetch fresh data
      if (originalCredential.credentialData.type.includes('GitHubDeveloperCredential')) {
        const githubUsername = originalCredential.credentialData.credentialSubject.githubUsername

        // Create new session object for renewal (mock)
        const mockSession = {
          user: {
            githubUsername,
            githubId: originalCredential.credentialData.credentialSubject.githubId,
            name: `${githubUsername} (Renewed)`,
            email: `${githubUsername}@example.com`,
            image: `https://github.com/${githubUsername}.png`
          },
          accessToken: 'mock_renewal_token'
        }

        // Generate renewed credential
        const renewalResult = await githubOAuthService.createCredentialFromSession(
          `${originalCredential.credentialData.credentialSubject.id}_renewed`,
          walletAddress,
          mockSession
        )

        if (!renewalResult.success || !renewalResult.credential) {
          throw new Error('Failed to generate renewed credential')
        }

        // Create new PersonaChain credential with incremented version
        const renewedCredential: PersonaChainCredential = {
          id: `${credentialId}_v${Date.now()}`,
          credentialId: renewalResult.credential.credentialSubject.id,
          issuer: renewalResult.credential.issuer,
          subject: walletAddress,
          credentialData: {
            ...renewalResult.credential,
            '@context': [
              ...renewalResult.credential['@context'],
              { renewedFrom: originalCredential.id }
            ]
          },
          blockHeight: renewalResult.blockHeight || Math.floor(Math.random() * 1000000) + 500000,
          txHash: renewalResult.txHash || `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`,
          timestamp: new Date().toISOString(),
          status: 'active'
        }

        // Track renewal event
        this.trackCredentialEvent(walletAddress, credentialId, 'renewed', {
          version: this.getCredentialVersion(credentialId) + 1,
          renewalReason,
          txHash: renewedCredential.txHash,
          blockHeight: renewedCredential.blockHeight
        })

        console.log(`✅ Credential renewed successfully: ${renewedCredential.id}`)
        return renewedCredential
      }

      throw new Error('Unsupported credential type for renewal')

    } catch (error) {
      console.error('❌ Credential renewal failed:', error)
      throw new Error(`Renewal failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get credential analytics
   */
  getCredentialAnalytics(walletAddress: string, credentialId: string): CredentialAnalytics {
    const analytics = this.getAllCredentialAnalytics(walletAddress)
    return analytics.find(a => a.credentialId === credentialId) || this.createDefaultAnalytics(credentialId)
  }

  /**
   * Get credential history
   */
  getCredentialHistory(walletAddress: string): CredentialHistory[] {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_${walletAddress}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Get credential version number
   */
  private getCredentialVersion(credentialId: string): number {
    // Extract version from credential ID or default to 1
    const versionMatch = credentialId.match(/_v(\d+)$/)
    return versionMatch ? parseInt(versionMatch[1]) : 1
  }

  /**
   * Save credential history to localStorage
   */
  private saveCredentialHistory(walletAddress: string, history: CredentialHistory[]): void {
    try {
      localStorage.setItem(`${this.STORAGE_KEY}_${walletAddress}`, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save credential history:', error)
    }
  }

  /**
   * Get all credential analytics
   */
  private getAllCredentialAnalytics(walletAddress: string): CredentialAnalytics[] {
    try {
      const stored = localStorage.getItem(`${this.ANALYTICS_KEY}_${walletAddress}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Update credential analytics
   */
  private updateCredentialAnalytics(
    walletAddress: string,
    credentialId: string,
    action: CredentialHistory['action'],
    metadata: CredentialHistory['metadata']
  ): void {
    try {
      const analytics = this.getAllCredentialAnalytics(walletAddress)
      let credAnalytics = analytics.find(a => a.credentialId === credentialId)
      
      if (!credAnalytics) {
        credAnalytics = this.createDefaultAnalytics(credentialId)
        analytics.push(credAnalytics)
      }

      // Update analytics based on action
      switch (action) {
        case 'shared':
          credAnalytics.totalShares++
          credAnalytics.lastShared = new Date().toISOString()
          break
        case 'verified':
          credAnalytics.totalVerifications++
          credAnalytics.lastVerified = new Date().toISOString()
          if (metadata.verificationResult) {
            credAnalytics.successfulVerifications++
          }
          break
      }

      // Recalculate scores
      credAnalytics.popularityScore = this.calculatePopularityScore(credAnalytics)
      credAnalytics.trustScore = this.calculateTrustScore(credAnalytics)
      credAnalytics.usagePattern = this.determineUsagePattern(credAnalytics)
      credAnalytics.recommendations = this.generateRecommendations(credAnalytics)

      // Save updated analytics
      localStorage.setItem(`${this.ANALYTICS_KEY}_${walletAddress}`, JSON.stringify(analytics))

    } catch (error) {
      console.error('Failed to update credential analytics:', error)
    }
  }

  /**
   * Create default analytics for new credential
   */
  private createDefaultAnalytics(credentialId: string): CredentialAnalytics {
    return {
      credentialId,
      totalShares: 0,
      totalVerifications: 0,
      successfulVerifications: 0,
      popularityScore: 0,
      trustScore: 85, // Default trust score
      usagePattern: 'low',
      recommendations: ['Share your credential to build trust', 'Generate ZK proofs for privacy-preserving verification']
    }
  }

  /**
   * Calculate popularity score
   */
  private calculatePopularityScore(analytics: CredentialAnalytics): number {
    const shareWeight = 2
    const verificationWeight = 3
    const successWeight = 1
    
    return Math.min(100, 
      (analytics.totalShares * shareWeight) + 
      (analytics.totalVerifications * verificationWeight) + 
      (analytics.successfulVerifications * successWeight)
    )
  }

  /**
   * Calculate trust score
   */
  private calculateTrustScore(analytics: CredentialAnalytics): number {
    const baseScore = 85
    const successRate = analytics.totalVerifications > 0 
      ? analytics.successfulVerifications / analytics.totalVerifications 
      : 1
    
    const verificationBonus = Math.min(10, analytics.totalVerifications * 0.5)
    const successPenalty = (1 - successRate) * 20
    
    return Math.max(50, Math.min(100, baseScore + verificationBonus - successPenalty))
  }

  /**
   * Determine usage pattern
   */
  private determineUsagePattern(analytics: CredentialAnalytics): 'high' | 'medium' | 'low' {
    const totalActivity = analytics.totalShares + analytics.totalVerifications
    
    if (totalActivity >= 20) return 'high'
    if (totalActivity >= 5) return 'medium'
    return 'low'
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(analytics: CredentialAnalytics): string[] {
    const recommendations: string[] = []
    
    if (analytics.totalShares < 3) {
      recommendations.push('Share your credential more frequently to increase visibility')
    }
    
    if (analytics.totalVerifications === 0) {
      recommendations.push('Generate QR codes to enable easy verification')
    }
    
    if (analytics.successfulVerifications < analytics.totalVerifications * 0.9) {
      recommendations.push('Consider renewing your credential for better verification rates')
    }
    
    if (analytics.usagePattern === 'high') {
      recommendations.push('Great activity! Consider creating additional credential types')
    }
    
    if (analytics.trustScore < 80) {
      recommendations.push('Improve trust score by ensuring successful verifications')
    }

    return recommendations.length > 0 ? recommendations : ['Your credential is performing well!']
  }

  /**
   * Generate event description
   */
  private generateEventDescription(action: CredentialHistory['action'], metadata: CredentialHistory['metadata']): string {
    switch (action) {
      case 'created':
        return `Credential created and stored on PersonaChain${metadata.txHash ? ` (${metadata.txHash.slice(0, 10)}...)` : ''}`
      case 'renewed':
        return `Credential renewed${metadata.renewalReason ? ` due to ${metadata.renewalReason}` : ''} (v${metadata.version || 1})`
      case 'shared':
        return `Credential shared${metadata.sharedWith ? ` with ${metadata.sharedWith}` : ''}`
      case 'verified':
        return `Credential verification ${metadata.verificationResult ? 'successful' : 'failed'}`
      case 'revoked':
        return 'Credential revoked by user'
      case 'expired':
        return 'Credential expired due to age'
      default:
        return `Credential ${action}`
    }
  }

  /**
   * Get renewal benefits
   */
  private getRenewalBenefits(reason: RenewalStatus['renewalReason'], ageDays: number): string[] {
    const benefits: string[] = []
    
    switch (reason) {
      case 'data_stale':
        benefits.push('Updated with latest GitHub statistics')
        benefits.push('Improved verification accuracy')
        benefits.push('Enhanced trust score')
        break
      case 'expiring':
        benefits.push('Extended validity period')
        benefits.push('Continued verification capabilities')
        break
      case 'security_update':
        benefits.push('Latest security protocols')
        benefits.push('Enhanced cryptographic protection')
        benefits.push('Improved verification speed')
        break
      case 'user_request':
        benefits.push('Fresh credential data')
        benefits.push('Reset analytics tracking')
        break
    }
    
    benefits.push('Free renewal (no additional cost)')
    return benefits
  }
}

// Export singleton instance
export const credentialManagementService = new CredentialManagementService()

// Convenience functions
export const getCredentialInsights = (walletAddress: string) =>
  credentialManagementService.getCredentialInsights(walletAddress)

export const trackCredentialEvent = (
  walletAddress: string,
  credentialId: string,
  action: CredentialHistory['action'],
  metadata?: CredentialHistory['metadata']
) => credentialManagementService.trackCredentialEvent(walletAddress, credentialId, action, metadata)

export const renewCredential = (walletAddress: string, credentialId: string, reason: string) =>
  credentialManagementService.renewCredential(walletAddress, credentialId, reason)

export const checkRenewalStatus = (credential: PersonaChainCredential) =>
  credentialManagementService.checkRenewalStatus(credential)