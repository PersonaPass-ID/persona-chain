import { PasswordAuthService, CreatePasswordAccountRequest, LoginRequest } from './password-auth.service';
declare class CreateAccountDto implements CreatePasswordAccountRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
}
declare class LoginDto implements LoginRequest {
    email: string;
    password: string;
}
declare class CheckEmailDto {
    email: string;
}
declare class CheckUsernameDto {
    username: string;
}
export declare class AuthController {
    private readonly passwordAuthService;
    private readonly logger;
    constructor(passwordAuthService: PasswordAuthService);
    createAccount(dto: CreateAccountDto): Promise<{
        success: true;
        message: string;
        token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            username: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        token?: undefined;
        user?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        token?: undefined;
        user?: undefined;
    }>;
    login(dto: LoginDto): Promise<{
        success: true;
        message: string;
        token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            username: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        token?: undefined;
        user?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        token?: undefined;
        user?: undefined;
    }>;
    verifyToken(authorization: string): Promise<{
        valid: boolean;
        user?: any;
        message?: string;
    }>;
    checkEmail(dto: CheckEmailDto): Promise<{
        exists: boolean;
        user: {
            firstName: string;
            lastName: string;
            username: string;
        };
        error?: undefined;
    } | {
        exists: boolean;
        error: string;
        user?: undefined;
    }>;
    checkUsername(dto: CheckUsernameDto): Promise<{
        exists: boolean;
        available: boolean;
        error?: undefined;
    } | {
        exists: boolean;
        available: boolean;
        error: string;
    }>;
    getAllUsers(): Promise<{
        success: boolean;
        users: any[];
        count: number;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        users: any[];
        count: number;
    }>;
    getServiceHealth(): Promise<{
        status: string;
        service: string;
        timestamp: string;
        features: string[];
        error?: undefined;
    } | {
        status: string;
        service: string;
        timestamp: string;
        error: string;
        features?: undefined;
    }>;
    private maskEmail;
}
export {};
