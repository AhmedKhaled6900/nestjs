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
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let OtpService = OtpService_1 = class OtpService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(OtpService_1.name);
    }
    async sendOtp(target, purpose) {
        await this.issueOtp(target, purpose);
        return { message: 'OTP sent successfully' };
    }
    async sendOtpAndGetCode(target, purpose) {
        const code = await this.issueOtp(target, purpose);
        return { message: 'OTP sent successfully', code };
    }
    async verifyOtp(target, code, purpose) {
        const normalizedTarget = this.normalizeTarget(target, purpose);
        const otp = await this.prisma.otp.findFirst({
            where: {
                target: normalizedTarget,
                purpose,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!otp || otp.code !== code) {
            throw new common_1.BadRequestException('Invalid or expired OTP');
        }
        await this.prisma.otp.update({
            where: { id: otp.id },
            data: { usedAt: new Date() },
        });
    }
    async issueOtp(target, purpose) {
        const normalizedTarget = this.normalizeTarget(target, purpose);
        await this.invalidateActiveOtps(normalizedTarget, purpose);
        const code = this.generateCode();
        const expiryMinutes = this.configService.get('OTP_EXPIRY_MINUTES', 5);
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
        await this.prisma.otp.create({
            data: {
                target: normalizedTarget,
                code,
                purpose,
                expiresAt,
            },
        });
        this.logger.log(`OTP for ${normalizedTarget} (${purpose}): ${code}`);
        return code;
    }
    async invalidateActiveOtps(target, purpose) {
        await this.prisma.otp.updateMany({
            where: {
                target,
                purpose,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            data: { usedAt: new Date() },
        });
    }
    normalizeTarget(target, purpose) {
        if (purpose === client_1.OtpPurpose.PHONE_AUTH ||
            (purpose !== client_1.OtpPurpose.EMAIL_VERIFICATION && target.includes('+'))) {
            return target.replace(/\s/g, '');
        }
        return target.toLowerCase().trim();
    }
    generateCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], OtpService);
//# sourceMappingURL=otp.service.js.map