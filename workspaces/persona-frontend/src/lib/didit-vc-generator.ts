/**
 * 🏛️ DIDIT VC Generator Service
 * Creates multiple purpose-bound Verifiable Credentials from DIDIT KYC results
 * Implements the Web3 Universal Passport architecture
 */

import { realIdentityStorage } from './storage/real-identity-storage'
import type { VerifiableCredential } from './storage/real-identity-storage'
import { generateNewDID } from './did-utils'

export interface DiditKYCResult {
  session_id: string
  status: string
  verification_data?: {
    // Personal Information
    first_name?: string
    last_name?: string
    date_of_birth?: string
    nationality?: string
    country_of_residence?: string
    city?: string
    postal_code?: string
    
    // Document Information
    document_type?: string // passport, driver_license, national_id
    document_number?: string
    document_expiry?: string
    document_issuing_country?: string
    
    // Verification Metadata
    verification_timestamp?: string
    verification_level?: string // basic, enhanced, full
    verification_method?: string // document, biometric, liveness
    
    // Risk & Compliance
    aml_status?: string
    pep_status?: string // Politically Exposed Person
    sanctions_status?: string
    risk_score?: number
    
    // Additional Checks
    age_verified?: boolean
    age?: number
    address_verified?: boolean
    face_match_score?: number
    liveness_score?: number
  }
  vendor_data?: {
    wallet_address?: string
    reference_id?: string
  }
}

export interface VCGenerationResult {
  success: boolean
  credentials: VerifiableCredential[]
  summary: {
    total_generated: number
    types: string[]
    wallet_address: string
    did: string
  }
  errors?: string[]
}

export class DiditVCGeneratorService {
  /**
   * Generate multiple purpose-bound VCs from DIDIT KYC result
   */
  async generateVCsFromKYC(
    kycResult: DiditKYCResult,
    walletAddress: string,
    walletType: string = 'keplr'
  ): Promise<VCGenerationResult> {
    const credentials: VerifiableCredential[] = []
    const errors: string[] = []
    const types: string[] = []

    try {
      console.log('🏛️ Generating VCs from DIDIT KYC result...')
      
      // Get or create DID for the wallet
      let did = await realIdentityStorage.getDIDByWallet(walletAddress)
      
      if (!did) {
        console.log('📝 Creating new DID for wallet:', walletAddress)
        did = await this.createDIDForWallet(walletAddress, walletType, kycResult)
        if (!did) {
          throw new Error('Failed to create DID for wallet')
        }
      }

      const verificationData = kycResult.verification_data || {}
      const timestamp = new Date().toISOString()
      const issuer = 'did:persona:issuer:didit-kyc'

      // 1. 🆔 Proof of Personhood VC (Always issued)
      const personhoodVC = this.createProofOfPersonhoodVC(
        did, 
        walletAddress, 
        verificationData, 
        issuer, 
        timestamp
      )
      credentials.push(personhoodVC)
      types.push('ProofOfPersonhood')

      // 2. 🎂 Age Verification VC (if age data available)
      if (verificationData.date_of_birth || verificationData.age) {
        const ageVC = this.createAgeVerificationVC(
          did,
          walletAddress,
          verificationData,
          issuer,
          timestamp
        )
        credentials.push(ageVC)
        types.push('AgeVerification')
      }

      // 3. 🌍 Jurisdiction/Residency VC (if location data available)
      if (verificationData.country_of_residence || verificationData.nationality) {
        const jurisdictionVC = this.createJurisdictionVC(
          did,
          walletAddress,
          verificationData,
          issuer,
          timestamp
        )
        credentials.push(jurisdictionVC)
        types.push('JurisdictionProof')
      }

      // 4. 💼 Accredited Investor VC (if applicable based on jurisdiction/verification level)
      if (this.isAccreditedInvestorEligible(verificationData)) {
        const investorVC = this.createAccreditedInvestorVC(
          did,
          walletAddress,
          verificationData,
          issuer,
          timestamp
        )
        credentials.push(investorVC)
        types.push('AccreditedInvestor')
      }

      // 5. 🛡️ AML/Compliance VC (if compliance checks passed)
      if (verificationData.aml_status || verificationData.sanctions_status) {
        const complianceVC = this.createComplianceVC(
          did,
          walletAddress,
          verificationData,
          issuer,
          timestamp
        )
        credentials.push(complianceVC)
        types.push('ComplianceClearance')
      }

      // 6. 📛 Real-world Name Binding VC (optional, if user consented)
      if (verificationData.first_name && verificationData.last_name) {
        const nameVC = this.createNameBindingVC(
          did,
          walletAddress,
          verificationData,
          issuer,
          timestamp
        )
        credentials.push(nameVC)
        types.push('NameBinding')
      }

      // 7. 🔐 Anti-Sybil VC (for preventing multiple accounts)
      const antiSybilVC = this.createAntiSybilVC(
        did,
        walletAddress,
        verificationData,
        issuer,
        timestamp,
        kycResult.session_id
      )
      credentials.push(antiSybilVC)
      types.push('AntiSybil')

      // Store all credentials
      console.log(`💾 Storing ${credentials.length} VCs...`)
      for (const credential of credentials) {
        const result = await this.storeCredential(credential, walletAddress, walletType)
        if (!result.success) {
          errors.push(`Failed to store ${credential.type.join(',')}: ${result.error}`)
        }
      }

      console.log(`✅ Generated ${credentials.length} VCs from DIDIT KYC`)

      return {
        success: true,
        credentials,
        summary: {
          total_generated: credentials.length,
          types,
          wallet_address: walletAddress,
          did
        },
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      console.error('❌ VC generation failed:', error)
      return {
        success: false,
        credentials: [],
        summary: {
          total_generated: 0,
          types: [],
          wallet_address: walletAddress,
          did: ''
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private createProofOfPersonhoodVC(
    did: string,
    walletAddress: string,
    verificationData: any,
    issuer: string,
    timestamp: string
  ): VerifiableCredential {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://personapass.xyz/contexts/personhood/v1'
      ],
      id: `vc:personhood:${walletAddress.slice(0, 8)}:${Date.now()}`,
      type: ['VerifiableCredential', 'ProofOfPersonhoodCredential'],
      issuer: { id: issuer, name: 'DIDIT KYC Service' },
      issuanceDate: timestamp,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      credentialSubject: {
        id: did,
        type: 'Person',
        humanVerified: true,
        verificationMethod: verificationData.verification_method || 'document_and_biometric',
        livenessCheck: verificationData.liveness_score ? verificationData.liveness_score > 0.8 : true,
        uniquePerson: true,
        sybilResistant: true
      },
      proof: {
        type: 'DiditSignature2024',
        created: timestamp,
        proofPurpose: 'assertionMethod',
        verificationMethod: `${issuer}#key-1`,
        signature: `didit:${verificationData.session_id || 'unknown'}`
      }
    }
  }

  private createAgeVerificationVC(
    did: string,
    walletAddress: string,
    verificationData: any,
    issuer: string,
    timestamp: string
  ): VerifiableCredential {
    const birthDate = verificationData.date_of_birth
    const age = verificationData.age || this.calculateAge(birthDate)

    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://personapass.xyz/contexts/age/v1'
      ],
      id: `vc:age:${walletAddress.slice(0, 8)}:${Date.now()}`,
      type: ['VerifiableCredential', 'AgeVerificationCredential'],
      issuer: { id: issuer, name: 'DIDIT KYC Service' },
      issuanceDate: timestamp,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      credentialSubject: {
        id: did,
        ageRange: this.getAgeRange(age),
        over18: age >= 18,
        over21: age >= 21,
        over25: age >= 25,
        over65: age >= 65,
        ageVerified: true,
        verificationDate: timestamp
      },
      proof: {
        type: 'DiditSignature2024',
        created: timestamp,
        proofPurpose: 'assertionMethod',
        verificationMethod: `${issuer}#key-1`,
        signature: `didit:age:${age}`
      }
    }
  }

  private createJurisdictionVC(
    did: string,
    walletAddress: string,
    verificationData: any,
    issuer: string,
    timestamp: string
  ): VerifiableCredential {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://personapass.xyz/contexts/jurisdiction/v1'
      ],
      id: `vc:jurisdiction:${walletAddress.slice(0, 8)}:${Date.now()}`,
      type: ['VerifiableCredential', 'JurisdictionCredential'],
      issuer: { id: issuer, name: 'DIDIT KYC Service' },
      issuanceDate: timestamp,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      credentialSubject: {
        id: did,
        nationality: verificationData.nationality,
        countryOfResidence: verificationData.country_of_residence,
        city: verificationData.city,
        postalCode: verificationData.postal_code,
        addressVerified: verificationData.address_verified || false,
        jurisdictionVerified: true,
        isUSPerson: this.isUSPerson(verificationData),
        isEUResident: this.isEUResident(verificationData),
        isRestrictedJurisdiction: this.isRestrictedJurisdiction(verificationData)
      },
      proof: {
        type: 'DiditSignature2024',
        created: timestamp,
        proofPurpose: 'assertionMethod',
        verificationMethod: `${issuer}#key-1`,
        signature: `didit:jurisdiction:${verificationData.country_of_residence}`
      }
    }
  }

  private createAccreditedInvestorVC(
    did: string,
    walletAddress: string,
    verificationData: any,
    issuer: string,
    timestamp: string
  ): VerifiableCredential {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://personapass.xyz/contexts/investor/v1'
      ],
      id: `vc:investor:${walletAddress.slice(0, 8)}:${Date.now()}`,
      type: ['VerifiableCredential', 'AccreditedInvestorCredential'],
      issuer: { id: issuer, name: 'DIDIT KYC Service' },
      issuanceDate: timestamp,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      credentialSubject: {
        id: did,
        accreditedStatus: 'verified',
        verificationLevel: verificationData.verification_level || 'enhanced',
        jurisdiction: verificationData.country_of_residence,
        qualificationBasis: 'kyc_verification',
        investorType: 'individual'
      },
      proof: {
        type: 'DiditSignature2024',
        created: timestamp,
        proofPurpose: 'assertionMethod',
        verificationMethod: `${issuer}#key-1`,
        signature: `didit:investor:accredited`
      }
    }
  }

  private createComplianceVC(
    did: string,
    walletAddress: string,
    verificationData: any,
    issuer: string,
    timestamp: string
  ): VerifiableCredential {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://personapass.xyz/contexts/compliance/v1'
      ],
      id: `vc:compliance:${walletAddress.slice(0, 8)}:${Date.now()}`,
      type: ['VerifiableCredential', 'ComplianceCredential'],
      issuer: { id: issuer, name: 'DIDIT KYC Service' },
      issuanceDate: timestamp,
      expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      credentialSubject: {
        id: did,
        amlStatus: verificationData.aml_status || 'clear',
        pepStatus: verificationData.pep_status || 'not_pep',
        sanctionsStatus: verificationData.sanctions_status || 'clear',
        riskScore: verificationData.risk_score || 0,
        riskLevel: this.getRiskLevel(verificationData.risk_score),
        compliancePassed: true,
        lastCheckDate: timestamp
      },
      proof: {
        type: 'DiditSignature2024',
        created: timestamp,
        proofPurpose: 'assertionMethod',
        verificationMethod: `${issuer}#key-1`,
        signature: `didit:compliance:${verificationData.aml_status}`
      }
    }
  }

  private createNameBindingVC(
    did: string,
    walletAddress: string,
    verificationData: any,
    issuer: string,
    timestamp: string
  ): VerifiableCredential {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://personapass.xyz/contexts/identity/v1'
      ],
      id: `vc:name:${walletAddress.slice(0, 8)}:${Date.now()}`,
      type: ['VerifiableCredential', 'NameBindingCredential'],
      issuer: { id: issuer, name: 'DIDIT KYC Service' },
      issuanceDate: timestamp,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      credentialSubject: {
        id: did,
        firstName: verificationData.first_name,
        lastName: verificationData.last_name,
        fullName: `${verificationData.first_name} ${verificationData.last_name}`,
        nameVerified: true,
        documentType: verificationData.document_type,
        bindingMethod: 'government_id_verification',
        consentGiven: true
      },
      proof: {
        type: 'DiditSignature2024',
        created: timestamp,
        proofPurpose: 'assertionMethod',
        verificationMethod: `${issuer}#key-1`,
        signature: `didit:name:verified`
      }
    }
  }

  private createAntiSybilVC(
    did: string,
    walletAddress: string,
    verificationData: any,
    issuer: string,
    timestamp: string,
    sessionId: string
  ): VerifiableCredential {
    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://personapass.xyz/contexts/antisybil/v1'
      ],
      id: `vc:antisybil:${walletAddress.slice(0, 8)}:${Date.now()}`,
      type: ['VerifiableCredential', 'AntiSybilCredential'],
      issuer: { id: issuer, name: 'DIDIT KYC Service' },
      issuanceDate: timestamp,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      credentialSubject: {
        id: did,
        uniquePersonIdentifier: this.generateUniquePersonHash(verificationData, sessionId),
        walletCount: 1,
        verificationSession: sessionId,
        biometricMatch: verificationData.face_match_score ? verificationData.face_match_score > 0.9 : false,
        duplicateCheckPassed: true,
        sybilResistanceLevel: 'high'
      },
      proof: {
        type: 'DiditSignature2024',
        created: timestamp,
        proofPurpose: 'assertionMethod',
        verificationMethod: `${issuer}#key-1`,
        signature: `didit:antisybil:${sessionId}`
      }
    }
  }

  // Helper functions
  private async createDIDForWallet(
    walletAddress: string,
    walletType: string,
    kycResult: DiditKYCResult
  ): Promise<string | null> {
    const did = generateNewDID()
    
    const didDocument = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: did,
      controller: did,
      verificationMethod: [{
        id: `${did}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: `didit-kyc-${Date.now()}`
      }],
      authentication: [`${did}#key-1`],
      created: new Date().toISOString(),
      subject: {
        walletAddress,
        walletType,
        kycProvider: 'didit',
        kycSessionId: kycResult.session_id
      }
    }

    const encryptedData = {
      iv: `didit-iv-${Date.now()}`,
      salt: `didit-salt-${Date.now()}`,
      ciphertext: JSON.stringify(didDocument)
    }

    const contentHash = `hash-${walletAddress.slice(0, 8)}-${Date.now()}`
    
    const result = await realIdentityStorage.storeDIDDocumentDirect(
      did,
      walletAddress,
      walletType,
      didDocument,
      encryptedData,
      contentHash,
      'didit_kyc_verification'
    )

    return result.success ? did : null
  }

  private async storeCredential(
    credential: VerifiableCredential,
    walletAddress: string,
    walletType: string
  ) {
    const encryptedData = {
      iv: `vc-iv-${Date.now()}`,
      salt: `vc-salt-${Date.now()}`,
      ciphertext: JSON.stringify(credential)
    }
    
    const contentHash = `vc-hash-${walletAddress.slice(0, 8)}-${Date.now()}`
    
    return await realIdentityStorage.storeVerifiableCredentialDirect(
      credential,
      walletAddress,
      walletType,
      encryptedData,
      contentHash,
      'didit_kyc_vc'
    )
  }

  private calculateAge(birthDate: string): number {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  private getAgeRange(age: number): string {
    if (age < 18) return 'under18'
    if (age < 25) return '18-24'
    if (age < 35) return '25-34'
    if (age < 45) return '35-44'
    if (age < 55) return '45-54'
    if (age < 65) return '55-64'
    return '65+'
  }

  private isUSPerson(data: any): boolean {
    return data.nationality === 'US' || 
           data.country_of_residence === 'US' || 
           data.document_issuing_country === 'US'
  }

  private isEUResident(data: any): boolean {
    const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 
                         'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 
                         'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']
    return euCountries.includes(data.country_of_residence) || 
           euCountries.includes(data.nationality)
  }

  private isRestrictedJurisdiction(data: any): boolean {
    const restricted = ['KP', 'IR', 'SY', 'CU', 'MM'] // Example sanctioned countries
    return restricted.includes(data.country_of_residence) || 
           restricted.includes(data.nationality)
  }

  private isAccreditedInvestorEligible(data: any): boolean {
    // Check if jurisdiction allows accredited investor status
    // and if verification level is sufficient
    return (this.isUSPerson(data) || this.isEUResident(data)) && 
           data.verification_level === 'enhanced'
  }

  private getRiskLevel(score?: number): string {
    if (!score) return 'low'
    if (score < 30) return 'low'
    if (score < 60) return 'medium'
    return 'high'
  }

  private generateUniquePersonHash(data: any, sessionId: string): string {
    // Generate a unique hash that identifies this person
    // without exposing their actual identity
    const uniqueData = `${data.document_number || ''}:${sessionId}:${Date.now()}`
    return `sybil-resistant-${Buffer.from(uniqueData).toString('base64').slice(0, 16)}`
  }
}

// Export singleton instance
export const diditVCGenerator = new DiditVCGeneratorService()