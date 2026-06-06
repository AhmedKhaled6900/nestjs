import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, TokenPair } from '../interfaces/auth.interface';
export declare class TokenService {
    private readonly jwtService;
    private readonly configService;
    private readonly prisma;
    constructor(jwtService: JwtService, configService: ConfigService, prisma: PrismaService);
    generateTokens(payload: JwtPayload): Promise<TokenPair>;
    refreshAccessToken(refreshToken: string): Promise<TokenPair>;
    invalidateRefreshToken(userId: string): Promise<void>;
}
