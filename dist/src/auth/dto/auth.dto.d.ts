import { RoleName } from '@prisma/client';
export declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    role?: RoleName;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class ForgotPasswordDto {
    email?: string;
    phone?: string;
}
export declare class VerifyResetOtpDto {
    email?: string;
    phone?: string;
    code: string;
}
export declare class ResetPasswordDto {
    email?: string;
    phone?: string;
    code: string;
    newPassword: string;
}
