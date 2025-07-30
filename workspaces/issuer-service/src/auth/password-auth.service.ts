import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export interface CreatePasswordAccountRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
  };
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  resetCode: string;
  newPassword: string;
}

// Simple in-memory storage for demo - in production use a database
const users: Map<string, {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: Date;
  verified: boolean;
}> = new Map();

const resetCodes: Map<string, {
  code: string;
  expiresAt: Date;
}> = new Map();

@Injectable()
export class PasswordAuthService {
  private readonly logger = new Logger(PasswordAuthService.name);
  private readonly jwtSecret: string;
  private readonly saltRounds = 12;

  constructor(private configService: ConfigService) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'persona-pass-secret-key-2024';
  }

  /**
   * Create a new password-based account
   */
  async createAccount(request: CreatePasswordAccountRequest): Promise<AuthResponse> {
    this.logger.log(`Creating password account for ${this.maskEmail(request.email)}`);

    try {
      // Validate inputs
      this.validateEmail(request.email);
      this.validatePassword(request.password);
      this.validateUsername(request.username);

      // Check if user already exists
      if (users.has(request.email.toLowerCase())) {
        return {
          success: false,
          message: 'An account with this email already exists'
        };
      }

      // Check if username is taken
      const existingUsername = Array.from(users.values()).find(
        user => user.username.toLowerCase() === request.username.toLowerCase()
      );
      if (existingUsername) {
        return {
          success: false,
          message: 'This username is already taken'
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(request.password, this.saltRounds);
      
      // Create user
      const userId = this.generateUserId();
      const user = {
        id: userId,
        email: request.email.toLowerCase(),
        passwordHash,
        firstName: request.firstName,
        lastName: request.lastName,
        username: request.username,
        createdAt: new Date(),
        verified: false // Will be verified through email verification flow
      };

      users.set(request.email.toLowerCase(), user);

      // Generate JWT token
      const token = this.generateToken(user);

      this.logger.log(`Password account created successfully for ${this.maskEmail(request.email)}`);

      return {
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username
        }
      };
    } catch (error) {
      this.logger.error(`Failed to create password account: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        return {
          success: false,
          message: error.message
        };
      }
      
      return {
        success: false,
        message: 'Failed to create account. Please try again.'
      };
    }
  }

  /**
   * Login with email and password
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    this.logger.log(`Login attempt for ${this.maskEmail(request.email)}`);

    try {
      // Validate inputs
      this.validateEmail(request.email);
      
      if (!request.password || request.password.length < 1) {
        return {
          success: false,
          message: 'Password is required'
        };
      }

      // Find user
      const user = users.get(request.email.toLowerCase());
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(request.password, user.passwordHash);
      if (!passwordValid) {
        this.logger.warn(`Invalid password attempt for ${this.maskEmail(request.email)}`);
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Generate JWT token
      const token = this.generateToken(user);

      this.logger.log(`Login successful for ${this.maskEmail(request.email)}`);

      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username
        }
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<{
    valid: boolean;
    user?: any;
    message?: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Find user to ensure they still exist
      const user = users.get(decoded.email);
      if (!user) {
        return {
          valid: false,
          message: 'User not found'
        };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username
        }
      };
    } catch (error) {
      this.logger.warn(`Token verification failed: ${error.message}`);
      return {
        valid: false,
        message: 'Invalid token'
      };
    }
  }

  /**
   * Check if email exists
   */
  async checkEmailExists(email: string): Promise<{
    exists: boolean;
    user?: {
      firstName: string;
      lastName: string;
      username: string;
    };
  }> {
    const user = users.get(email.toLowerCase());
    
    if (user) {
      return {
        exists: true,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username
        }
      };
    }
    
    return { exists: false };
  }

  /**
   * Mark user as verified after email verification
   */
  async markUserAsVerified(email: string): Promise<boolean> {
    const user = users.get(email.toLowerCase());
    if (user) {
      user.verified = true;
      users.set(email.toLowerCase(), user);
      this.logger.log(`User marked as verified: ${this.maskEmail(email)}`);
      return true;
    }
    return false;
  }

  /**
   * Get all users (for admin/debug purposes)
   */
  async getAllUsers(): Promise<any[]> {
    return Array.from(users.values()).map(user => ({
      id: user.id,
      email: this.maskEmail(user.email),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      verified: user.verified,
      createdAt: user.createdAt
    }));
  }

  /**
   * Generate unique user ID
   */
  private generateUserId(): string {
    const crypto = require('crypto');
    return `user_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: any): string {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: '7d' // Token expires in 7 days
    });
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    if (!email || email.length < 5) {
      throw new BadRequestException('Valid email address is required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email address format');
    }
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    
    // Check for at least one number and one letter
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    
    if (!hasNumber || !hasLetter) {
      throw new BadRequestException('Password must contain at least one letter and one number');
    }
  }

  /**
   * Validate username
   */
  private validateUsername(username: string): void {
    if (!username || username.length < 3) {
      throw new BadRequestException('Username must be at least 3 characters long');
    }
    
    if (username.length > 20) {
      throw new BadRequestException('Username must be less than 20 characters');
    }
    
    // Allow letters, numbers, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      throw new BadRequestException('Username can only contain letters, numbers, underscores, and hyphens');
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