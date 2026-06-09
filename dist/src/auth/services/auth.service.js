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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const otp_service_1 = require("../otp/otp.service");
const password_service_1 = require("../services/password.service");
const token_service_1 = require("../services/token.service");
let AuthService = class AuthService {
    constructor(prisma, passwordService, tokenService, otpService, emailService) {
        this.prisma = prisma;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
        this.otpService = otpService;
        this.emailService = emailService;
    }
    async register(dto) {
        if (dto.role === client_1.RoleName.ADMIN) {
            throw new common_1.BadRequestException('Cannot self-register as admin');
        }
        const email = dto.email.toLowerCase();
        const phone = dto.phone.replace(/\s/g, '');
        const [existingEmail, existingPhone] = await Promise.all([
            this.prisma.user.findUnique({ where: { email } }),
            this.prisma.user.findUnique({ where: { phone } }),
        ]);
        if (existingEmail) {
            throw new common_1.ConflictException('Email already registered');
        }
        if (existingPhone) {
            throw new common_1.ConflictException('Phone already registered');
        }
        const role = await this.prisma.role.findUniqueOrThrow({
            where: { name: dto.role },
        });
        const hashedPassword = await this.passwordService.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email,
                phone,
                password: hashedPassword,
                provider: client_1.AuthProvider.LOCAL,
                roleId: role.id,
                isVerified: false,
                ...(dto.role === client_1.RoleName.OWNER
                    ? {
                        ownerProfile: {
                            create: {
                                profileStatus: client_1.ProfileStatus.INCOMPLETE,
                            },
                        },
                    }
                    : {}),
            },
            include: { role: true, ownerProfile: true },
        });
        await this.sendVerificationEmail(user.email, user.name);
        return {
            message: 'Registration successful. Please verify your email.',
            user: this.mapUserResponse(user),
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
            include: { role: true, ownerProfile: true },
        });
        if (!user?.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await this.passwordService.compare(dto.password, user.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isVerified) {
            await this.sendVerificationEmail(user.email, user.name);
            throw new common_1.ForbiddenException({
                message: 'Email not verified. A new verification code has been sent to your email.',
                isVerified: false,
            });
        }
        return this.buildAuthResponse(user);
    }
    async verifyEmail(dto) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { role: true, ownerProfile: true },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.isVerified) {
            return this.buildAuthResponse(user);
        }
        await this.otpService.verifyOtp(email, dto.code, client_1.OtpPurpose.EMAIL_VERIFICATION);
        const verifiedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
            include: { role: true, ownerProfile: true },
        });
        return this.buildAuthResponse(verifiedUser);
    }
    async resendVerification(dto) {
        const email = dto.email.toLowerCase();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { message: 'If the account exists, a verification email has been sent' };
        }
        if (user.isVerified) {
            throw new common_1.BadRequestException('Email is already verified');
        }
        await this.sendVerificationEmail(email, user.name);
        return { message: 'Verification email sent successfully' };
    }
    async sendPhoneOtp(phone) {
        return this.otpService.sendOtp(phone, client_1.OtpPurpose.PHONE_AUTH);
    }
    async verifyPhoneOtp(dto) {
        await this.otpService.verifyOtp(dto.phone, dto.code, client_1.OtpPurpose.PHONE_AUTH);
        let user = await this.prisma.user.findUnique({
            where: { phone: dto.phone },
            include: { role: true, ownerProfile: true },
        });
        if (!user) {
            const role = await this.prisma.role.findUniqueOrThrow({
                where: { name: client_1.RoleName.CUSTOMER },
            });
            user = await this.prisma.user.create({
                data: {
                    name: dto.name,
                    phone: dto.phone,
                    provider: client_1.AuthProvider.PHONE,
                    roleId: role.id,
                    isVerified: true,
                },
                include: { role: true, ownerProfile: true },
            });
        }
        return this.buildAuthResponse(user);
    }
    async handleGoogleLogin(profile) {
        let user = await this.prisma.user.findFirst({
            where: {
                provider: client_1.AuthProvider.GOOGLE,
                providerId: profile.providerId,
            },
            include: { role: true, ownerProfile: true },
        });
        if (!user && profile.email) {
            user = await this.prisma.user.findUnique({
                where: { email: profile.email.toLowerCase() },
                include: { role: true, ownerProfile: true },
            });
            if (user) {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        provider: client_1.AuthProvider.GOOGLE,
                        providerId: profile.providerId,
                        isVerified: true,
                    },
                    include: { role: true, ownerProfile: true },
                });
            }
        }
        if (!user) {
            const role = await this.prisma.role.findUniqueOrThrow({
                where: { name: client_1.RoleName.CUSTOMER },
            });
            user = await this.prisma.user.create({
                data: {
                    name: profile.name,
                    email: profile.email.toLowerCase(),
                    provider: client_1.AuthProvider.GOOGLE,
                    providerId: profile.providerId,
                    roleId: role.id,
                    isVerified: true,
                },
                include: { role: true, ownerProfile: true },
            });
        }
        return this.buildAuthResponse(user);
    }
    async forgotPassword(dto) {
        const target = this.resolveTarget(dto.email, dto.phone);
        const user = await this.findUserByTarget(dto.email, dto.phone);
        if (!user) {
            return { message: 'If the account exists, an OTP has been sent' };
        }
        return this.otpService.sendOtp(target, client_1.OtpPurpose.PASSWORD_RESET);
    }
    async verifyResetOtp(dto) {
        const target = this.resolveTarget(dto.email, dto.phone);
        await this.findUserByTargetOrFail(dto.email, dto.phone);
        await this.otpService.verifyOtp(target, dto.code, client_1.OtpPurpose.PASSWORD_RESET);
        return { message: 'OTP verified successfully' };
    }
    async resetPassword(dto) {
        const target = this.resolveTarget(dto.email, dto.phone);
        const user = await this.findUserByTargetOrFail(dto.email, dto.phone);
        await this.otpService.verifyOtp(target, dto.code, client_1.OtpPurpose.PASSWORD_RESET);
        const hashedPassword = await this.passwordService.hash(dto.newPassword);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        await this.tokenService.invalidateRefreshToken(user.id);
        return { message: 'Password reset successfully' };
    }
    async refreshToken(refreshToken) {
        const tokens = await this.tokenService.refreshAccessToken(refreshToken);
        const payload = await this.decodeAccessToken(tokens.accessToken);
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: payload.sub },
            include: { role: true, ownerProfile: true },
        });
        if (!user.isVerified) {
            throw new common_1.ForbiddenException({
                message: 'Email not verified',
                isVerified: false,
            });
        }
        return {
            ...tokens,
            user: this.mapUserResponse(user),
        };
    }
    async sendVerificationEmail(email, name) {
        const { code } = await this.otpService.sendOtpAndGetCode(email, client_1.OtpPurpose.EMAIL_VERIFICATION);
        await this.emailService.sendVerificationEmail(email, name, code);
    }
    async buildAuthResponse(user) {
        const tokens = await this.tokenService.generateTokens({
            sub: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role.name,
        });
        return {
            ...tokens,
            user: this.mapUserResponse(user),
        };
    }
    mapUserResponse(user) {
        const isOwner = user.role.name === client_1.RoleName.OWNER;
        const profileStatus = user.ownerProfile?.profileStatus ?? null;
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role.name,
            isVerified: user.isVerified,
            ...(isOwner
                ? {
                    isProfileComplete: profileStatus !== client_1.ProfileStatus.INCOMPLETE,
                    profileStatus,
                    ownerType: user.ownerProfile?.ownerType ?? null,
                }
                : {}),
        };
    }
    resolveTarget(email, phone) {
        if (email)
            return email.toLowerCase().trim();
        if (phone)
            return phone.replace(/\s/g, '');
        throw new common_1.BadRequestException('Email or phone is required');
    }
    async findUserByTarget(email, phone) {
        if (email) {
            return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        }
        if (phone) {
            return this.prisma.user.findUnique({ where: { phone } });
        }
        throw new common_1.BadRequestException('Email or phone is required');
    }
    async findUserByTargetOrFail(email, phone) {
        const user = await this.findUserByTarget(email, phone);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        return user;
    }
    async decodeAccessToken(token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return payload;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        password_service_1.PasswordService,
        token_service_1.TokenService,
        otp_service_1.OtpService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map