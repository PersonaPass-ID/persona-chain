import {
  Controller,
  Post,
  Body,
  HttpStatus,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  Get,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import {
  EmailVerificationService,
  StartEmailVerificationRequest,
  VerifyEmailCodeRequest,
} from './email-verification.service';
import { EmailVerificationCredential } from './email-vc-issuer.service';

// DTOs for request validation
class StartEmailVerificationDto implements StartEmailVerificationRequest {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

class VerifyEmailCodeDto implements VerifyEmailCodeRequest {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  verificationCode: string;
}

class VerifyEmailCredentialDto {
  @IsNotEmpty()
  credential: EmailVerificationCredential;
}

@Controller('issue-vc/email')
export class EmailVerificationController {
  private readonly logger = new Logger(EmailVerificationController.name);

  constructor(private readonly emailVerificationService: EmailVerificationService) {}

  @Post('start')
  async startEmailVerification(@Body() dto: StartEmailVerificationDto) {
    this.logger.log(`POST /issue-vc/email/start - ${this.maskEmail(dto.email)}`);

    try {
      const result = await this.emailVerificationService.startEmailVerification(dto);

      this.logger.log(`Email verification started successfully for ${this.maskEmail(dto.email)}`);

      return {
        success: result.success,
        message: result.message,
        verificationId: result.verificationId,
        expiresIn: result.expiresIn,
      };
    } catch (error) {
      this.logger.error(`Start email verification failed: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        return {
          success: false,
          message: error.message,
          error: 'Bad Request',
        };
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Internal server error occurred',
        error: 'Internal Server Error',
      });
    }
  }

  @Post('verify')
  async verifyEmailCode(@Body() dto: VerifyEmailCodeDto) {
    this.logger.log(`POST /issue-vc/email/verify - ${this.maskEmail(dto.email)} with code ${dto.verificationCode.replace(/./g, '*')}`);

    try {
      const result = await this.emailVerificationService.verifyCodeAndIssueCredential(dto);

      if (result.success) {
        this.logger.log(`Email verification and VC issuance successful for ${this.maskEmail(dto.email)}`);
        
        return {
          success: result.success,
          message: result.message,
          credential: result.credential,
          zkProof: result.zkProof,
        };
      } else {
        this.logger.warn(`Email verification failed for ${this.maskEmail(dto.email)}: ${result.message}`);
        
        return {
          success: result.success,
          message: result.message,
        };
      }
    } catch (error) {
      this.logger.error(`Verify email code failed: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        return {
          success: false,
          message: error.message,
          error: 'Bad Request',
        };
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Internal server error occurred',
        error: 'Internal Server Error',
      });
    }
  }

  @Post('verify-credential')
  async verifyCredential(@Body() dto: VerifyEmailCredentialDto) {
    this.logger.log(`POST /issue-vc/email/verify-credential - ${dto.credential.id}`);

    try {
      const result = await this.emailVerificationService.verifyEmailCredential(dto.credential);

      this.logger.log(`Email credential verification completed: ${result.valid} for ${dto.credential.id}`);

      return result;
    } catch (error) {
      this.logger.error(`Email credential verification failed: ${error.message}`, error.stack);

      return {
        valid: false,
        message: 'Email credential verification process failed',
      };
    }
  }

  @Get('health')
  async getServiceHealth() {
    this.logger.log('GET /issue-vc/email/health');

    try {
      const healthStatus = await this.emailVerificationService.getServiceHealth();
      
      this.logger.log(`Email service health check completed: ${healthStatus.status}`);
      
      return healthStatus;
    } catch (error) {
      this.logger.error(`Email service health check failed: ${error.message}`, error.stack);

      return {
        status: 'unhealthy',
        services: [],
        timestamp: new Date().toISOString(),
        error: 'Email service health check process failed',
      };
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