import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

export interface VerificationStartResponse {
  status: 'pending' | 'sent';
  to: string;
  channel: 'sms';
  serviceSid: string;
}

export interface VerificationCheckResponse {
  status: 'approved' | 'pending' | 'expired' | 'failed';
  to: string;
  channel: 'sms';
  valid: boolean;
}

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly client: Twilio | null;
  private readonly serviceSid: string | undefined;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.serviceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !this.serviceSid) {
      this.logger.warn('Twilio credentials not configured. Phone verification will use mock mode.');
      this.client = null;
    } else {
      this.client = new Twilio(accountSid, authToken);
      this.logger.log('Twilio service initialized successfully');
    }
  }

  /**
   * Start phone number verification by sending SMS code
   */
  async startVerification(phoneNumber: string): Promise<VerificationStartResponse> {
    this.logger.log(`Starting verification for phone: ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new BadRequestException('Invalid phone number format');
    }

    try {
      if (!this.client) {
        // Mock mode for development
        this.logger.log('Using mock mode - no SMS will be sent');
        return {
          status: 'sent',
          to: phoneNumber,
          channel: 'sms',
          serviceSid: 'MOCK_SERVICE_SID',
        };
      }

      const verification = await this.client.verify.v2
        .services(this.serviceSid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms',
        });

      this.logger.log(`Verification started: ${verification.status} for ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

      return {
        status: verification.status as 'pending' | 'sent',
        to: verification.to,
        channel: verification.channel as 'sms',
        serviceSid: verification.serviceSid,
      };
    } catch (error: any) {
      this.logger.error(`Failed to start verification: ${error.message}`, error.stack);
      
      if (error.code === 20003) {
        throw new BadRequestException('Authentication failed - invalid Twilio credentials');
      } else if (error.code === 21211) {
        throw new BadRequestException('Invalid phone number');
      } else if (error.code === 21608) {
        throw new BadRequestException('Phone number cannot receive SMS');
      } else if (error.code === 21610) {
        throw new BadRequestException('Phone number blocked by carrier');
      }
      
      throw new InternalServerErrorException('Failed to send verification code');
    }
  }

  /**
   * Verify phone number with the provided code
   */
  async checkVerification(phoneNumber: string, code: string): Promise<VerificationCheckResponse> {
    this.logger.log(`Checking verification for phone: ${phoneNumber.replace(/\d(?=\d{4})/g, '*')} with code: ${code.replace(/./g, '*')}`);

    // Validate inputs
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new BadRequestException('Invalid phone number format');
    }

    if (!this.isValidVerificationCode(code)) {
      throw new BadRequestException('Invalid verification code format');
    }

    try {
      if (!this.client) {
        // Mock mode for development - accept specific test codes
        const isTestCode = ['123456', '000000', '111111'].includes(code);
        this.logger.log(`Mock verification: ${isTestCode ? 'approved' : 'failed'}`);
        
        return {
          status: isTestCode ? 'approved' : 'failed',
          to: phoneNumber,
          channel: 'sms',
          valid: isTestCode,
        };
      }

      const verificationCheck = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code,
        });

      this.logger.log(`Verification check result: ${verificationCheck.status} for ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

      return {
        status: verificationCheck.status as 'approved' | 'pending' | 'expired' | 'failed',
        to: verificationCheck.to,
        channel: verificationCheck.channel as 'sms',
        valid: verificationCheck.valid,
      };
    } catch (error: any) {
      this.logger.error(`Failed to check verification: ${error.message}`, error.stack);
      
      if (error.code === 20404) {
        throw new BadRequestException('Verification not found or expired');
      } else if (error.code === 20003) {
        throw new BadRequestException('Authentication failed - invalid Twilio credentials');
      }
      
      throw new InternalServerErrorException('Failed to verify code');
    }
  }

  /**
   * Validate phone number format (E.164 format)
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[country code][number]
    // Example: +1234567890
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Validate verification code format
   */
  private isValidVerificationCode(code: string): boolean {
    // Twilio verification codes are typically 6 digits
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(code);
  }

  /**
   * Get service status for health checks
   */
  async getServiceStatus(): Promise<{ service: string; status: string; mode: string }> {
    try {
      if (!this.client) {
        return {
          service: 'twilio',
          status: 'healthy',
          mode: 'mock',
        };
      }

      // Test connection by fetching service details
      const service = await this.client.verify.v2.services(this.serviceSid).fetch();
      
      return {
        service: 'twilio',
        status: service.friendlyName ? 'healthy' : 'unhealthy',
        mode: 'production',
      };
    } catch (error: any) {
      this.logger.error(`Service health check failed: ${error.message}`);
      return {
        service: 'twilio',
        status: 'unhealthy',
        mode: this.client ? 'production' : 'mock',
      };
    }
  }
}