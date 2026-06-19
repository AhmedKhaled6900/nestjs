import { Injectable, NotFoundException } from '@nestjs/common';
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
import { QueryProvidersDto } from '../dto/discovery.dto';

@Injectable()
export class ServiceDiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

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
      listings: { some: { status: ServiceListingStatus.ACTIVE } },
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
        logo: p.logo,
        phone: p.phone,
        whatsapp: p.whatsapp,
        category: p.category,
        featuredListing: p.listings[0] ?? null,
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
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return {
      id: provider.id,
      businessName: provider.businessName,
      description: provider.description,
      logo: provider.logo,
      phone: provider.phone,
      whatsapp: provider.whatsapp,
      category: provider.category,
      coverageAreas: provider.coverageAreas,
      listings: provider.listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        description: listing.description,
        menuItems: listing.menuItems,
        metadata: listing.metadata,
      })),
    };
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
}
