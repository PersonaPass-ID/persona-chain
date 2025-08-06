/**
 * ADVANCED COMPLIANCE FRAMEWORK
 * 
 * Comprehensive GDPR/CCPA compliance system with data subject rights,
 * privacy by design, consent management, and audit trails.
 */

import { createHash } from 'crypto'
import { dataVaultManager } from '../data-vaults/sovereign-data-vault'

export interface DataSubject {
  id: string
  email: string
  did?: string
  jurisdiction: 'EU' | 'CA' | 'US' | 'UK' | 'OTHER'
  registeredAt: Date
  consentRecords: ConsentRecord[]
  dataProcessingPurposes: ProcessingPurpose[]
  rightsExercised: RightExercised[]
}

export interface ConsentRecord {
  id: string
  purpose: string
  lawfulBasis: LawfulBasis
  consentGiven: boolean
  consentDate: Date
  consentMethod: 'explicit' | 'implied' | 'granular'
  consentText: string
  withdrawalDate?: Date
  version: string
  ipAddress: string
  userAgent: string
}

export interface ProcessingPurpose {
  id: string
  name: string
  category: ProcessingCategory
  lawfulBasis: LawfulBasis
  dataTypes: string[]
  retentionPeriod: number // days
  thirdPartySharing: boolean
  thirdParties: string[]
  active: boolean
}

export interface RightExercised {
  id: string
  type: DataSubjectRight
  requestDate: Date
  completionDate?: Date
  status: 'pending' | 'in_progress' | 'completed' | 'denied'
  requestMethod: 'email' | 'form' | 'api'
  verificationMethod: string
  denyReason?: string
  auditLog: AuditLogEntry[]
}

export interface AuditLogEntry {
  timestamp: Date
  action: string
  actor: string
  resource: string
  details: any
  ipAddress?: string
  userAgent?: string
}

export interface PrivacyNotice {
  version: string
  effectiveDate: Date
  language: string
  jurisdiction: string[]
  dataTypes: DataType[]
  purposes: ProcessingPurpose[]
  retentionPeriods: RetentionPeriod[]
  thirdParties: ThirdParty[]
  rights: DataSubjectRight[]
  contactInfo: ContactInfo
}

export interface DataType {
  category: string
  description: string
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted'
  examples: string[]
}

export interface RetentionPeriod {
  dataType: string
  period: number // days
  basis: string
}

export interface ThirdParty {
  name: string
  purpose: string
  location: string
  adequacyDecision: boolean
  safeguards?: string
}

export interface ContactInfo {
  dpo?: string // Data Protection Officer
  email: string
  phone?: string
  address: string
}

export type LawfulBasis = 
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'vital_interests'
  | 'public_task'
  | 'legitimate_interests'

export type ProcessingCategory = 
  | 'identity_verification'
  | 'fraud_prevention'
  | 'compliance'
  | 'analytics'
  | 'marketing'
  | 'customer_service'

export type DataSubjectRight = 
  | 'access'
  | 'rectification'
  | 'erasure'
  | 'restrict_processing'
  | 'data_portability'
  | 'object'
  | 'opt_out'
  | 'delete'

export interface ComplianceReport {
  generatedAt: Date
  jurisdiction: string
  period: { start: Date; end: Date }
  summary: ComplianceSummary
  dataSubjects: DataSubjectSummary
  consentMetrics: ConsentMetrics
  rightsExercised: RightsMetrics
  breaches: BreachReport[]
  recommendations: string[]
}

export interface ComplianceSummary {
  totalDataSubjects: number
  activeConsents: number
  withdrawnConsents: number
  rightsRequests: number
  completedRequests: number
  averageResponseTime: number // hours
}

export interface DataSubjectSummary {
  byJurisdiction: Record<string, number>
  byConsentStatus: Record<string, number>
  newRegistrations: number
  deletions: number
}

export interface ConsentMetrics {
  totalConsents: number
  consentRate: number
  withdrawalRate: number
  byPurpose: Record<string, number>
  byLawfulBasis: Record<string, number>
}

export interface RightsMetrics {
  byType: Record<DataSubjectRight, number>
  averageResponseTime: number
  completionRate: number
  denialRate: number
}

export interface BreachReport {
  id: string
  date: Date
  type: string
  dataSubjectsAffected: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  notificationRequired: boolean
  regulatorNotified: boolean
  status: 'investigating' | 'contained' | 'resolved'
}

/**
 * GDPR/CCPA Compliance Manager
 */
export class ComplianceFramework {
  private auditLog: AuditLogEntry[] = []
  private readonly GDPR_RESPONSE_TIME = 30 // days
  private readonly CCPA_RESPONSE_TIME = 45 // days

  /**
   * Register a new data subject
   */
  async registerDataSubject(
    email: string,
    jurisdiction: DataSubject['jurisdiction'],
    initialConsents: Omit<ConsentRecord, 'id'>[]
  ): Promise<DataSubject> {
    const subject: DataSubject = {
      id: this.generateId(),
      email,
      jurisdiction,
      registeredAt: new Date(),
      consentRecords: [],
      dataProcessingPurposes: [],
      rightsExercised: []
    }

    // Process initial consents
    for (const consent of initialConsents) {
      const consentRecord: ConsentRecord = {
        ...consent,
        id: this.generateId()
      }
      subject.consentRecords.push(consentRecord)
    }

    // Create audit log entry
    this.logActivity('data_subject_registered', 'system', subject.id, {
      email,
      jurisdiction,
      consentsCount: initialConsents.length
    })

    await this.storeDataSubject(subject)
    return subject
  }

  /**
   * Record consent for processing
   */
  async recordConsent(
    dataSubjectId: string,
    purpose: string,
    lawfulBasis: LawfulBasis,
    consentMethod: ConsentRecord['consentMethod'],
    consentText: string,
    metadata: {
      ipAddress: string
      userAgent: string
      version: string
    }
  ): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      id: this.generateId(),
      purpose,
      lawfulBasis,
      consentGiven: true,
      consentDate: new Date(),
      consentMethod,
      consentText,
      version: metadata.version,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    }

    const subject = await this.getDataSubject(dataSubjectId)
    if (!subject) throw new Error('Data subject not found')

    subject.consentRecords.push(consent)
    await this.storeDataSubject(subject)

    this.logActivity('consent_recorded', dataSubjectId, consent.id, {
      purpose,
      lawfulBasis,
      method: consentMethod
    })

    return consent
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    dataSubjectId: string,
    consentId: string,
    reason?: string
  ): Promise<boolean> {
    const subject = await this.getDataSubject(dataSubjectId)
    if (!subject) return false

    const consent = subject.consentRecords.find(c => c.id === consentId)
    if (!consent) return false

    consent.consentGiven = false
    consent.withdrawalDate = new Date()

    // Stop processing for this purpose if no other valid consent exists
    const hasOtherConsent = subject.consentRecords.some(c => 
      c.purpose === consent.purpose && 
      c.consentGiven && 
      c.id !== consentId
    )

    if (!hasOtherConsent) {
      await this.stopProcessingForPurpose(dataSubjectId, consent.purpose)
    }

    await this.storeDataSubject(subject)

    this.logActivity('consent_withdrawn', dataSubjectId, consentId, {
      purpose: consent.purpose,
      reason
    })

    return true
  }

  /**
   * Handle data subject rights requests
   */
  async exerciseDataSubjectRight(
    dataSubjectId: string,
    rightType: DataSubjectRight,
    requestMethod: RightExercised['requestMethod'],
    verificationMethod: string,
    details?: any
  ): Promise<RightExercised> {
    const subject = await this.getDataSubject(dataSubjectId)
    if (!subject) throw new Error('Data subject not found')

    const rightExercised: RightExercised = {
      id: this.generateId(),
      type: rightType,
      requestDate: new Date(),
      status: 'pending',
      requestMethod,
      verificationMethod,
      auditLog: []
    }

    // Add to subject's rights history
    subject.rightsExercised.push(rightExercised)
    await this.storeDataSubject(subject)

    // Start processing the request
    await this.processRightRequest(dataSubjectId, rightExercised.id, details)

    this.logActivity('right_request_submitted', dataSubjectId, rightExercised.id, {
      type: rightType,
      method: requestMethod
    })

    return rightExercised
  }

  /**
   * Process data subject rights request
   */
  private async processRightRequest(
    dataSubjectId: string,
    requestId: string,
    details?: any
  ): Promise<void> {
    const subject = await this.getDataSubject(dataSubjectId)
    if (!subject) return

    const request = subject.rightsExercised.find(r => r.id === requestId)
    if (!request) return

    request.status = 'in_progress'

    try {
      switch (request.type) {
        case 'access':
          await this.fulfillAccessRequest(dataSubjectId, request)
          break
        case 'rectification':
          await this.fulfillRectificationRequest(dataSubjectId, request, details)
          break
        case 'erasure':
        case 'delete':
          await this.fulfillErasureRequest(dataSubjectId, request)
          break
        case 'restrict_processing':
          await this.fulfillRestrictionRequest(dataSubjectId, request)
          break
        case 'data_portability':
          await this.fulfillPortabilityRequest(dataSubjectId, request)
          break
        case 'object':
        case 'opt_out':
          await this.fulfillObjectionRequest(dataSubjectId, request)
          break
      }

      request.status = 'completed'
      request.completionDate = new Date()

    } catch (error) {
      request.status = 'denied'
      request.denyReason = error instanceof Error ? error.message : 'Processing failed'
    }

    await this.storeDataSubject(subject)

    this.logActivity('right_request_processed', dataSubjectId, requestId, {
      type: request.type,
      status: request.status
    })
  }

  /**
   * Fulfill data access request (GDPR Article 15, CCPA Right to Know)
   */
  private async fulfillAccessRequest(
    dataSubjectId: string,
    request: RightExercised
  ): Promise<void> {
    const subject = await this.getDataSubject(dataSubjectId)
    if (!subject) throw new Error('Data subject not found')

    // Collect all personal data
    const personalData = {
      basicInfo: {
        id: subject.id,
        email: subject.email,
        did: subject.did,
        jurisdiction: subject.jurisdiction,
        registeredAt: subject.registeredAt
      },
      consents: subject.consentRecords,
      processingPurposes: subject.dataProcessingPurposes,
      rightsHistory: subject.rightsExercised,
      vaultData: await this.getVaultDataForSubject(dataSubjectId)
    }

    // Create downloadable report
    const report = this.generateAccessReport(personalData)
    
    // Store report for subject to download
    await this.storeAccessReport(dataSubjectId, request.id, report)

    request.auditLog.push({
      timestamp: new Date(),
      action: 'access_report_generated',
      actor: 'system',
      resource: 'personal_data',
      details: { reportSize: report.length }
    })
  }

  /**
   * Fulfill data rectification request (GDPR Article 16)
   */
  private async fulfillRectificationRequest(
    dataSubjectId: string,
    request: RightExercised,
    corrections: any
  ): Promise<void> {
    const subject = await this.getDataSubject(dataSubjectId)
    if (!subject) throw new Error('Data subject not found')

    // Apply corrections
    if (corrections.email && corrections.email !== subject.email) {
      subject.email = corrections.email
    }

    // Update vault data if needed
    if (corrections.vaultUpdates) {
      await this.updateVaultDataForSubject(dataSubjectId, corrections.vaultUpdates)
    }

    await this.storeDataSubject(subject)

    request.auditLog.push({
      timestamp: new Date(),
      action: 'data_rectified',
      actor: 'system',
      resource: 'personal_data',
      details: corrections
    })
  }

  /**
   * Fulfill data erasure request (GDPR Article 17, CCPA Right to Delete)
   */
  private async fulfillErasureRequest(
    dataSubjectId: string,
    request: RightExercised
  ): Promise<void> {
    // Check if erasure is legally required/possible
    const canErase = await this.checkErasureEligibility(dataSubjectId)
    if (!canErase.eligible) {
      throw new Error(canErase.reason)
    }

    // Delete from all systems
    await this.deleteDataSubjectData(dataSubjectId)

    request.auditLog.push({
      timestamp: new Date(),
      action: 'data_erased',
      actor: 'system',
      resource: 'all_personal_data',
      details: { method: 'complete_deletion' }
    })
  }

  /**
   * Fulfill data portability request (GDPR Article 20)
   */
  private async fulfillPortabilityRequest(
    dataSubjectId: string,
    request: RightExercised
  ): Promise<void> {
    const subject = await this.getDataSubject(dataSubjectId)
    if (!subject) throw new Error('Data subject not found')

    // Export in structured format (JSON)
    const exportData = {
      personal_data: {
        email: subject.email,
        did: subject.did,
        registered_at: subject.registeredAt.toISOString()
      },
      consents: subject.consentRecords.map(c => ({
        purpose: c.purpose,
        consent_date: c.consentDate.toISOString(),
        lawful_basis: c.lawfulBasis,
        active: c.consentGiven
      })),
      vault_data: await this.exportVaultDataForSubject(dataSubjectId)
    }

    // Store portable data
    await this.storePortableData(dataSubjectId, request.id, exportData)

    request.auditLog.push({
      timestamp: new Date(),
      action: 'portable_data_generated',
      actor: 'system',
      resource: 'structured_data',
      details: { format: 'json' }
    })
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    jurisdiction: string,
    period: { start: Date; end: Date }
  ): Promise<ComplianceReport> {
    const subjects = await this.getDataSubjectsByJurisdiction(jurisdiction, period)
    const consents = subjects.flatMap(s => s.consentRecords)
    const rights = subjects.flatMap(s => s.rightsExercised)

    const summary: ComplianceSummary = {
      totalDataSubjects: subjects.length,
      activeConsents: consents.filter(c => c.consentGiven).length,
      withdrawnConsents: consents.filter(c => !c.consentGiven).length,
      rightsRequests: rights.length,
      completedRequests: rights.filter(r => r.status === 'completed').length,
      averageResponseTime: this.calculateAverageResponseTime(rights)
    }

    const dataSubjects: DataSubjectSummary = {
      byJurisdiction: this.groupByJurisdiction(subjects),
      byConsentStatus: this.groupByConsentStatus(subjects),
      newRegistrations: subjects.filter(s => 
        s.registeredAt >= period.start && s.registeredAt <= period.end
      ).length,
      deletions: 0 // Would track deletions
    }

    const consentMetrics: ConsentMetrics = {
      totalConsents: consents.length,
      consentRate: consents.length > 0 ? consents.filter(c => c.consentGiven).length / consents.length : 0,
      withdrawalRate: consents.length > 0 ? consents.filter(c => !c.consentGiven).length / consents.length : 0,
      byPurpose: this.groupConsentsByPurpose(consents),
      byLawfulBasis: this.groupConsentsByLawfulBasis(consents)
    }

    const rightsMetrics: RightsMetrics = {
      byType: this.groupRightsByType(rights),
      averageResponseTime: this.calculateAverageResponseTime(rights),
      completionRate: rights.length > 0 ? rights.filter(r => r.status === 'completed').length / rights.length : 0,
      denialRate: rights.length > 0 ? rights.filter(r => r.status === 'denied').length / rights.length : 0
    }

    return {
      generatedAt: new Date(),
      jurisdiction,
      period,
      summary,
      dataSubjects,
      consentMetrics,
      rightsMetrics,
      breaches: await this.getBreachReports(period),
      recommendations: this.generateRecommendations(summary, rightsMetrics)
    }
  }

  /**
   * Check for compliance violations
   */
  async auditCompliance(jurisdiction: string = 'EU'): Promise<{
    violations: ComplianceViolation[]
    score: number
    recommendations: string[]
  }> {
    const violations: ComplianceViolation[] = []
    
    // Check response times
    const overdueCases = await this.getOverdueRightsCases(jurisdiction)
    if (overdueCases.length > 0) {
      violations.push({
        type: 'response_time',
        severity: 'high',
        description: `${overdueCases.length} rights requests overdue`,
        regulation: jurisdiction === 'EU' ? 'GDPR Article 12' : 'CCPA Section 1798.130',
        remediation: 'Complete overdue requests immediately'
      })
    }

    // Check consent validity
    const invalidConsents = await this.getInvalidConsents()
    if (invalidConsents.length > 0) {
      violations.push({
        type: 'invalid_consent',
        severity: 'critical',
        description: `${invalidConsents.length} invalid consent records`,
        regulation: jurisdiction === 'EU' ? 'GDPR Article 7' : 'CCPA Section 1798.120',
        remediation: 'Re-obtain valid consent or stop processing'
      })
    }

    // Calculate compliance score (0-100)
    const score = Math.max(0, 100 - (violations.length * 15))

    const recommendations = this.generateComplianceRecommendations(violations)

    return { violations, score, recommendations }
  }

  // Helper methods
  private generateId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16)
  }

  private logActivity(
    action: string,
    actor: string,
    resource: string,
    details: any,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.auditLog.push({
      timestamp: new Date(),
      action,
      actor,
      resource,
      details,
      ipAddress,
      userAgent
    })
  }

  private async storeDataSubject(subject: DataSubject): Promise<void> {
    // Store in secure database
    // Implementation would depend on storage backend
  }

  private async getDataSubject(id: string): Promise<DataSubject | null> {
    // Retrieve from database
    return null // Placeholder
  }

  private async stopProcessingForPurpose(dataSubjectId: string, purpose: string): Promise<void> {
    // Stop all processing activities for this purpose
  }

  private async getVaultDataForSubject(dataSubjectId: string): Promise<any> {
    // Get data from sovereignty vaults
    return {}
  }

  private generateAccessReport(data: any): string {
    return JSON.stringify(data, null, 2)
  }

  private async storeAccessReport(dataSubjectId: string, requestId: string, report: string): Promise<void> {
    // Store report for download
  }

  private async updateVaultDataForSubject(dataSubjectId: string, updates: any): Promise<void> {
    // Update vault data
  }

  private async checkErasureEligibility(dataSubjectId: string): Promise<{ eligible: boolean; reason?: string }> {
    // Check legal requirements for erasure
    return { eligible: true }
  }

  private async deleteDataSubjectData(dataSubjectId: string): Promise<void> {
    // Delete all data for subject
  }

  private async exportVaultDataForSubject(dataSubjectId: string): Promise<any> {
    // Export vault data in portable format
    return {}
  }

  private async storePortableData(dataSubjectId: string, requestId: string, data: any): Promise<void> {
    // Store portable data for download
  }

  private async getDataSubjectsByJurisdiction(jurisdiction: string, period: { start: Date; end: Date }): Promise<DataSubject[]> {
    // Get subjects by jurisdiction and period
    return []
  }

  private calculateAverageResponseTime(rights: RightExercised[]): number {
    const completed = rights.filter(r => r.completionDate)
    if (completed.length === 0) return 0
    
    const totalTime = completed.reduce((sum, r) => {
      const diff = r.completionDate!.getTime() - r.requestDate.getTime()
      return sum + (diff / (1000 * 60 * 60)) // Convert to hours
    }, 0)
    
    return totalTime / completed.length
  }

  private groupByJurisdiction(subjects: DataSubject[]): Record<string, number> {
    return subjects.reduce((acc, s) => {
      acc[s.jurisdiction] = (acc[s.jurisdiction] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private groupByConsentStatus(subjects: DataSubject[]): Record<string, number> {
    // Group subjects by their consent status
    return {}
  }

  private groupConsentsByPurpose(consents: ConsentRecord[]): Record<string, number> {
    return consents.reduce((acc, c) => {
      acc[c.purpose] = (acc[c.purpose] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private groupConsentsByLawfulBasis(consents: ConsentRecord[]): Record<string, number> {
    return consents.reduce((acc, c) => {
      acc[c.lawfulBasis] = (acc[c.lawfulBasis] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private groupRightsByType(rights: RightExercised[]): Record<DataSubjectRight, number> {
    return rights.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1
      return acc
    }, {} as Record<DataSubjectRight, number>)
  }

  private async getBreachReports(period: { start: Date; end: Date }): Promise<BreachReport[]> {
    // Get breach reports for period
    return []
  }

  private generateRecommendations(summary: ComplianceSummary, rightsMetrics: RightsMetrics): string[] {
    const recommendations: string[] = []
    
    if (rightsMetrics.averageResponseTime > 24) {
      recommendations.push('Improve response time for data subject rights requests')
    }
    
    if (rightsMetrics.denialRate > 0.1) {
      recommendations.push('Review denied requests to ensure proper justification')
    }
    
    if (summary.withdrawnConsents / summary.totalDataSubjects > 0.2) {
      recommendations.push('Review consent collection practices - high withdrawal rate detected')
    }
    
    return recommendations
  }

  private async getOverdueRightsCases(jurisdiction: string): Promise<RightExercised[]> {
    // Get cases that exceed response time requirements
    return []
  }

  private async getInvalidConsents(): Promise<ConsentRecord[]> {
    // Get consent records that don't meet validity requirements
    return []
  }

  private generateComplianceRecommendations(violations: ComplianceViolation[]): string[] {
    return violations.map(v => v.remediation)
  }
}

export interface ComplianceViolation {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  regulation: string
  remediation: string
}

// Export singleton instance
export const complianceFramework = new ComplianceFramework()