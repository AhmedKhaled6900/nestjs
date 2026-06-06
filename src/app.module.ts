import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { validate } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PropertyModule } from './property/property.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.OTP_RATE_LIMIT_TTL ?? '60', 10) * 1000,
        limit: parseInt(process.env.OTP_RATE_LIMIT_MAX ?? '3', 10),
      },
    ]),
    PrismaModule,
    AuthModule,
    PropertyModule,
    HealthModule,
  ],
})
export class AppModule {}
