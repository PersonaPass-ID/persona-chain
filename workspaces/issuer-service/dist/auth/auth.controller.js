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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const password_auth_service_1 = require("./password-auth.service");
class CreateAccountDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateAccountDto.prototype, "username", void 0);
class LoginDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class CheckEmailDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CheckEmailDto.prototype, "email", void 0);
class CheckUsernameDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CheckUsernameDto.prototype, "username", void 0);
let AuthController = AuthController_1 = class AuthController {
    constructor(passwordAuthService) {
        this.passwordAuthService = passwordAuthService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async createAccount(dto) {
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
            }
            else {
                this.logger.warn(`Account creation failed for ${this.maskEmail(dto.email)}: ${result.message}`);
                return {
                    success: result.success,
                    message: result.message,
                };
            }
        }
        catch (error) {
            this.logger.error(`Create account failed: ${error.message}`, error.stack);
            if (error instanceof common_1.BadRequestException) {
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
    async login(dto) {
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
            }
            else {
                this.logger.warn(`Login failed for ${this.maskEmail(dto.email)}: ${result.message}`);
                return {
                    success: result.success,
                    message: result.message,
                };
            }
        }
        catch (error) {
            this.logger.error(`Login failed: ${error.message}`, error.stack);
            return {
                success: false,
                message: 'Login failed. Please try again.',
                error: 'Internal Server Error',
            };
        }
    }
    async verifyToken(authorization) {
        this.logger.log('POST /auth/verify-token');
        try {
            if (!authorization || !authorization.startsWith('Bearer ')) {
                return {
                    valid: false,
                    message: 'Authorization header required',
                };
            }
            const token = authorization.substring(7);
            const result = await this.passwordAuthService.verifyToken(token);
            this.logger.log(`Token verification result: ${result.valid}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Token verification failed: ${error.message}`, error.stack);
            return {
                valid: false,
                message: 'Token verification failed',
            };
        }
    }
    async checkEmail(dto) {
        this.logger.log(`POST /auth/check-email - ${this.maskEmail(dto.email)}`);
        try {
            const result = await this.passwordAuthService.checkEmailExists(dto.email);
            return {
                exists: result.exists,
                user: result.user,
            };
        }
        catch (error) {
            this.logger.error(`Check email failed: ${error.message}`, error.stack);
            return {
                exists: false,
                error: 'Failed to check email',
            };
        }
    }
    async checkUsername(dto) {
        this.logger.log(`POST /auth/check-username - ${dto.username}`);
        try {
            const result = await this.passwordAuthService.checkUsernameExists(dto.username);
            return {
                exists: result.exists,
                available: !result.exists,
            };
        }
        catch (error) {
            this.logger.error(`Check username failed: ${error.message}`, error.stack);
            return {
                exists: false,
                available: true,
                error: 'Failed to check username',
            };
        }
    }
    async getAllUsers() {
        this.logger.log('GET /auth/users');
        try {
            const users = await this.passwordAuthService.getAllUsers();
            return {
                success: true,
                users,
                count: users.length,
            };
        }
        catch (error) {
            this.logger.error(`Get users failed: ${error.message}`, error.stack);
            return {
                success: false,
                message: 'Failed to retrieve users',
                users: [],
                count: 0,
            };
        }
    }
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
        }
        catch (error) {
            this.logger.error(`Auth service health check failed: ${error.message}`, error.stack);
            return {
                status: 'unhealthy',
                service: 'password-auth',
                timestamp: new Date().toISOString(),
                error: 'Health check failed',
            };
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
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('create-account'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateAccountDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('verify-token'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyToken", null);
__decorate([
    (0, common_1.Post)('check-email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CheckEmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkEmail", null);
__decorate([
    (0, common_1.Post)('check-username'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CheckUsernameDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkUsername", null);
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getServiceHealth", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [password_auth_service_1.PasswordAuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map