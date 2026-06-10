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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const auth_dto_1 = require("../dto/auth.dto");
const auth_response_dto_1 = require("../dto/auth-response.dto");
const phone_auth_dto_1 = require("../dto/phone-auth.dto");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const google_auth_guard_1 = require("../guards/google-auth.guard");
const auth_service_1 = require("../services/auth.service");
let AuthController = class AuthController {
    constructor(authService, configService) {
        this.authService = authService;
        this.configService = configService;
    }
    register(dto) {
        return this.authService.register(dto);
    }
    login(dto) {
        return this.authService.login(dto);
    }
    verifyEmail(dto) {
        return this.authService.verifyEmail(dto);
    }
    resendVerification(dto) {
        return this.authService.resendVerification(dto);
    }
    sendPhoneOtp(dto) {
        return this.authService.sendPhoneOtp(dto.phone);
    }
    verifyPhoneOtp(dto) {
        return this.authService.verifyPhoneOtp(dto);
    }
    googleAuth() {
    }
    async googleCallback(req, res) {
        const result = await this.authService.handleGoogleLogin(req.user);
        const appUrl = this.configService.get('APP_URL', 'http://localhost:3000');
        const redirectUrl = new URL('/auth/callback', appUrl);
        redirectUrl.searchParams.set('accessToken', result.accessToken);
        redirectUrl.searchParams.set('refreshToken', result.refreshToken);
        return res.redirect(redirectUrl.toString());
    }
    forgotPassword(dto) {
        return this.authService.forgotPassword(dto);
    }
    verifyResetOtp(dto) {
        return this.authService.verifyResetOtp(dto);
    }
    resetPassword(dto) {
        return this.authService.resetPassword(dto);
    }
    refreshToken(dto) {
        return this.authService.refreshToken(dto.refreshToken);
    }
    getMe(user) {
        return this.authService.getMe(user.id);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({
        summary: 'Register with email, phone & password',
        description: 'Does not return tokens. Sends verification email. Use POST /auth/verify-email to activate.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, type: auth_response_dto_1.RegisterPendingResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already registered' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email & password' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_response_dto_1.AuthResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Email not verified — verification email resent' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, common_1.Post)('verify-email'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify email with OTP code', description: 'Returns JWT tokens after successful verification' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_response_dto_1.AuthResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyEmailDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, common_1.Post)('resend-verification'),
    (0, swagger_1.ApiOperation)({ summary: 'Resend email verification code' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_response_dto_1.MessageResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResendVerificationDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, common_1.Post)('phone/send-otp'),
    (0, swagger_1.ApiOperation)({ summary: 'Send OTP to phone number', description: 'Rate limited. OTP expires in 5 minutes.' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_response_dto_1.MessageResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [phone_auth_dto_1.SendPhoneOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendPhoneOtp", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.Post)('phone/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify phone OTP', description: 'Auto-registers or logs in user. No password required.' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_response_dto_1.AuthResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [phone_auth_dto_1.VerifyPhoneOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyPhoneOtp", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate Google OAuth login', description: 'Redirects browser to Google consent screen.' }),
    (0, swagger_1.ApiResponse)({ status: 302, description: 'Redirect to Google' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Google OAuth callback', description: 'Auto-creates user if not exists, redirects with JWT tokens.' }),
    (0, swagger_1.ApiResponse)({ status: 302, description: 'Redirect to APP_URL/auth/callback?accessToken=...&refreshToken=...' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, common_1.Post)('forgot-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset OTP', description: 'Send OTP via email or phone. Rate limited.' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_response_dto_1.MessageResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.Post)('verify-reset-otp'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify password reset OTP' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_response_dto_1.MessageResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyResetOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyResetOtp", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.Post)('reset-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password', description: 'Invalidates all refresh tokens after reset.' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_response_dto_1.MessageResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid OTP or user not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, permissions_decorator_1.Public)(),
    (0, common_1.Post)('refresh-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_response_dto_1.AuthResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or revoked refresh token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get current user profile and permissions',
        description: 'Use on app load to restore session. Store `permissions` in localStorage.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: auth_response_dto_1.MeResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map