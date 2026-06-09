import { ConfigService } from '@nestjs/config';
import { OtpPurpose } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
export declare class OtpService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    sendOtp(target: string, purpose: OtpPurpose): Promise<{
        message: string;
    }>;
    sendOtpAndGetCode(target: string, purpose: OtpPurpose): Promise<{
        message: string;
        code: string;
    }>;
    verifyOtp(target: string, code: string, purpose: OtpPurpose): Promise<void>;
    private issueOtp;
    private invalidateActiveOtps;
    private normalizeTarget;
    private generateCode;
}
