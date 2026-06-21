import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, ServiceOrderStatus, ServiceProviderStatus } from '@prisma/client';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../../common/dto/pagination.dto';
import { NOTIFICATION_EVENTS } from '../../notification/events/notification.events';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateServiceOrderDto,
  QueryProviderOrdersDto,
  RejectOrderDto,
  UpdateServiceOrderStatusDto,
} from '../dto/order.dto';
import {
  assertProviderApproved,
  computeOrderFees,
  decimalToNumber,
  getProviderProfileOrFail,
  parseDateRange,
  resolveOrderDeliveryFee,
} from '../helpers/provider.helpers';
import { ProviderMenuService } from './provider-menu.service';

const PROVIDER_STATUS_FLOW: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
};

@Injectable()
export class ServiceOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly providerMenuService: ProviderMenuService,
  ) {}

  async createOrder(customerId: string, dto: CreateServiceOrderDto) {
    const provider = await this.prisma.serviceProviderProfile.findFirst({
      where: { id: dto.providerId, status: ServiceProviderStatus.APPROVED },
      include: {
        category: true,
        user: { select: { id: true, name: true } },
      },
    });

    if (!provider) {
      throw new NotFoundException('Approved provider not found');
    }

    let listing: { id: string; title: string; deliveryFee: Prisma.Decimal } | null = null;
    if (dto.listingId) {
      const foundListing = await this.prisma.serviceListing.findFirst({
        where: {
          id: dto.listingId,
          providerId: provider.id,
          status: 'ACTIVE',
        },
        select: { id: true, title: true, deliveryFee: true },
      });

      if (!foundListing) {
        throw new BadRequestException('Active listing not found for this provider');
      }

      listing = foundListing;
    }

    await this.assertCoverage(provider.id, dto.deliveryCity, dto.deliveryArea);

    const resolvedItems = await this.providerMenuService.resolveOrderItems(
      provider.id,
      dto.items,
    );

    const subtotal = resolvedItems.reduce(
      (sum, item) => sum + decimalToNumber(item.unitPrice) * item.quantity,
      0,
    );
    const deliveryFee = resolveOrderDeliveryFee({
      listingDeliveryFee: listing ? decimalToNumber(listing.deliveryFee) : null,
      profileMenuDeliveryFee: decimalToNumber(provider.menuDeliveryFee),
    });
    const commissionRate = decimalToNumber(provider.category.commissionRate);
    const { platformFee, providerNet } = computeOrderFees(
      subtotal,
      deliveryFee,
      commissionRate,
    );

    const customer = await this.prisma.user.findUniqueOrThrow({
      where: { id: customerId },
      select: { id: true, name: true },
    });

    const order = await this.prisma.serviceOrder.create({
      data: {
        customerId,
        providerId: provider.id,
        listingId: listing?.id,
        subtotal,
        deliveryFee,
        platformFee,
        providerNet,
        deliveryCity: dto.deliveryCity,
        deliveryArea: dto.deliveryArea,
        deliveryAddress: dto.deliveryAddress,
        notes: dto.notes,
        items: {
          create: resolvedItems.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            prepTimeMinutes: item.prepTimeMinutes,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
        listing: { select: { id: true, title: true } },
        provider: {
          select: { id: true, businessName: true, userId: true },
        },
      },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_ORDER_RECEIVED, {
      providerUserId: provider.user.id,
      providerId: provider.id,
      customerId: customer.id,
      customerName: customer.name,
      orderId: order.id,
      listingTitle: listing?.title ?? provider.businessName,
      subtotal,
    });

    return {
      message: 'Order placed successfully',
      order: this.mapOrder(order),
    };
  }

  async listMyOrders(customerId: string, query: QueryProviderOrdersDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { fromDate, toDate } = parseDateRange(query.from, query.to);

    const where: Prisma.ServiceOrderWhereInput = {
      customerId,
      ...(query.status ? { status: query.status } : {}),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: true,
          listing: { select: { id: true, title: true } },
          provider: { select: { id: true, businessName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((o) => this.mapOrder(o)),
      total,
      page,
      limit,
    );
  }

  async listProviderOrders(userId: string, query: QueryProviderOrdersDto) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderApproved(profile);

    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { fromDate, toDate } = parseDateRange(query.from, query.to);

    const where: Prisma.ServiceOrderWhereInput = {
      providerId: profile.id,
      ...(query.status ? { status: query.status } : {}),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: true,
          listing: { select: { id: true, title: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((o) => this.mapOrder(o)),
      total,
      page,
      limit,
    );
  }

  async acceptOrder(userId: string, orderId: string) {
    const result = await this.transitionOrder(
      userId,
      orderId,
      ServiceOrderStatus.ACCEPTED,
    );

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_ORDER_ACCEPTED, {
      customerId: result.order.customerId,
      orderId: result.order.id,
      listingTitle: result.order.listing?.title ?? '',
    });

    return result;
  }

  async rejectOrder(userId: string, orderId: string, dto: RejectOrderDto) {
    const result = await this.transitionOrder(
      userId,
      orderId,
      ServiceOrderStatus.REJECTED,
    );

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_ORDER_REJECTED, {
      customerId: result.order.customerId,
      orderId: result.order.id,
      listingTitle: result.order.listing?.title ?? '',
      reason: dto.reason ?? null,
    });

    return result;
  }

  async updateOrderStatus(
    userId: string,
    orderId: string,
    dto: UpdateServiceOrderStatusDto,
  ) {
    const result = await this.transitionOrder(userId, orderId, dto.status);

    if (dto.status === ServiceOrderStatus.ACCEPTED) {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_ORDER_ACCEPTED, {
        customerId: result.order.customerId,
        orderId: result.order.id,
        listingTitle: result.order.listing?.title ?? '',
      });
    } else {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_ORDER_STATUS_UPDATED, {
        customerId: result.order.customerId,
        orderId: result.order.id,
        listingTitle: result.order.listing?.title ?? '',
        status: dto.status,
      });
    }

    return result;
  }

  private async transitionOrder(
    userId: string,
    orderId: string,
    targetStatus: ServiceOrderStatus,
  ) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderApproved(profile);

    const order = await this.prisma.serviceOrder.findFirst({
      where: { id: orderId, providerId: profile.id },
      include: {
        listing: { select: { title: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const allowed = PROVIDER_STATUS_FLOW[order.status];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${targetStatus}`,
      );
    }

    const updated = await this.prisma.serviceOrder.update({
      where: { id: order.id },
      data: { status: targetStatus },
      include: {
        items: true,
        listing: { select: { id: true, title: true } },
        customer: { select: { id: true, name: true, phone: true } },
        provider: { select: { id: true, businessName: true } },
      },
    });

    return {
      message: `Order ${targetStatus.toLowerCase()}`,
      order: this.mapOrder(updated),
    };
  }

  private async assertCoverage(
    providerId: string,
    city: string,
    area?: string,
  ) {
    const coverage = await this.prisma.serviceCoverageArea.findFirst({
      where: {
        providerId,
        city,
        isActive: true,
        OR: [{ area: null }, { area: area ?? null }],
      },
    });

    if (!coverage) {
      throw new BadRequestException('Provider does not cover this delivery area');
    }
  }

  private mapOrder(order: {
    id: string;
    customerId: string;
    providerId: string;
    listingId: string | null;
    status: ServiceOrderStatus;
    subtotal: Prisma.Decimal;
    deliveryFee: Prisma.Decimal;
    platformFee: Prisma.Decimal;
    providerNet: Prisma.Decimal;
    deliveryCity: string;
    deliveryArea: string | null;
    deliveryAddress: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    items?: Array<{
      id: string;
      menuItemId: string | null;
      name: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      prepTimeMinutes: number | null;
      notes: string | null;
    }>;
    listing?: { id: string; title: string } | null;
    provider?: { id: string; businessName: string; userId?: string };
    customer?: { id: string; name: string; phone?: string | null };
  }) {
    return {
      id: order.id,
      customerId: order.customerId,
      providerId: order.providerId,
      listingId: order.listingId,
      status: order.status,
      subtotal: decimalToNumber(order.subtotal),
      deliveryFee: decimalToNumber(order.deliveryFee),
      platformFee: decimalToNumber(order.platformFee),
      providerNet: decimalToNumber(order.providerNet),
      deliveryCity: order.deliveryCity,
      deliveryArea: order.deliveryArea,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      items: order.items?.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: decimalToNumber(item.unitPrice),
        prepTimeMinutes: item.prepTimeMinutes,
        notes: item.notes,
      })),
      listing: order.listing,
      provider: order.provider,
      customer: order.customer,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
