import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailVerificationCredential {
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
    email: string;
    emailHashed: string;
    verificationMethod: string;
    verificationTimestamp: string;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws?: string;
  };
}

export interface EmailCredentialRequest {
  email: string;
  verificationTimestamp: string;
}

export interface ZkProofRequest {
  requiredAttributes: string[];
}

@Injectable()
export class EmailVcIssuerService {
  private readonly logger = new Logger(EmailVcIssuerService.name);
  private readonly issuerDid: string;

  constructor(private configService: ConfigService) {
    this.issuerDid = this.configService.get<string>('ISSUER_DID') || 'did:persona:issuer:email';
  }

  /**
   * Issue email verification credential
   */
  async issueEmailVerificationCredential(request: EmailCredentialRequest): Promise<EmailVerificationCredential> {
    this.logger.log(`Issuing email verification credential for ${this.maskEmail(request.email)}`);

    try {
      const credentialId = this.generateCredentialId(request.email);
      const now = new Date();
      const expirationDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year

      const credential: EmailVerificationCredential = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://personapass.xyz/contexts/email-verification/v1'
        ],
        id: credentialId,
        type: ['VerifiableCredential', 'EmailVerificationCredential'],
        issuer: {
          id: this.issuerDid,
          name: 'PersonaPass Email Verification Service'
        },
        issuanceDate: now.toISOString(),
        expirationDate: expirationDate.toISOString(),
        credentialSubject: {
          id: this.generateSubjectDid(request.email),
          email: request.email,
          emailHashed: this.hashEmail(request.email),
          verificationMethod: 'email-code-verification',
          verificationTimestamp: request.verificationTimestamp,
        },
        proof: {
          type: 'PersonaSignature2024',
          created: now.toISOString(),
          verificationMethod: `${this.issuerDid}#keys-1`,
          proofPurpose: 'assertionMethod',
          jws: this.generateProofSignature(credentialId, request.email)
        }
      };

      this.logger.log(`Email verification credential issued successfully: ${credentialId}`);
      return credential;
    } catch (error) {
      this.logger.error(`Failed to issue email verification credential: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify email verification credential
   */
  async verifyEmailCredential(credential: EmailVerificationCredential): Promise<{
    valid: boolean;
    reason?: string;
    details?: any;
  }> {
    this.logger.log(`Verifying email credential: ${credential.id}`);

    try {
      // Basic structure validation
      if (!credential.id || !credential.credentialSubject || !credential.proof) {
        return {
          valid: false,
          reason: 'Invalid credential structure',
        };
      }

      // Check credential type
      if (!credential.type.includes('EmailVerificationCredential')) {
        return {
          valid: false,
          reason: 'Not an email verification credential',
        };
      }

      // Check issuer
      if (credential.issuer.id !== this.issuerDid) {
        return {
          valid: false,
          reason: 'Invalid issuer',
        };
      }

      // Check expiration
      const now = new Date();
      const expirationDate = new Date(credential.expirationDate);
      if (now > expirationDate) {
        return {
          valid: false,
          reason: 'Credential has expired',
        };
      }

      // Verify email hash
      const expectedHash = this.hashEmail(credential.credentialSubject.email);
      if (credential.credentialSubject.emailHashed !== expectedHash) {
        return {
          valid: false,
          reason: 'Email hash mismatch',
        };
      }

      // In production, verify the cryptographic signature
      // For now, we'll do a simple signature check
      const expectedSignature = this.generateProofSignature(credential.id, credential.credentialSubject.email);
      if (credential.proof.jws !== expectedSignature) {
        return {
          valid: false,
          reason: 'Invalid signature',
        };
      }

      this.logger.log(`Email credential verification successful: ${credential.id}`);
      return {
        valid: true,
        details: {
          email: credential.credentialSubject.email,
          verificationTimestamp: credential.credentialSubject.verificationTimestamp,
          issuanceDate: credential.issuanceDate,
        },
      };
    } catch (error) {
      this.logger.error(`Email credential verification failed: ${error.message}`, error.stack);
      return {
        valid: false,
        reason: 'Verification process failed',
      };
    }
  }

  /**
   * Create zero-knowledge proof from credential
   */
  async createZkProof(credential: EmailVerificationCredential, request: ZkProofRequest): Promise<any> {
    this.logger.log(`Creating ZK proof for email credential: ${credential.id}`);

    try {
      // For demo purposes, create a simple ZK proof structure
      // In production, use a proper ZK library like Circom or similar
      const zkProof = {
        proof: {
          type: 'PersonaZKProof2024',
          nonce: this.generateNonce(),
          revealedAttributes: request.requiredAttributes,
          proof: this.generateZkProofSignature(credential, request.requiredAttributes),
        },
        metadata: {
          proofType: 'email-verification',
          timestamp: new Date().toISOString(),
          attributes: request.requiredAttributes,
        },
      };

      this.logger.log(`ZK proof created successfully for email credential: ${credential.id}`);
      return zkProof;
    } catch (error) {
      this.logger.error(`ZK proof creation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate credential ID
   */
  private generateCredentialId(email: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(email + Date.now()).digest('hex');
    return `urn:persona:email-verification:${hash.substring(0, 32)}`;
  }

  /**
   * Generate subject DID
   */
  private generateSubjectDid(email: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(email).digest('hex');
    return `did:persona:email:${hash.substring(0, 16)}`;
  }

  /**
   * Hash email for privacy
   */
  private hashEmail(email: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  }

  /**
   * Generate proof signature (simplified for demo)
   */
  private generateProofSignature(credentialId: string, email: string): string {
    const crypto = require('crypto');
    const data = `${credentialId}:${email}:${this.issuerDid}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate ZK proof signature (simplified for demo)
   */
  private generateZkProofSignature(credential: EmailVerificationCredential, attributes: string[]): string {
    const crypto = require('crypto');
    const data = `${credential.id}:${attributes.join(':')}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate random nonce
   */
  private generateNonce(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Mask email for logging privacy
   */
  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
      : username;
    return `${maskedUsername}@${domain}`;
  }
}