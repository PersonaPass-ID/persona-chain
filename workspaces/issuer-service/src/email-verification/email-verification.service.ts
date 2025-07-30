import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SendGridService, EmailVerificationStartResponse, EmailVerificationCheckResponse } from './sendgrid.service';
import { EmailVcIssuerService, EmailVerificationCredential } from './email-vc-issuer.service';

export interface StartEmailVerificationRequest {
  email: string;
}

export interface StartEmailVerificationResponse {
  success: boolean;
  message: string;
  verificationId: string;
  expiresIn: number; // seconds
}

export interface VerifyEmailCodeRequest {
  email: string;
  verificationCode: string;
}

export interface VerifyEmailCodeResponse {
  success: boolean;
  message: string;
  credential?: EmailVerificationCredential;
  zkProof?: any;
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  
  constructor(
    private sendGridService: SendGridService,
    private emailVcIssuerService: EmailVcIssuerService,
  ) {}

  /**
   * Start email verification process
   */
  async startEmailVerification(request: StartEmailVerificationRequest): Promise<StartEmailVerificationResponse> {
    this.logger.log(`Starting email verification process for ${this.maskEmail(request.email)}`);

    try {
      // Validate email format
      if (!this.isValidEmailFormat(request.email)) {
        throw new BadRequestException('Invalid email address format');
      }

      // Start SendGrid verification
      const verificationResult: EmailVerificationStartResponse = await this.sendGridService.startVerification(
        request.email
      );

      // Generate verification ID for tracking
      const verificationId = this.generateVerificationId(request.email);

      this.logger.log(`Email verification started successfully: ${verificationResult.status}`);

      return {
        success: true,
        message: 'Verification code sent successfully to your email',
        verificationId,
        expiresIn: 300, // 5 minutes
      };
    } catch (error) {
      this.logger.error(`Failed to start email verification: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to send verification email. Please try again.');
    }
  }

  /**
   * Verify code and issue Verifiable Credential
   */
  async verifyCodeAndIssueCredential(request: VerifyEmailCodeRequest): Promise<VerifyEmailCodeResponse> {
    this.logger.log(`Verifying code and issuing VC for ${this.maskEmail(request.email)}`);

    try {
      // Validate inputs
      if (!this.isValidEmailFormat(request.email)) {
        throw new BadRequestException('Invalid email address format');
      }

      if (!this.isValidVerificationCode(request.verificationCode)) {
        throw new BadRequestException('Invalid verification code format');
      }

      // Verify code with SendGrid
      const verificationResult: EmailVerificationCheckResponse = await this.sendGridService.checkVerification(
        request.email,
        request.verificationCode
      );

      if (!verificationResult.valid || verificationResult.status !== 'approved') {
        this.logger.warn(`Email verification failed: ${verificationResult.status} for ${this.maskEmail(request.email)}`);
        
        return {
          success: false,
          message: this.getVerificationErrorMessage(verificationResult.status),
        };
      }

      // Issue Verifiable Credential
      const credential = await this.emailVcIssuerService.issueEmailVerificationCredential({
        email: request.email,
        verificationTimestamp: new Date().toISOString(),
      });

      // Generate ZK proof for immediate use
      const zkProofResult = await this.emailVcIssuerService.createZkProof(credential, {
        requiredAttributes: ['emailHashed', 'verificationMethod'],
      });

      this.logger.log(`Successfully issued email verification VC: ${credential.id}`);

      return {
        success: true,
        message: 'Email verification successful and credential issued',
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
   * Verify an existing email verification credential
   */
  async verifyEmailCredential(credential: EmailVerificationCredential): Promise<{
    valid: boolean;
    message: string;
    details?: any;
  }> {
    this.logger.log(`Verifying email credential: ${credential.id}`);

    try {
      const verificationResult = await this.emailVcIssuerService.verifyEmailCredential(credential);

      return {
        valid: verificationResult.valid,
        message: verificationResult.valid 
          ? 'Email credential is valid and trusted'
          : `Email credential verification failed: ${verificationResult.reason}`,
        details: verificationResult,
      };
    } catch (error) {
      this.logger.error(`Email credential verification error: ${error.message}`, error.stack);
      
      return {
        valid: false,
        message: 'Email credential verification process failed',
      };
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
      const sendGridStatus = await this.sendGridService.getServiceStatus();
      
      const services = [
        sendGridStatus,
        {
          service: 'email-vc-issuer',
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
      this.logger.error(`Email service health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        services: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate email address format
   */
  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
  private generateVerificationId(email: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(email + Date.now()).digest('hex');
    return `email_verification_${hash.substring(0, 16)}`;
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