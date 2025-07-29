import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface PhoneVerificationCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
  };
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: {
    id: string;
    phoneNumber: string;
    phoneNumberHashed: string;
    verificationMethod: string;
    verificationTimestamp: string;
    countryCode: string;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws?: string;
  };
}

export interface CredentialRequest {
  phoneNumber: string;
  verificationTimestamp: string;
}

@Injectable()
export class VcIssuerService {
  private readonly logger = new Logger(VcIssuerService.name);
  private readonly issuerDid: string;
  private readonly issuerName: string;

  constructor(private configService: ConfigService) {
    this.issuerDid = this.configService.get<string>('ISSUER_DID') || 'did:key:persona-issuer-dev';
    this.issuerName = this.configService.get<string>('ISSUER_NAME') || 'Persona Protocol Issuer';
    
    this.logger.log('VC Issuer Service initialized');
    this.logger.log(`Issuer DID: ${this.issuerDid}`);
  }

  /**
   * Issue a phone verification Verifiable Credential
   */
  async issuePhoneVerificationCredential(
    request: CredentialRequest
  ): Promise<PhoneVerificationCredential> {
    this.logger.log(`Issuing phone verification VC for ${request.phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    try {
      const credentialId = `urn:persona:credential:phone:${uuidv4()}`;
      const subjectId = `did:persona:phone:${this.hashPhoneNumber(request.phoneNumber)}`;
      const issuanceDate = new Date().toISOString();
      const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

      const credential: PhoneVerificationCredential = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://persona.org/schemas/phone-verification/v1',
        ],
        id: credentialId,
        type: [
          'VerifiableCredential',
          'PhoneVerificationCredential',
        ],
        issuer: {
          id: this.issuerDid,
          name: this.issuerName,
        },
        issuanceDate,
        expirationDate,
        credentialSubject: {
          id: subjectId,
          phoneNumber: this.maskPhoneNumber(request.phoneNumber),
          phoneNumberHashed: this.hashPhoneNumber(request.phoneNumber),
          verificationMethod: 'twilio-sms',
          verificationTimestamp: request.verificationTimestamp,
          countryCode: this.extractCountryCode(request.phoneNumber),
        },
        proof: {
          type: 'EcdsaSecp256k1Signature2019',
          created: issuanceDate,
          verificationMethod: `${this.issuerDid}#key-1`,
          proofPurpose: 'assertionMethod',
        },
      };

      // In production, this would use a proper cryptographic signature
      // For now, we'll create a mock signature
      credential.proof.jws = await this.createMockSignature(credential);

      this.logger.log(`Successfully issued VC with ID: ${credentialId}`);
      return credential;
    } catch (error: any) {
      this.logger.error(`Failed to issue phone verification VC: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to issue verifiable credential');
    }
  }

  /**
   * Verify a phone verification Verifiable Credential
   */
  async verifyPhoneCredential(credential: PhoneVerificationCredential): Promise<{
    valid: boolean;
    reason?: string;
  }> {
    this.logger.log(`Verifying phone VC with ID: ${credential.id}`);

    try {
      // Basic structure validation
      if (!credential['@context'] || !credential.type || !credential.credentialSubject) {
        return {
          valid: false,
          reason: 'Invalid credential structure',
        };
      }

      // Check if credential is expired
      const now = new Date();
      const expirationDate = new Date(credential.expirationDate);
      if (now > expirationDate) {
        return {
          valid: false,
          reason: 'Credential has expired',
        };
      }

      // Check if issuer is trusted
      if (credential.issuer.id !== this.issuerDid) {
        return {
          valid: false,
          reason: 'Untrusted issuer',
        };
      }

      // Verify proof signature (mock verification for now)
      const signatureValid = await this.verifyMockSignature(credential);
      if (!signatureValid) {
        return {
          valid: false,
          reason: 'Invalid proof signature',
        };
      }

      this.logger.log(`VC verification successful for ${credential.id}`);
      return {
        valid: true,
      };
    } catch (error: any) {
      this.logger.error(`VC verification failed: ${error.message}`, error.stack);
      return {
        valid: false,
        reason: 'Verification process failed',
      };
    }
  }

  /**
   * Create a zero-knowledge proof from phone credential
   */
  async createZkProof(credential: PhoneVerificationCredential, proofRequest: {
    requiredAttributes: string[];
  }): Promise<{
    proof: any;
    metadata: {
      proofType: string;
      timestamp: string;
      attributes: string[];
    };
  }> {
    this.logger.log(`Creating ZK proof for credential ${credential.id}`);

    // Mock ZK proof generation
    // In production, this would use a proper ZK proof system like BBS+ signatures
    const zkProof = {
      type: 'BbsBlsSignature2020',
      nonce: this.generateNonce(),
      revealedAttributes: proofRequest.requiredAttributes,
      proof: this.generateMockZkProof(credential, proofRequest.requiredAttributes),
    };

    return {
      proof: zkProof,
      metadata: {
        proofType: 'zero-knowledge',
        timestamp: new Date().toISOString(),
        attributes: proofRequest.requiredAttributes,
      },
    };
  }

  /**
   * Hash phone number for privacy (using a simple hash for demo)
   */
  private hashPhoneNumber(phoneNumber: string): string {
    // In production, use a proper cryptographic hash with salt
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(phoneNumber).digest('hex').substring(0, 16);
  }

  /**
   * Mask phone number for display
   */
  private maskPhoneNumber(phoneNumber: string): string {
    // +1234567890 -> +123***7890
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length >= 7) {
      return phoneNumber.replace(/\d(?=\d{4})/g, '*');
    }
    return phoneNumber;
  }

  /**
   * Extract country code from phone number
   */
  private extractCountryCode(phoneNumber: string): string {
    // Simple extraction - in production, use a proper phone number library
    if (phoneNumber.startsWith('+1')) return 'US';
    if (phoneNumber.startsWith('+44')) return 'GB';
    if (phoneNumber.startsWith('+49')) return 'DE';
    // Add more country codes as needed
    return 'UNKNOWN';
  }

  /**
   * Create mock signature for development
   */
  private async createMockSignature(credential: PhoneVerificationCredential): Promise<string> {
    // In production, this would use the issuer's private key to sign
    const payload = JSON.stringify({
      credentialSubject: credential.credentialSubject,
      issuer: credential.issuer.id,
      issuanceDate: credential.issuanceDate,
    });
    
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(payload).digest('base64');
  }

  /**
   * Verify mock signature for development
   */
  private async verifyMockSignature(credential: PhoneVerificationCredential): Promise<boolean> {
    // In production, this would verify against the issuer's public key
    try {
      const expectedSignature = await this.createMockSignature(credential);
      return credential.proof.jws === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a random nonce for ZK proofs
   */
  private generateNonce(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate mock ZK proof
   */
  private generateMockZkProof(credential: PhoneVerificationCredential, attributes: string[]): string {
    // Mock ZK proof generation
    const proofData = {
      credential: credential.id,
      attributes,
      timestamp: new Date().toISOString(),
    };
    
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(JSON.stringify(proofData)).digest('base64');
  }
}