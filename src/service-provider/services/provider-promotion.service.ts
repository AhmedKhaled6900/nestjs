import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PaymentStatus,
  ProviderPromotionStatus,
  ServiceListingStatus,
} from '@prisma/client';
import { NOTIFICATION_EVENTS } from '../../notification/events/notification.events';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProviderPromotionDto } from '../dto/promotion.dto';
import {
  assertProviderApproved,
  decimalToNumber,
  getProviderProfileOrFail,
} from '../helpers/provider.helpers';
import { PaymobService } from '../payment/paymob.service';

@Injectable()
export class ProviderPromotionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymobService: PaymobService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async listMyPromotions(userId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);

    const promotions = await this.prisma.providerPromotion.findMany({
      where: { providerId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true } },
      },
    });

    return {
      items: promotions.map((p) => ({
        id: p.id,
        type: p.type,
        price: decimalToNumber(p.price),
        paymentStatus: p.paymentStatus,
        paymobOrderId: p.paymobOrderId,
        status: p.status,
        startsAt: p.startsAt,
        endsAt: p.endsAt,
        listing: p.listing,
        createdAt: p.createdAt,
      })),
    };
  }

  async createPromotion(userId: string, dto: CreateProviderPromotionDto) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderApproved(profile);

    if (dto.listingId) {
      const listing = await this.prisma.serviceListing.findFirst({
        where: {
          id: dto.listingId,
          providerId: profile.id,
          status: ServiceListingStatus.ACTIVE,
        },
      });

      if (!listing) {
        throw new BadRequestException('Active listing not found for this provider');
      }
    }

    const promotion = await this.prisma.providerPromotion.create({
      data: {
        providerId: profile.id,
        listingId: dto.listingId,
        type: dto.type,
        price: dto.price,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });

    const checkout = await this.paymobService.createPromotionCheckout({
      promotionId: promotion.id,
      amount: dto.price,
      providerUserId: userId,
      description: `Provider promotion ${dto.type}`,
    });

    if (checkout.paymobOrderId) {
      await this.prisma.providerPromotion.update({
        where: { id: promotion.id },
        data: { paymobOrderId: checkout.paymobOrderId },
      });
    }

    return {
      message: 'Promotion created — complete payment to activate',
      promotion: {
        id: promotion.id,
        type: promotion.type,
        price: dto.price,
        status: promotion.status,
        paymentStatus: promotion.paymentStatus,
      },
      payment: checkout,
    };
  }

  async confirmPayment(userId: string, promotionId: string, paymobOrderId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);

    const promotion = await this.prisma.providerPromotion.findFirst({
      where: { id: promotionId, providerId: profile.id },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion.status === ProviderPromotionStatus.ACTIVE) {
      throw new BadRequestException('Promotion is already active');
    }

    const verified =
      promotion.paymobOrderId === paymobOrderId ||
      (await this.paymobService.verifyPayment(paymobOrderId));

    if (!verified && this.paymobService.isConfigured()) {
      throw new BadRequestException('Payment verification failed');
    }

    const now = new Date();
    const updated = await this.prisma.providerPromotion.update({
      where: { id: promotion.id },
      data: {
        paymobOrderId,
        paymentStatus: PaymentStatus.PAID,
        status: ProviderPromotionStatus.ACTIVE,
        startsAt: promotion.startsAt ?? now,
        endsAt:
          promotion.endsAt ??
          new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.PROVIDER_PROMOTION_ACTIVATED, {
      providerUserId: userId,
      promotionId: updated.id,
      type: updated.type,
    });

    return {
      message: 'Promotion activated',
      promotion: updated,
    };
  }
}
