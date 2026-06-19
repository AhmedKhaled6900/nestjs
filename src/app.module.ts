import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { validate } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PropertyModule } from './property/property.module';
import { HealthModule } from './health/health.module';
import { OwnerModule } from './owner/owner.module';
import { CategoryModule } from './category/category.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { EngagementModule } from './engagement/engagement.module';
import { OfferModule } from './offer/offer.module';
import { RentalModule } from './rental/rental.module';
import { AttributeModule } from './attribute/attribute.module';
import { ServiceProviderModule } from './service-provider/service-provider.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.OTP_RATE_LIMIT_TTL ?? '60', 10) * 1000,
        limit: parseInt(process.env.OTP_RATE_LIMIT_MAX ?? '3', 10),
      },
    ]),
    PrismaModule,
    AuthModule,
    PropertyModule,
    OwnerModule,
    CategoryModule,
    NotificationModule,
    AdminModule,
    EngagementModule,
    OfferModule,
    RentalModule,
    AttributeModule,
    ServiceProviderModule,
    HealthModule,
  ],
})
export class AppModule {}
