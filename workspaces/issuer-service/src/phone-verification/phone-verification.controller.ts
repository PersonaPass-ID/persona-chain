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
import { IsString, IsNotEmpty, Matches } from 'class-validator';
import {
  PhoneVerificationService,
  StartVerificationRequest,
  VerifyCodeRequest,
} from './phone-verification.service';
import { PhoneVerificationCredential } from './vc-issuer.service';

// DTOs for request validation
class StartPhoneVerificationDto implements StartVerificationRequest {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +1234567890)',
  })
  phoneNumber: string;
}

class VerifyPhoneCodeDto implements VerifyCodeRequest {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +1234567890)',
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message: 'Verification code must be exactly 6 digits',
  })
  verificationCode: string;
}

class VerifyCredentialDto {
  @IsNotEmpty()
  credential: PhoneVerificationCredential;
}

@Controller('issue-vc/phone')
export class PhoneVerificationController {
  private readonly logger = new Logger(PhoneVerificationController.name);

  constructor(private readonly phoneVerificationService: PhoneVerificationService) {}

  @Post('start')
  async startPhoneVerification(@Body() dto: StartPhoneVerificationDto) {
    this.logger.log(`POST /issue-vc/phone/start - ${dto.phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    try {
      const result = await this.phoneVerificationService.startPhoneVerification(dto);

      this.logger.log(`Verification started successfully for ${dto.phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

      return {
        success: result.success,
        message: result.message,
        verificationId: result.verificationId,
        expiresIn: result.expiresIn,
      };
    } catch (error) {
      this.logger.error(`Start verification failed: ${error.message}`, error.stack);

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
  async verifyPhoneCode(@Body() dto: VerifyPhoneCodeDto) {
    this.logger.log(`POST /issue-vc/phone/verify - ${dto.phoneNumber.replace(/\d(?=\d{4})/g, '*')} with code ${dto.verificationCode.replace(/./g, '*')}`);

    try {
      const result = await this.phoneVerificationService.verifyCodeAndIssueCredential(dto);

      if (result.success) {
        this.logger.log(`Phone verification and VC issuance successful for ${dto.phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);
        
        return {
          success: result.success,
          message: result.message,
          credential: result.credential,
          zkProof: result.zkProof,
        };
      } else {
        this.logger.warn(`Phone verification failed for ${dto.phoneNumber.replace(/\d(?=\d{4})/g, '*')}: ${result.message}`);
        
        return {
          success: result.success,
          message: result.message,
        };
      }
    } catch (error) {
      this.logger.error(`Verify phone code failed: ${error.message}`, error.stack);

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
  async verifyCredential(@Body() dto: VerifyCredentialDto) {
    this.logger.log(`POST /issue-vc/phone/verify-credential - ${dto.credential.id}`);

    try {
      const result = await this.phoneVerificationService.verifyPhoneCredential(dto.credential);

      this.logger.log(`Credential verification completed: ${result.valid} for ${dto.credential.id}`);

      return result;
    } catch (error) {
      this.logger.error(`Credential verification failed: ${error.message}`, error.stack);

      return {
        valid: false,
        message: 'Credential verification process failed',
      };
    }
  }

  @Post('create-zk-proof')
  async createZkProof(
    @Body()
    dto: {
      credential: PhoneVerificationCredential;
      requiredAttributes: string[];
    }
  ) {
    this.logger.log(`POST /issue-vc/phone/create-zk-proof - ${dto.credential.id}`);

    try {
      const result = await this.phoneVerificationService.createZkProofFromCredential(
        dto.credential,
        { requiredAttributes: dto.requiredAttributes }
      );

      this.logger.log(`ZK proof created successfully for credential: ${dto.credential.id}`);

      return result;
    } catch (error) {
      this.logger.error(`ZK proof creation failed: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create zero-knowledge proof');
    }
  }

  @Get('health')
  async getServiceHealth() {
    this.logger.log('GET /issue-vc/phone/health');

    try {
      const healthStatus = await this.phoneVerificationService.getServiceHealth();
      
      this.logger.log(`Health check completed: ${healthStatus.status}`);
      
      return healthStatus;
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);

      return {
        status: 'unhealthy',
        services: [],
        timestamp: new Date().toISOString(),
        error: 'Health check process failed',
      };
    }
  }
}