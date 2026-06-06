import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ForgotPasswordDto, LoginDto, RefreshTokenDto, RegisterDto, ResetPasswordDto, VerifyResetOtpDto } from '../dto/auth.dto';
import { SendPhoneOtpDto, VerifyPhoneOtpDto } from '../dto/phone-auth.dto';
import { AuthService } from '../services/auth.service';
import { GoogleProfile } from '../strategies/google.strategy';
export declare class AuthController {
    private readonly authService;
    private readonly configService;
    constructor(authService: AuthService, configService: ConfigService);
    register(dto: RegisterDto): Promise<import("../interfaces/auth.interface").AuthResponse>;
    login(dto: LoginDto): Promise<import("../interfaces/auth.interface").AuthResponse>;
    sendPhoneOtp(dto: SendPhoneOtpDto): Promise<{
        message: string;
    }>;
    verifyPhoneOtp(dto: VerifyPhoneOtpDto): Promise<import("../interfaces/auth.interface").AuthResponse>;
    googleAuth(): void;
    googleCallback(req: Request & {
        user: GoogleProfile;
    }, res: Response): Promise<void>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyResetOtp(dto: VerifyResetOtpDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<import("../interfaces/auth.interface").AuthResponse>;
}
