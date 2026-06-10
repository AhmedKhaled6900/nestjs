import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyResetOtpDto,
} from '../dto/auth.dto';
import {
  AuthResponseDto,
  MeResponseDto,
  MessageResponseDto,
  RegisterPendingResponseDto,
} from '../dto/auth-response.dto';
import { SendPhoneOtpDto, VerifyPhoneOtpDto } from '../dto/phone-auth.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/permissions.decorator';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { AuthUser } from '../interfaces/auth.interface';
import { AuthService } from '../services/auth.service';
import { GoogleProfile } from '../strategies/google.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register with email, phone & password',
    description: 'Does not return tokens. Sends verification email. Use POST /auth/verify-email to activate.',
  })
  @ApiResponse({ status: 201, type: RegisterPendingResponseDto })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email & password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Email not verified — verification email resent' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with OTP code', description: 'Returns JWT tokens after successful verification' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification code' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('phone/send-otp')
  @ApiOperation({ summary: 'Send OTP to phone number', description: 'Rate limited. OTP expires in 5 minutes.' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  sendPhoneOtp(@Body() dto: SendPhoneOtpDto) {
    return this.authService.sendPhoneOtp(dto.phone);
  }

  @Public()
  @Post('phone/verify')
  @ApiOperation({ summary: 'Verify phone OTP', description: 'Auto-registers or logs in user. No password required.' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  verifyPhoneOtp(@Body() dto: VerifyPhoneOtpDto) {
    return this.authService.verifyPhoneOtp(dto);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login', description: 'Redirects browser to Google consent screen.' })
  @ApiResponse({ status: 302, description: 'Redirect to Google' })
  googleAuth() {
    // Passport redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback', description: 'Auto-creates user if not exists, redirects with JWT tokens.' })
  @ApiResponse({ status: 302, description: 'Redirect to APP_URL/auth/callback?accessToken=...&refreshToken=...' })
  async googleCallback(
    @Req() req: Request & { user: GoogleProfile },
    @Res() res: Response,
  ) {
    const result = await this.authService.handleGoogleLogin(req.user);
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');

    const redirectUrl = new URL('/auth/callback', appUrl);
    redirectUrl.searchParams.set('accessToken', result.accessToken);
    redirectUrl.searchParams.set('refreshToken', result.refreshToken);

    return res.redirect(redirectUrl.toString());
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset OTP', description: 'Send OTP via email or phone. Rate limited.' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('verify-reset-otp')
  @ApiOperation({ summary: 'Verify password reset OTP' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password', description: 'Invalidates all refresh tokens after reset.' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid OTP or user not found' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or revoked refresh token' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current user profile and permissions',
    description:
      'Use on app load to restore session. Store `permissions` in localStorage.',
  })
  @ApiResponse({ status: 200, type: MeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.authService.getMe(user.id);
  }
}
