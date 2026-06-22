import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, ServiceProviderStatus } from '@prisma/client';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAdminProvidersDto } from '../dto/admin-provider.dto';
import { decimalToNumber } from '../helpers/provider.helpers';
import { parseListingMenuItemsJson } from '../helpers/listing-menu.helpers';
import { buildOrderSourceMeta } from '../helpers/order.helpers';

const adminProviderInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVerified: true,
      createdAt: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      commissionRate: true,
      isActive: true,
    },
  },
  coverageAreas: {
    orderBy: [{ city: 'asc' as const }, { area: 'asc' as const }],
  },
  menuItems: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
  },
  listings: {
    orderBy: { updatedAt: 'desc' as const },
  },
  orders: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      items: true,
      listing: { select: { id: true, title: true } },
      customer: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  },
  leads: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      customer: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  },
  promotions: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      listing: { select: { id: true, title: true } },
    },
  },
} satisfies Prisma.ServiceProviderProfileInclude;

type AdminProviderRecord = Prisma.ServiceProviderProfileGetPayload<{
  include: typeof adminProviderInclude;
}>;

@Injectable()
export class AdminProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async listAll(query: QueryAdminProvidersDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where = {
      ...(query.status ? { status: query.status } : {}),
    };

    const [profiles, total] = await Promise.all([
      this.prisma.serviceProviderProfile.findMany({
        where,
        skip,
        take: limit,
        include: adminProviderInclude,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.serviceProviderProfile.count({ where }),
    ]);

    return buildPaginatedResult(
      profiles.map((profile) => this.mapFullProvider(profile)),
      total,
      page,
      limit,
    );
  }

  async getById(providerId: string) {
    const profile = await this.prisma.serviceProviderProfile.findUnique({
      where: { id: providerId },
      include: adminProviderInclude,
    });

    if (!profile) {
      throw new NotFoundException('Service provider not found');
    }

    return this.mapFullProvider(profile);
  }

  private mapFullProvider(profile: AdminProviderRecord) {
    const orders = profile.orders.map((order) => this.mapOrder(order));
    const leads = profile.leads.map((lead) => this.mapLead(lead));

    return {
      id: profile.id,
      userId: profile.userId,
      businessName: profile.businessName,
      description: profile.description,
      logo: this.toPublicUrl(profile.logo),
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      menuDeliveryFee: decimalToNumber(profile.menuDeliveryFee),
      nationalId: this.toPublicUrl(profile.nationalId),
      commercialRegister: this.toPublicUrl(profile.commercialRegister),
      status: profile.status,
      rejectionReason: profile.rejectionReason,
      suspensionReason: profile.suspensionReason,
      suspendedAt: profile.suspendedAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      user: profile.user,
      category: {
        ...profile.category,
        commissionRate: decimalToNumber(profile.category.commissionRate),
      },
      coverageAreas: profile.coverageAreas,
      menuItems: profile.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: decimalToNumber(item.price),
        prepTimeMinutes: item.prepTimeMinutes,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      listings: profile.listings.map((listing) => ({
        id: listing.id,
        providerId: listing.providerId,
        categoryId: listing.categoryId,
        title: listing.title,
        description: listing.description,
        deliveryFee: decimalToNumber(listing.deliveryFee),
        image: this.toPublicUrl(listing.image),
        link: listing.link,
        menuItems: parseListingMenuItemsJson(listing.menuItems),
        metadata: listing.metadata,
        status: listing.status,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
      })),
      orders,
      leads,
      promotions: profile.promotions.map((promo) => ({
        id: promo.id,
        type: promo.type,
        price: decimalToNumber(promo.price),
        paymentStatus: promo.paymentStatus,
        paymobOrderId: promo.paymobOrderId,
        status: promo.status,
        startsAt: promo.startsAt,
        endsAt: promo.endsAt,
        listing: promo.listing,
        createdAt: promo.createdAt,
        updatedAt: promo.updatedAt,
      })),
      stats: this.buildStats(orders, leads, profile.listings.length),
    };
  }

  private buildStats(
    orders: ReturnType<AdminProviderService['mapOrder']>[],
    leads: ReturnType<AdminProviderService['mapLead']>[],
    listingsCount: number,
  ) {
    const ordersByStatus = orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {});

    const leadsByStatus = leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.status] = (acc[lead.status] ?? 0) + 1;
      return acc;
    }, {});

    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');

    return {
      listingsCount,
      ordersCount: orders.length,
      leadsCount: leads.length,
      ordersByStatus,
      leadsByStatus,
      revenue: {
        totalSales: deliveredOrders.reduce((sum, o) => sum + o.subtotal, 0),
        platformFee: deliveredOrders.reduce((sum, o) => sum + o.platformFee, 0),
        providerNet: deliveredOrders.reduce((sum, o) => sum + o.providerNet, 0),
      },
    };
  }

  private mapOrder(order: AdminProviderRecord['orders'][number]) {
    const source = buildOrderSourceMeta(order.listingId, order.listing);

    return {
      id: order.id,
      customerId: order.customerId,
      providerId: order.providerId,
      listingId: order.listingId,
      orderSource: source.orderSource,
      sourceLabel: source.sourceLabel,
      status: order.status,
      subtotal: decimalToNumber(order.subtotal),
      deliveryFee: decimalToNumber(order.deliveryFee),
      platformFee: decimalToNumber(order.platformFee),
      providerNet: decimalToNumber(order.providerNet),
      deliveryCity: order.deliveryCity,
      deliveryArea: order.deliveryArea,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      items: order.items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: decimalToNumber(item.unitPrice),
        prepTimeMinutes: item.prepTimeMinutes,
        notes: item.notes,
      })),
      listing: source.listing,
      customer: order.customer,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private mapLead(lead: AdminProviderRecord['leads'][number]) {
    return {
      id: lead.id,
      customerId: lead.customerId,
      providerId: lead.providerId,
      type: lead.type,
      pickupCity: lead.pickupCity,
      pickupArea: lead.pickupArea,
      destination: lead.destination,
      passengers: lead.passengers,
      preferredDateTime: lead.preferredDateTime,
      notes: lead.notes,
      status: lead.status,
      customer: lead.customer,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  private toPublicUrl(storedValue: string | null): string | null {
    if (!storedValue) {
      return null;
    }

    if (storedValue.startsWith('http://') || storedValue.startsWith('https://')) {
      return storedValue;
    }

    if (storedValue.startsWith('/uploads/')) {
      const appUrl = this.configService
        .get<string>('APP_URL', 'http://localhost:3000')
        .replace(/\/$/, '');
      return `${appUrl}${storedValue}`;
    }

    return null;
  }
}
