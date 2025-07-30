import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNS } from 'aws-sdk';

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
export class AwsSnsService {
  private readonly logger = new Logger(AwsSnsService.name);
  private readonly sns: SNS | null;
  private readonly region: string;

  // Store verification codes temporarily (in production, use Redis or DynamoDB)
  private verificationCodes = new Map<string, { code: string; expiresAt: Date }>();

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.region = this.configService.get<string>('AWS_SNS_REGION') || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn('AWS credentials not configured. Phone verification will use mock mode.');
      this.sns = null;
    } else {
      this.sns = new SNS({
        accessKeyId,
        secretAccessKey,
        region: this.region,
      });
      this.logger.log('AWS SNS service initialized successfully');
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
      // Generate 6-digit code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code with 5-minute expiration
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      this.verificationCodes.set(phoneNumber, { code: verificationCode, expiresAt });

      if (!this.sns) {
        // Mock mode for development
        this.logger.log(`Mock SMS verification code: ${verificationCode}`);
        return {
          status: 'sent',
          to: phoneNumber,
          channel: 'sms',
          serviceSid: 'MOCK_AWS_SNS',
        };
      }

      // Send SMS using AWS SNS
      const message = `Your PersonaPass verification code is: ${verificationCode}\n\nThis code expires in 5 minutes.\n\n- PersonaPass Identity`;
      
      const params: SNS.PublishInput = {
        PhoneNumber: phoneNumber,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional' // Better delivery rates for verification codes
          },
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: 'PersonaPass' // Shows as sender (not supported in all countries)
          }
        }
      };

      const result = await this.sns.publish(params).promise();
      
      this.logger.log(`SMS sent successfully. MessageId: ${result.MessageId} for ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

      return {
        status: 'sent',
        to: phoneNumber,
        channel: 'sms',
        serviceSid: result.MessageId || 'AWS_SNS',
      };
    } catch (error: any) {
      this.logger.error(`Failed to start verification: ${error.message}`, error.stack);
      
      // Handle specific AWS SNS errors
      if (error.code === 'InvalidParameter') {
        throw new BadRequestException('Invalid phone number format or unsupported region');
      } else if (error.code === 'AuthorizationError') {
        throw new BadRequestException('AWS SNS authorization failed - check credentials');
      } else if (error.code === 'Throttling') {
        throw new BadRequestException('Rate limit exceeded - please try again later');
      } else if (error.code === 'OptedOut') {
        throw new BadRequestException('Phone number has opted out of SMS messages');
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
      const storedData = this.verificationCodes.get(phoneNumber);

      if (!this.sns) {
        // Mock mode for development - accept specific test codes
        const isTestCode = ['123456', '000000', '111111'].includes(code);
        this.logger.log(`Mock verification: ${isTestCode ? 'approved' : 'failed'}`);
        
        if (isTestCode) {
          this.verificationCodes.delete(phoneNumber); // Clean up
        }
        
        return {
          status: isTestCode ? 'approved' : 'failed',
          to: phoneNumber,
          channel: 'sms',
          valid: isTestCode,
        };
      }

      if (!storedData) {
        return {
          status: 'expired',
          to: phoneNumber,
          channel: 'sms',
          valid: false,
        };
      }

      const now = new Date();
      if (now > storedData.expiresAt) {
        this.verificationCodes.delete(phoneNumber); // Clean up expired code
        return {
          status: 'expired',
          to: phoneNumber,
          channel: 'sms',
          valid: false,
        };
      }

      const isValid = storedData.code === code;
      
      if (isValid) {
        this.verificationCodes.delete(phoneNumber); // Clean up successful verification
        this.logger.log(`Verification successful for ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);
      } else {
        this.logger.log(`Verification failed for ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);
      }

      return {
        status: isValid ? 'approved' : 'failed',
        to: phoneNumber,
        channel: 'sms',
        valid: isValid,
      };
    } catch (error: any) {
      this.logger.error(`Failed to check verification: ${error.message}`, error.stack);
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
    // 6-digit codes
    const codeRegex = /^\d{6}$/;
    return codeRegex.test(code);
  }

  /**
   * Get service status for health checks
   */
  async getServiceStatus(): Promise<{ service: string; status: string; mode: string; region?: string }> {
    try {
      if (!this.sns) {
        return {
          service: 'aws-sns',
          status: 'healthy',
          mode: 'mock',
        };
      }

      // Test AWS SNS connection by checking quota
      await this.sns.getSMSAttributes({
        attributes: ['MonthlySpendLimit']
      }).promise();
      
      return {
        service: 'aws-sns',
        status: 'healthy',
        mode: 'production',
        region: this.region,
      };
    } catch (error: any) {
      this.logger.error(`AWS SNS health check failed: ${error.message}`);
      return {
        service: 'aws-sns',
        status: 'unhealthy',
        mode: this.sns ? 'production' : 'mock',
        region: this.region,
      };
    }
  }

  /**
   * Get SMS spending and quota information
   */
  async getSMSQuota(): Promise<{
    monthlySpendLimit: string;
    maxPrice: string;
    deliveryStatusLogging: string;
  } | null> {
    if (!this.sns) {
      return null;
    }

    try {
      const result = await this.sns.getSMSAttributes({
        attributes: ['MonthlySpendLimit', 'MaxPrice', 'DeliveryStatusLogging']
      }).promise();

      return {
        monthlySpendLimit: result.attributes?.['MonthlySpendLimit'] || 'Not set',
        maxPrice: result.attributes?.['MaxPrice'] || 'Not set',
        deliveryStatusLogging: result.attributes?.['DeliveryStatusLogging'] || 'Not set',
      };
    } catch (error: any) {
      this.logger.error(`Failed to get SMS quota: ${error.message}`);
      return null;
    }
  }

  /**
   * Clean up expired verification codes (call periodically)
   */
  cleanupExpiredCodes(): void {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [phone, data] of this.verificationCodes.entries()) {
      if (now > data.expiresAt) {
        this.verificationCodes.delete(phone);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired verification codes`);
    }
  }

  /**
   * Set SMS spending limit (optional security feature)
   */
  async setSpendingLimit(limitUSD: number): Promise<boolean> {
    if (!this.sns) {
      return false;
    }

    try {
      await this.sns.setSMSAttributes({
        attributes: {
          'MonthlySpendLimit': limitUSD.toString()
        }
      }).promise();

      this.logger.log(`SMS spending limit set to $${limitUSD}/month`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to set spending limit: ${error.message}`);
      return false;
    }
  }
}