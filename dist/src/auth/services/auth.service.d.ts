import { PrismaService } from '../../prisma/prisma.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, VerifyResetOtpDto } from '../dto/auth.dto';
import { VerifyPhoneOtpDto } from '../dto/phone-auth.dto';
import { AuthResponse } from '../interfaces/auth.interface';
import { OtpService } from '../otp/otp.service';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';
export declare class AuthService {
    private readonly prisma;
    private readonly passwordService;
    private readonly tokenService;
    private readonly otpService;
    constructor(prisma: PrismaService, passwordService: PasswordService, tokenService: TokenService, otpService: OtpService);
    register(dto: RegisterDto): Promise<AuthResponse>;
    login(dto: LoginDto): Promise<AuthResponse>;
    sendPhoneOtp(phone: string): Promise<{
        message: string;
    }>;
    verifyPhoneOtp(dto: VerifyPhoneOtpDto): Promise<AuthResponse>;
    handleGoogleLogin(profile: {
        providerId: string;
        email: string;
        name: string;
    }): Promise<AuthResponse>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyResetOtp(dto: VerifyResetOtpDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<AuthResponse>;
    private buildAuthResponse;
    private resolveTarget;
    private findUserByTarget;
    private findUserByTargetOrFail;
    private decodeAccessToken;
}
