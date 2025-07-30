import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AwsSnsService, VerificationStartResponse, VerificationCheckResponse } from './aws-sns.service';
import { VcIssuerService, PhoneVerificationCredential } from './vc-issuer.service';

export interface StartVerificationRequest {
  phoneNumber: string;
}

export interface StartVerificationResponse {
  success: boolean;
  message: string;
  verificationId: string;
  expiresIn: number; // seconds
}

export interface VerifyCodeRequest {
  phoneNumber: string;
  verificationCode: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  credential?: PhoneVerificationCredential;
  zkProof?: any;
}

@Injectable()
export class PhoneVerificationService {
  private readonly logger = new Logger(PhoneVerificationService.name);
  
  constructor(
    private awsSnsService: AwsSnsService,
    private vcIssuerService: VcIssuerService,
  ) {}

  /**
   * Start phone verification process
   */
  async startPhoneVerification(request: StartVerificationRequest): Promise<StartVerificationResponse> {
    this.logger.log(`Starting phone verification process for ${request.phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    try {
      // Validate phone number format
      if (!this.isValidPhoneFormat(request.phoneNumber)) {
        throw new BadRequestException('Invalid phone number format. Please use E.164 format (e.g., +1234567890)');
      }

      // Start AWS SNS verification
      const verificationResult: VerificationStartResponse = await this.awsSnsService.startVerification(
        request.phoneNumber
      );

      // Generate verification ID for tracking
      const verificationId = this.generateVerificationId(request.phoneNumber);

      this.logger.log(`Phone verification started successfully: ${verificationResult.status}`);

      return {
        success: true,
        message: 'Verification code sent successfully',
        verificationId,
        expiresIn: 600, // 10 minutes
      };
    } catch (error) {
      this.logger.error(`Failed to start phone verification: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to send verification code. Please try again.');
    }
  }

  /**
   * Verify code and issue Verifiable Credential
   */
  async verifyCodeAndIssueCredential(request: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    this.logger.log(`Verifying code and issuing VC for ${request.phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    try {
      // Validate inputs
      if (!this.isValidPhoneFormat(request.phoneNumber)) {
        throw new BadRequestException('Invalid phone number format');
      }

      if (!this.isValidVerificationCode(request.verificationCode)) {
        throw new BadRequestException('Invalid verification code format');
      }

      // Verify code with AWS SNS
      const verificationResult: VerificationCheckResponse = await this.awsSnsService.checkVerification(
        request.phoneNumber,
        request.verificationCode
      );

      if (!verificationResult.valid || verificationResult.status !== 'approved') {
        this.logger.warn(`Verification failed: ${verificationResult.status} for ${request.phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);
        
        return {
          success: false,
          message: this.getVerificationErrorMessage(verificationResult.status),
        };
      }

      // Issue Verifiable Credential
      const credential = await this.vcIssuerService.issuePhoneVerificationCredential({
        phoneNumber: request.phoneNumber,
        verificationTimestamp: new Date().toISOString(),
      });

      // Generate ZK proof for immediate use
      const zkProofResult = await this.vcIssuerService.createZkProof(credential, {
        requiredAttributes: ['phoneNumberHashed', 'verificationMethod', 'countryCode'],
      });

      this.logger.log(`Successfully issued phone verification VC: ${credential.id}`);

      return {
        success: true,
        message: 'Phone verification successful and credential issued',
        credential,
        zkProof: zkProofResult,
      };
    } catch (error) {
      this.logger.error(`Failed to verify code and issue VC: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException('Verification failed. Please try again.');
    }
  }

  /**
   * Verify an existing phone verification credential
   */
  async verifyPhoneCredential(credential: PhoneVerificationCredential): Promise<{
    valid: boolean;
    message: string;
    details?: any;
  }> {
    this.logger.log(`Verifying phone credential: ${credential.id}`);

    try {
      const verificationResult = await this.vcIssuerService.verifyPhoneCredential(credential);

      return {
        valid: verificationResult.valid,
        message: verificationResult.valid 
          ? 'Credential is valid and trusted'
          : `Credential verification failed: ${verificationResult.reason}`,
        details: verificationResult,
      };
    } catch (error) {
      this.logger.error(`Credential verification error: ${error.message}`, error.stack);
      
      return {
        valid: false,
        message: 'Credential verification process failed',
      };
    }
  }

  /**
   * Create ZK proof from existing credential
   */
  async createZkProofFromCredential(
    credential: PhoneVerificationCredential,
    proofRequest: { requiredAttributes: string[] }
  ): Promise<any> {
    this.logger.log(`Creating ZK proof for credential: ${credential.id}`);

    try {
      // First verify the credential is valid
      const verificationResult = await this.vcIssuerService.verifyPhoneCredential(credential);
      if (!verificationResult.valid) {
        throw new UnauthorizedException(`Invalid credential: ${verificationResult.reason}`);
      }

      // Create ZK proof
      const zkProofResult = await this.vcIssuerService.createZkProof(credential, proofRequest);

      this.logger.log(`ZK proof created successfully for credential: ${credential.id}`);
      return zkProofResult;
    } catch (error) {
      this.logger.error(`Failed to create ZK proof: ${error.message}`, error.stack);
      
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new BadRequestException('Failed to create zero-knowledge proof');
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth(): Promise<{
    status: string;
    services: any[];
    timestamp: string;
  }> {
    try {
      const awsSnsStatus = await this.awsSnsService.getServiceStatus();
      
      const services = [
        awsSnsStatus,
        {
          service: 'vc-issuer',
          status: 'healthy',
          mode: 'active',
        },
      ];

      const overallStatus = services.every(s => s.status === 'healthy') ? 'healthy' : 'degraded';

      return {
        status: overallStatus,
        services,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        services: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate phone number format (E.164)
   */
  private isValidPhoneFormat(phoneNumber: string): boolean {
    // E.164 format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Validate verification code format
   */
  private isValidVerificationCode(code: string): boolean {
    // 6-digit numeric code
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(code);
  }

  /**
   * Generate verification ID for tracking
   */
  private generateVerificationId(phoneNumber: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(phoneNumber + Date.now()).digest('hex');
    return `phone_verification_${hash.substring(0, 16)}`;
  }

  /**
   * Get user-friendly error message based on verification status
   */
  private getVerificationErrorMessage(status: string): string {
    switch (status) {
      case 'expired':
        return 'Verification code has expired. Please request a new code.';
      case 'failed':
        return 'Invalid verification code. Please check and try again.';
      case 'pending':
        return 'Verification is still pending. Please wait and try again.';
      default:
        return 'Verification failed. Please try again.';
    }
  }
}