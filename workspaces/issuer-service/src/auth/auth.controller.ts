import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  HttpStatus,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import {
  PasswordAuthService,
  CreatePasswordAccountRequest,
  LoginRequest,
} from './password-auth.service';

// DTOs for request validation
class CreateAccountDto implements CreatePasswordAccountRequest {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;
}

class LoginDto implements LoginRequest {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

class CheckEmailDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly passwordAuthService: PasswordAuthService) {}

  @Post('create-account')
  async createAccount(@Body() dto: CreateAccountDto) {
    this.logger.log(`POST /auth/create-account - ${this.maskEmail(dto.email)}`);

    try {
      const result = await this.passwordAuthService.createAccount(dto);

      if (result.success) {
        this.logger.log(`Account created successfully for ${this.maskEmail(dto.email)}`);
        
        return {
          success: result.success,
          message: result.message,
          token: result.token,
          user: result.user,
        };
      } else {
        this.logger.warn(`Account creation failed for ${this.maskEmail(dto.email)}: ${result.message}`);
        
        return {
          success: result.success,
          message: result.message,
        };
      }
    } catch (error) {
      this.logger.error(`Create account failed: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        return {
          success: false,
          message: error.message,
          error: 'Bad Request',
        };
      }

      return {
        success: false,
        message: 'Account creation failed. Please try again.',
        error: 'Internal Server Error',
      };
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    this.logger.log(`POST /auth/login - ${this.maskEmail(dto.email)}`);

    try {
      const result = await this.passwordAuthService.login(dto);

      if (result.success) {
        this.logger.log(`Login successful for ${this.maskEmail(dto.email)}`);
        
        return {
          success: result.success,
          message: result.message,
          token: result.token,
          user: result.user,
        };
      } else {
        this.logger.warn(`Login failed for ${this.maskEmail(dto.email)}: ${result.message}`);
        
        return {
          success: result.success,
          message: result.message,
        };
      }
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);

      return {
        success: false,
        message: 'Login failed. Please try again.',
        error: 'Internal Server Error',
      };
    }
  }

  @Post('verify-token')
  async verifyToken(@Headers('authorization') authorization: string) {
    this.logger.log('POST /auth/verify-token');

    try {
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return {
          valid: false,
          message: 'Authorization header required',
        };
      }

      const token = authorization.substring(7); // Remove 'Bearer ' prefix
      const result = await this.passwordAuthService.verifyToken(token);

      this.logger.log(`Token verification result: ${result.valid}`);

      return result;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`, error.stack);

      return {
        valid: false,
        message: 'Token verification failed',
      };
    }
  }

  @Post('check-email')
  async checkEmail(@Body() dto: CheckEmailDto) {
    this.logger.log(`POST /auth/check-email - ${this.maskEmail(dto.email)}`);

    try {
      const result = await this.passwordAuthService.checkEmailExists(dto.email);

      return {
        exists: result.exists,
        user: result.user,
      };
    } catch (error) {
      this.logger.error(`Check email failed: ${error.message}`, error.stack);

      return {
        exists: false,
        error: 'Failed to check email',
      };
    }
  }

  @Get('users')
  async getAllUsers() {
    this.logger.log('GET /auth/users');

    try {
      const users = await this.passwordAuthService.getAllUsers();
      
      return {
        success: true,
        users,
        count: users.length,
      };
    } catch (error) {
      this.logger.error(`Get users failed: ${error.message}`, error.stack);

      return {
        success: false,
        message: 'Failed to retrieve users',
        users: [],
        count: 0,
      };
    }
  }

  @Get('health')
  async getServiceHealth() {
    this.logger.log('GET /auth/health');

    try {
      return {
        status: 'healthy',
        service: 'password-auth',
        timestamp: new Date().toISOString(),
        features: [
          'account-creation',
          'login',
          'token-verification',
          'email-checking'
        ],
      };
    } catch (error) {
      this.logger.error(`Auth service health check failed: ${error.message}`, error.stack);

      return {
        status: 'unhealthy',
        service: 'password-auth',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      };
    }
  }

  /**
   * Mask email for logging privacy
   */
  private maskEmail(email: string): string {
    if (!email.includes('@')) return email;
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
      : username;
    return `${maskedUsername}@${domain}`;
  }
}