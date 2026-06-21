import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceListingStatus, ServiceOrderStatus, ServiceProviderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateListingDto, UpdateListingDto } from '../dto/listing.dto';
import {
  assertProviderApproved,
  assertProviderCanManage,
  getProviderProfileOrFail,
} from '../helpers/provider.helpers';

@Injectable()
export class ProviderListingService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyListings(userId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);

    const listings = await this.prisma.serviceListing.findMany({
      where: { providerId: profile.id },
      orderBy: { updatedAt: 'desc' },
    });

    return { items: listings.map((l) => this.mapListing(l)) };
  }

  async createListing(userId: string, dto: CreateListingDto) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    const listing = await this.prisma.serviceListing.create({
      data: {
        providerId: profile.id,
        categoryId: profile.categoryId,
        title: dto.title,
        description: dto.description,
        metadata: (dto.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        status: ServiceListingStatus.DRAFT,
      },
    });

    return {
      message: 'Listing created (free listing — publish when ready)',
      listing: this.mapListing(listing),
    };
  }

  async updateListing(userId: string, listingId: string, dto: UpdateListingDto) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    const listing = await this.findOwnedListingOrFail(profile.id, listingId);

    if (dto.status === ServiceListingStatus.ACTIVE) {
      assertProviderApproved(profile);
    }

    const updated = await this.prisma.serviceListing.update({
      where: { id: listing.id },
      data: {
        title: dto.title,
        description: dto.description,
        metadata: (dto.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        status: dto.status,
      },
    });

    return {
      message: 'Listing updated',
      listing: this.mapListing(updated),
    };
  }

  async deleteListing(userId: string, listingId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    const listing = await this.findOwnedListingOrFail(profile.id, listingId);

    const activeOrders = await this.prisma.serviceOrder.count({
      where: {
        listingId: listing.id,
        status: { in: [ServiceOrderStatus.PENDING, ServiceOrderStatus.ACCEPTED, ServiceOrderStatus.PREPARING, ServiceOrderStatus.OUT_FOR_DELIVERY] },
      },
    });

    if (activeOrders > 0) {
      throw new BadRequestException('Cannot delete listing with active orders');
    }

    await this.prisma.serviceListing.delete({ where: { id: listing.id } });

    return { message: 'Listing deleted' };
  }

  private async findOwnedListingOrFail(providerId: string, listingId: string) {
    const listing = await this.prisma.serviceListing.findFirst({
      where: { id: listingId, providerId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  private mapListing(listing: {
    id: string;
    providerId: string;
    categoryId: string;
    title: string;
    description: string | null;
    metadata: unknown;
    status: ServiceListingStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: listing.id,
      providerId: listing.providerId,
      categoryId: listing.categoryId,
      title: listing.title,
      description: listing.description,
      metadata: listing.metadata,
      status: listing.status,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }
}
