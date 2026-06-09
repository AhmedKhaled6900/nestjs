import { PrismaService } from '../../prisma/prisma.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResendVerificationDto, ResetPasswordDto, VerifyEmailDto, VerifyResetOtpDto } from '../dto/auth.dto';
import { VerifyPhoneOtpDto } from '../dto/phone-auth.dto';
import { EmailService } from '../email/email.service';
import { AuthResponse, RegisterPendingResponse } from '../interfaces/auth.interface';
import { OtpService } from '../otp/otp.service';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';
export declare class AuthService {
    private readonly prisma;
    private readonly passwordService;
    private readonly tokenService;
    private readonly otpService;
    private readonly emailService;
    constructor(prisma: PrismaService, passwordService: PasswordService, tokenService: TokenService, otpService: OtpService, emailService: EmailService);
    register(dto: RegisterDto): Promise<RegisterPendingResponse>;
    login(dto: LoginDto): Promise<AuthResponse>;
    verifyEmail(dto: VerifyEmailDto): Promise<AuthResponse>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        message: string;
    }>;
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
    private sendVerificationEmail;
    private buildAuthResponse;
    private mapUserResponse;
    private resolveTarget;
    private findUserByTarget;
    private findUserByTargetOrFail;
    private decodeAccessToken;
}
