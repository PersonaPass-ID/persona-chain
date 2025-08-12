"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PasswordAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const users = new Map();
const resetCodes = new Map();
let PasswordAuthService = PasswordAuthService_1 = class PasswordAuthService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PasswordAuthService_1.name);
        this.saltRounds = 12;
        this.jwtSecret = this.configService.get('JWT_SECRET') || 'persona-pass-secret-key-2024';
    }
    async createAccount(request) {
        this.logger.log(`Creating password account for ${this.maskEmail(request.email)}`);
        try {
            this.validateEmail(request.email);
            this.validatePassword(request.password);
            this.validateUsername(request.username);
            if (users.has(request.email.toLowerCase())) {
                return {
                    success: false,
                    message: 'An account with this email already exists'
                };
            }
            const existingUsername = Array.from(users.values()).find(user => user.username.toLowerCase() === request.username.toLowerCase());
            if (existingUsername) {
                return {
                    success: false,
                    message: 'This username is already taken'
                };
            }
            const passwordHash = await bcrypt.hash(request.password, this.saltRounds);
            const userId = this.generateUserId();
            const user = {
                id: userId,
                email: request.email.toLowerCase(),
                passwordHash,
                firstName: request.firstName,
                lastName: request.lastName,
                username: request.username,
                createdAt: new Date(),
                verified: false
            };
            users.set(request.email.toLowerCase(), user);
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
        }
        catch (error) {
            this.logger.error(`Failed to create password account: ${error.message}`, error.stack);
            if (error instanceof common_1.BadRequestException) {
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
    async login(request) {
        this.logger.log(`Login attempt for ${this.maskEmail(request.email)}`);
        try {
            this.validateEmail(request.email);
            if (!request.password || request.password.length < 1) {
                return {
                    success: false,
                    message: 'Password is required'
                };
            }
            const user = users.get(request.email.toLowerCase());
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }
            const passwordValid = await bcrypt.compare(request.password, user.passwordHash);
            if (!passwordValid) {
                this.logger.warn(`Invalid password attempt for ${this.maskEmail(request.email)}`);
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }
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
        }
        catch (error) {
            this.logger.error(`Login failed: ${error.message}`, error.stack);
            return {
                success: false,
                message: 'Login failed. Please try again.'
            };
        }
    }
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
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
        }
        catch (error) {
            this.logger.warn(`Token verification failed: ${error.message}`);
            return {
                valid: false,
                message: 'Invalid token'
            };
        }
    }
    async checkEmailExists(email) {
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
    async checkUsernameExists(username) {
        const existingUser = Array.from(users.values()).find(user => user.username.toLowerCase() === username.toLowerCase());
        return { exists: !!existingUser };
    }
    async markUserAsVerified(email) {
        const user = users.get(email.toLowerCase());
        if (user) {
            user.verified = true;
            users.set(email.toLowerCase(), user);
            this.logger.log(`User marked as verified: ${this.maskEmail(email)}`);
            return true;
        }
        return false;
    }
    async getAllUsers() {
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
    generateUserId() {
        const crypto = require('crypto');
        return `user_${crypto.randomBytes(16).toString('hex')}`;
    }
    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            username: user.username,
            iat: Math.floor(Date.now() / 1000)
        };
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: '7d'
        });
    }
    validateEmail(email) {
        if (!email || email.length < 5) {
            throw new common_1.BadRequestException('Valid email address is required');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new common_1.BadRequestException('Invalid email address format');
        }
    }
    validatePassword(password) {
        if (!password || password.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters long');
        }
        const hasNumber = /\d/.test(password);
        const hasLetter = /[a-zA-Z]/.test(password);
        if (!hasNumber || !hasLetter) {
            throw new common_1.BadRequestException('Password must contain at least one letter and one number');
        }
    }
    validateUsername(username) {
        if (!username || username.length < 3) {
            throw new common_1.BadRequestException('Username must be at least 3 characters long');
        }
        if (username.length > 20) {
            throw new common_1.BadRequestException('Username must be less than 20 characters');
        }
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            throw new common_1.BadRequestException('Username can only contain letters, numbers, underscores, and hyphens');
        }
    }
    maskEmail(email) {
        if (!email.includes('@'))
            return email;
        const [username, domain] = email.split('@');
        const maskedUsername = username.length > 2
            ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
            : username;
        return `${maskedUsername}@${domain}`;
    }
};
exports.PasswordAuthService = PasswordAuthService;
exports.PasswordAuthService = PasswordAuthService = PasswordAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PasswordAuthService);
//# sourceMappingURL=password-auth.service.js.map