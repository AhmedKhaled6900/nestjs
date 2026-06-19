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
} from '../helpers/provider.helpers';

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
  ) {}

  async createOrder(customerId: string, dto: CreateServiceOrderDto) {
    if (!dto.items.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const listing = await this.prisma.serviceListing.findFirst({
      where: { id: dto.listingId, status: 'ACTIVE' },
      include: {
        provider: {
          include: {
            category: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Active listing not found');
    }

    if (listing.provider.status !== ServiceProviderStatus.APPROVED) {
      throw new BadRequestException('Provider is not available');
    }

    await this.assertCoverage(listing.provider.id, dto.deliveryCity, dto.deliveryArea);

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const deliveryFee = dto.deliveryFee ?? 0;
    const commissionRate = decimalToNumber(listing.provider.category.commissionRate);
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
        providerId: listing.providerId,
        listingId: listing.id,
        subtotal,
        deliveryFee,
        platformFee,
        providerNet,
        deliveryCity: dto.deliveryCity,
        deliveryArea: dto.deliveryArea,
        deliveryAddress: dto.deliveryAddress,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
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
      providerUserId: listing.provider.user.id,
      providerId: listing.provider.id,
      customerId: customer.id,
      customerName: customer.name,
      orderId: order.id,
      listingTitle: listing.title,
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
    listingId: string;
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
      name: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      notes: string | null;
    }>;
    listing?: { id: string; title: string };
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
        name: item.name,
        quantity: item.quantity,
        unitPrice: decimalToNumber(item.unitPrice),
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
