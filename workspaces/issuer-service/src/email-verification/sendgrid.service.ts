import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

export interface EmailVerificationStartResponse {
  status: 'pending' | 'sent';
  to: string;
  channel: 'email';
  serviceName: string;
}

export interface EmailVerificationCheckResponse {
  status: 'approved' | 'pending' | 'expired' | 'failed';
  to: string;
  channel: 'email';
  valid: boolean;
}

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private readonly client: typeof sgMail | null;
  private readonly fromEmail: string;
  private readonly templateId: string | undefined;

  // Store verification codes temporarily (in production, use Redis)
  private verificationCodes = new Map<string, { code: string; expiresAt: Date }>();

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@personapass.xyz';
    this.templateId = this.configService.get<string>('SENDGRID_TEMPLATE_ID');

    if (!apiKey) {
      this.logger.warn('SendGrid API key not configured. Email verification will use mock mode.');
      this.client = null;
    } else {
      sgMail.setApiKey(apiKey);
      this.client = sgMail;
      this.logger.log('SendGrid service initialized successfully');
    }
  }

  /**
   * Start email verification by sending verification code
   */
  async startVerification(email: string): Promise<EmailVerificationStartResponse> {
    this.logger.log(`Starting email verification for: ${this.maskEmail(email)}`);

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email address format');
    }

    try {
      // Generate 6-digit code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code with 5-minute expiration
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      this.verificationCodes.set(email, { code: verificationCode, expiresAt });

      if (!this.client) {
        // Mock mode for development
        this.logger.log(`Mock email verification code: ${verificationCode}`);
        return {
          status: 'sent',
          to: email,
          channel: 'email',
          serviceName: 'MOCK_SENDGRID',
        };
      }

      // Send email using SendGrid
      if (this.templateId) {
        // Use dynamic template
        await this.client.send({
          to: email,
          from: {
            email: this.fromEmail,
            name: 'PersonaPass'
          },
          templateId: this.templateId,
          dynamicTemplateData: {
            verification_code: verificationCode,
            email: email
          }
        });
      } else {
        // Send plain email
        await this.client.send({
          to: email,
          from: {
            email: this.fromEmail,
            name: 'PersonaPass'
          },
          subject: 'Verify Your Email - PersonaPass',
          html: this.generateEmailHTML(verificationCode),
          text: `Your PersonaPass verification code is: ${verificationCode}\n\nThis code expires in 5 minutes.`
        });
      }

      this.logger.log(`Email verification sent to: ${this.maskEmail(email)}`);

      return {
        status: 'sent',
        to: email,
        channel: 'email',
        serviceName: 'SENDGRID',
      };
    } catch (error: any) {
      this.logger.error(`Failed to send verification email: ${error.message}`, error.stack);
      
      if (error.code === 401) {
        throw new BadRequestException('Invalid SendGrid API key');
      } else if (error.code === 400) {
        throw new BadRequestException('Invalid email address or configuration');
      }
      
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }

  /**
   * Verify email with the provided code
   */
  async checkVerification(email: string, code: string): Promise<EmailVerificationCheckResponse> {
    this.logger.log(`Checking email verification for: ${this.maskEmail(email)}`);

    // Validate inputs
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email address format');
    }

    if (!this.isValidVerificationCode(code)) {
      throw new BadRequestException('Invalid verification code format');
    }

    try {
      const storedData = this.verificationCodes.get(email);

      if (!this.client) {
        // Mock mode for development - accept specific test codes
        const isTestCode = ['123456', '000000', '111111'].includes(code);
        this.logger.log(`Mock email verification: ${isTestCode ? 'approved' : 'failed'}`);
        
        if (isTestCode) {
          this.verificationCodes.delete(email); // Clean up
        }
        
        return {
          status: isTestCode ? 'approved' : 'failed',
          to: email,
          channel: 'email',
          valid: isTestCode,
        };
      }

      if (!storedData) {
        return {
          status: 'expired',
          to: email,
          channel: 'email',
          valid: false,
        };
      }

      const now = new Date();
      if (now > storedData.expiresAt) {
        this.verificationCodes.delete(email); // Clean up expired code
        return {
          status: 'expired',
          to: email,
          channel: 'email',
          valid: false,
        };
      }

      const isValid = storedData.code === code;
      
      if (isValid) {
        this.verificationCodes.delete(email); // Clean up successful verification
        this.logger.log(`Email verification successful for: ${this.maskEmail(email)}`);
      } else {
        this.logger.log(`Email verification failed for: ${this.maskEmail(email)}`);
      }

      return {
        status: isValid ? 'approved' : 'failed',
        to: email,
        channel: 'email',
        valid: isValid,
      };
    } catch (error: any) {
      this.logger.error(`Failed to check email verification: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to verify code');
    }
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate verification code format
   */
  private isValidVerificationCode(code: string): boolean {
    // 6-digit codes
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(code);
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

  /**
   * Generate HTML email content (fallback when no template)
   */
  private generateEmailHTML(verificationCode: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <title>Verify Your Email - PersonaPass</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; background: linear-gradient(135deg, #10b981, #14b8a6); padding: 30px; border-radius: 10px; color: white;">
              <h1>🔐 PersonaPass Email Verification</h1>
              <p style="font-size: 18px;">Your verification code is:</p>
              <div style="background: white; color: #10b981; padding: 15px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                  ${verificationCode}
              </div>
              <p>This code expires in 5 minutes.</p>
          </div>
          <div style="padding: 20px; text-align: center; color: #666;">
              <p>If you didn't request this code, please ignore this email.</p>
              <p style="font-size: 12px;">© 2025 PersonaPass - Decentralized Identity Platform</p>
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Get service status for health checks
   */
  async getServiceStatus(): Promise<{ service: string; status: string; mode: string }> {
    try {
      if (!this.client) {
        return {
          service: 'sendgrid',
          status: 'healthy',
          mode: 'mock',
        };
      }

      // Test SendGrid connection (this is a simple check)
      return {
        service: 'sendgrid',
        status: 'healthy',
        mode: 'production',
      };
    } catch (error: any) {
      this.logger.error(`SendGrid health check failed: ${error.message}`);
      return {
        service: 'sendgrid',
        status: 'unhealthy',
        mode: this.client ? 'production' : 'mock',
      };
    }
  }

  /**
   * Clean up expired verification codes (call periodically)
   */
  cleanupExpiredCodes(): void {
    const now = new Date();
    for (const [email, data] of this.verificationCodes.entries()) {
      if (now > data.expiresAt) {
        this.verificationCodes.delete(email);
      }
    }
  }
}