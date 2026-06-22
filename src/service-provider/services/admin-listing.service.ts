import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, ServiceListingStatus } from '@prisma/client';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../../common/dto/pagination.dto';
import { NOTIFICATION_EVENTS } from '../../notification/events/notification.events';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryAdminListingsDto } from '../dto/admin-listing.dto';
import { createEmptyListingOrderStats } from '../helpers/order.helpers';
import { ProviderListingService } from './provider-listing.service';

@Injectable()
export class AdminListingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly listingService: ProviderListingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async listAll(query: QueryAdminListingsDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where: Prisma.ServiceListingWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.featured === true ? { isFeatured: true } : {}),
    };

    const [listings, total] = await Promise.all([
      this.prisma.serviceListing.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
        include: this.listingInclude(),
      }),
      this.prisma.serviceListing.count({ where }),
    ]);

    return buildPaginatedResult(
      listings.map((listing) => this.mapAdminListing(listing)),
      total,
      page,
      limit,
    );
  }

  async listPending(query: QueryAdminListingsDto) {
    return this.listAll({ ...query, status: ServiceListingStatus.PENDING_REVIEW });
  }

  async getById(listingId: string) {
    const listing = await this.prisma.serviceListing.findUnique({
      where: { id: listingId },
      include: this.listingInclude(),
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.mapAdminListing(listing);
  }

  async approve(listingId: string) {
    const listing = await this.findListingOrFail(listingId);

    if (listing.status !== ServiceListingStatus.PENDING_REVIEW) {
      throw new BadRequestException('Only listings pending review can be approved');
    }

    const updated = await this.prisma.serviceListing.update({
      where: { id: listing.id },
      data: {
        status: ServiceListingStatus.ACTIVE,
        rejectionReason: null,
        reviewedAt: new Date(),
      },
      include: this.listingInclude(),
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_LISTING_APPROVED, {
      providerUserId: updated.provider.userId,
      listingId: updated.id,
      listingTitle: updated.title,
      businessName: updated.provider.businessName,
    });

    return {
      message: 'Listing approved and published',
      listing: this.mapAdminListing(updated),
    };
  }

  async reject(listingId: string, reason: string) {
    const listing = await this.findListingOrFail(listingId);

    if (listing.status !== ServiceListingStatus.PENDING_REVIEW) {
      throw new BadRequestException('Only listings pending review can be rejected');
    }

    const updated = await this.prisma.serviceListing.update({
      where: { id: listing.id },
      data: {
        status: ServiceListingStatus.REJECTED,
        rejectionReason: reason,
        reviewedAt: new Date(),
        isFeatured: false,
      },
      include: this.listingInclude(),
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_LISTING_REJECTED, {
      providerUserId: updated.provider.userId,
      listingId: updated.id,
      listingTitle: updated.title,
      reason,
    });

    return {
      message: 'Listing rejected',
      listing: this.mapAdminListing(updated),
    };
  }

  async setFeatured(listingId: string, isFeatured: boolean) {
    const listing = await this.findListingOrFail(listingId);

    if (listing.status !== ServiceListingStatus.ACTIVE) {
      throw new BadRequestException('Only active listings can be featured');
    }

    const updated = await this.prisma.serviceListing.update({
      where: { id: listing.id },
      data: { isFeatured },
      include: this.listingInclude(),
    });

    return {
      message: isFeatured ? 'Listing marked as featured' : 'Listing removed from featured',
      listing: this.mapAdminListing(updated),
    };
  }

  private async findListingOrFail(listingId: string) {
    const listing = await this.prisma.serviceListing.findUnique({
      where: { id: listingId },
      include: { provider: { select: { userId: true, businessName: true } } },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  private listingInclude() {
    return {
      provider: {
        select: {
          id: true,
          userId: true,
          businessName: true,
          phone: true,
          status: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      },
    } satisfies Prisma.ServiceListingInclude;
  }

  private mapAdminListing(
    listing: Prisma.ServiceListingGetPayload<{
      include: ReturnType<AdminListingService['listingInclude']>;
    }>,
  ) {
    return {
      ...this.listingService.mapListing(listing, createEmptyListingOrderStats()),
      isFeatured: listing.isFeatured,
      rejectionReason: listing.rejectionReason,
      submittedAt: listing.submittedAt,
      reviewedAt: listing.reviewedAt,
      provider: listing.provider,
    };
  }
}
