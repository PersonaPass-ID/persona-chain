import { ConfigService } from '@nestjs/config';
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
export declare class PasswordAuthService {
    private configService;
    private readonly logger;
    private readonly jwtSecret;
    private readonly saltRounds;
    constructor(configService: ConfigService);
    createAccount(request: CreatePasswordAccountRequest): Promise<AuthResponse>;
    login(request: LoginRequest): Promise<AuthResponse>;
    verifyToken(token: string): Promise<{
        valid: boolean;
        user?: any;
        message?: string;
    }>;
    checkEmailExists(email: string): Promise<{
        exists: boolean;
        user?: {
            firstName: string;
            lastName: string;
            username: string;
        };
    }>;
    checkUsernameExists(username: string): Promise<{
        exists: boolean;
    }>;
    markUserAsVerified(email: string): Promise<boolean>;
    getAllUsers(): Promise<any[]>;
    private generateUserId;
    private generateToken;
    private validateEmail;
    private validatePassword;
    private validateUsername;
    private maskEmail;
}
