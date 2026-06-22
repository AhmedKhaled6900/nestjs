import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ProviderPromotionStatus,
  ServiceListingStatus,
  ServiceProviderStatus,
} from '@prisma/client';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../../common/dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { QueryFeaturedListingsDto, QueryProvidersDto } from '../dto/discovery.dto';
import { decimalToNumber } from '../helpers/provider.helpers';
import { parseListingMenuItemsJson } from '../helpers/listing-menu.helpers';

@Injectable()
export class ServiceDiscoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {}

  async listCategories() {
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      items: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        sortOrder: c.sortOrder,
      })),
    };
  }

  async listProviders(query: QueryProvidersDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const categoryFilter = query.category
      ? await this.resolveCategoryFilter(query.category)
      : undefined;

    const coverageFilter =
      query.city
        ? {
            coverageAreas: {
              some: {
                city: query.city,
                isActive: true,
                OR: query.area
                  ? [{ area: null }, { area: query.area }]
                  : [{ area: null }, { area: { not: null } }],
              },
            },
          }
        : {};

    const where = {
      status: ServiceProviderStatus.APPROVED,
      ...(categoryFilter ? { categoryId: categoryFilter } : {}),
      ...coverageFilter,
      OR: [
        { listings: { some: { status: ServiceListingStatus.ACTIVE } } },
        { menuItems: { some: { isActive: true } } },
      ],
    };

    const [providers, total] = await Promise.all([
      this.prisma.serviceProviderProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          listings: {
            where: { status: ServiceListingStatus.ACTIVE },
            take: 1,
            select: { id: true, title: true },
          },
          promotions: {
            where: {
              status: ProviderPromotionStatus.ACTIVE,
              OR: [
                { endsAt: null },
                { endsAt: { gte: new Date() } },
              ],
            },
            select: { type: true },
          },
          _count: {
            select: {
              menuItems: { where: { isActive: true } },
            },
          },
        },
        orderBy: [{ businessName: 'asc' }],
      }),
      this.prisma.serviceProviderProfile.count({ where }),
    ]);

    const items = providers
      .map((p) => ({
        id: p.id,
        businessName: p.businessName,
        description: p.description,
        logo: this.toPublicUrl(p.logo),
        phone: p.phone,
        whatsapp: p.whatsapp,
        category: p.category,
        featuredListing: p.listings[0] ?? null,
        menuItemsCount: p._count.menuItems,
        hasMenu: p._count.menuItems > 0,
        isPromoted: p.promotions.length > 0,
        promotionTypes: p.promotions.map((promo) => promo.type),
      }))
      .sort((a, b) => Number(b.isPromoted) - Number(a.isPromoted));

    return buildPaginatedResult(items, total, page, limit);
  }

  async getProviderDetails(providerId: string) {
    const provider = await this.prisma.serviceProviderProfile.findFirst({
      where: { id: providerId, status: ServiceProviderStatus.APPROVED },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        coverageAreas: { where: { isActive: true } },
        listings: {
          where: { status: ServiceListingStatus.ACTIVE },
          orderBy: { updatedAt: 'desc' },
        },
        menuItems: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return {
      id: provider.id,
      businessName: provider.businessName,
      description: provider.description,
      logo: this.toPublicUrl(provider.logo),
      phone: provider.phone,
      whatsapp: provider.whatsapp,
      menuDeliveryFee: decimalToNumber(provider.menuDeliveryFee),
      category: provider.category,
      coverageAreas: provider.coverageAreas,
      menuItems: provider.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: decimalToNumber(item.price),
        prepTimeMinutes: item.prepTimeMinutes,
        sortOrder: item.sortOrder,
      })),
      listings: provider.listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        deliveryFee: decimalToNumber(listing.deliveryFee),
        image: this.toPublicUrl(listing.image),
        link: listing.link,
        isFeatured: listing.isFeatured,
        menuItems: parseListingMenuItemsJson(listing.menuItems),
        metadata: listing.metadata,
      })),
    };
  }

  async listFeaturedListings(query: QueryFeaturedListingsDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where = {
      status: ServiceListingStatus.ACTIVE,
      isFeatured: true,
      provider: { status: ServiceProviderStatus.APPROVED },
    };

    const [listings, total] = await Promise.all([
      this.prisma.serviceListing.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ updatedAt: 'desc' }],
        include: {
          provider: {
            select: {
              id: true,
              businessName: true,
              logo: true,
              phone: true,
              whatsapp: true,
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
      this.prisma.serviceListing.count({ where }),
    ]);

    const items = listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      deliveryFee: decimalToNumber(listing.deliveryFee),
      image: this.toPublicUrl(listing.image),
      link: listing.link,
      isFeatured: true,
      menuItems: parseListingMenuItemsJson(listing.menuItems),
      metadata: listing.metadata,
      provider: {
        id: listing.provider.id,
        businessName: listing.provider.businessName,
        logo: this.toPublicUrl(listing.provider.logo),
        phone: listing.provider.phone,
        whatsapp: listing.provider.whatsapp,
        category: listing.provider.category,
      },
    }));

    return buildPaginatedResult(items, total, page, limit);
  }

  private async resolveCategoryFilter(category: string) {
    const found = await this.prisma.serviceCategory.findFirst({
      where: {
        isActive: true,
        OR: [{ id: category }, { slug: category }],
      },
      select: { id: true },
    });

    if (!found) {
      throw new NotFoundException('Service category not found');
    }

    return found.id;
  }

  private toPublicUrl(storedValue: string | null): string | null {
    if (!storedValue) {
      return null;
    }

    const appUrl = this.configService
      .get<string>('APP_URL', 'http://localhost:3000')
      .replace(/\/$/, '');

    return this.uploadService.toPublicUrl(storedValue, appUrl);
  }
}
