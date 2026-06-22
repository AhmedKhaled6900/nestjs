import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  ServiceListingStatus,
  ServiceOrderStatus,
  ServiceProviderStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NOTIFICATION_EVENTS } from '../../notification/events/notification.events';
import { UploadService } from '../../upload/upload.service';
import { CreateListingDto, UpdateListingDto } from '../dto/listing.dto';
import {
  assertProviderApproved,
  assertProviderCanManage,
  decimalToNumber,
  getProviderProfileOrFail,
} from '../helpers/provider.helpers';
import {
  ListingMenuItem,
  parseAndNormalizeMenuItemsInput,
  parseListingMenuItemsJson,
} from '../helpers/listing-menu.helpers';
import {
  aggregateListingOrderStats,
  createEmptyListingOrderStats,
  ListingOrderStats,
} from '../helpers/order.helpers';

@Injectable()
export class ProviderListingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async listMyListings(userId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);

    const listings = await this.prisma.serviceListing.findMany({
      where: { providerId: profile.id },
      orderBy: { updatedAt: 'desc' },
    });

    const orderStatsByListing = await this.getListingOrderStats(
      profile.id,
      listings.map((listing) => listing.id),
    );

    return {
      items: listings.map((listing) =>
        this.mapListing(
          listing,
          orderStatsByListing.get(listing.id) ?? createEmptyListingOrderStats(),
        ),
      ),
    };
  }

  private async getListingOrderStats(providerId: string, listingIds: string[]) {
    if (!listingIds.length) {
      return new Map<string, ListingOrderStats>();
    }

    const rows = await this.prisma.serviceOrder.groupBy({
      by: ['listingId', 'status'],
      where: {
        providerId,
        listingId: { in: listingIds },
      },
      _count: { id: true },
    });

    return aggregateListingOrderStats(rows);
  }

  async createListing(
    userId: string,
    dto: CreateListingDto,
    imageFile: Express.Multer.File,
  ) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    if (!imageFile) {
      throw new BadRequestException(
        'Listing image is required. Send multipart/form-data with an image file in the image field (not JSON body).',
      );
    }

    const image = await this.uploadService.saveServiceListingImage(
      imageFile,
      profile.id,
    );

    const menuItems = parseAndNormalizeMenuItemsInput(dto.menuItems) ?? [];

    const listing = await this.prisma.serviceListing.create({
      data: {
        providerId: profile.id,
        categoryId: profile.categoryId,
        title: dto.title,
        description: dto.description,
        deliveryFee: dto.deliveryFee ?? 0,
        image,
        link: dto.link,
        menuItems: menuItems as unknown as Prisma.InputJsonValue,
        metadata: (dto.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        status: ServiceListingStatus.DRAFT,
      },
    });

    return {
      message: 'Listing created as draft — submit for admin review when ready',
      listing: this.mapListing(listing, createEmptyListingOrderStats()),
    };
  }

  async submitForReview(userId: string, listingId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);
    assertProviderApproved(profile);

    const listing = await this.findOwnedListingOrFail(profile.id, listingId);

    if (
      listing.status !== ServiceListingStatus.DRAFT &&
      listing.status !== ServiceListingStatus.REJECTED &&
      listing.status !== ServiceListingStatus.PAUSED
    ) {
      throw new BadRequestException(
        'Only draft, rejected, or paused listings can be submitted for review',
      );
    }

    if (!listing.image) {
      throw new BadRequestException('Listing image is required before submission');
    }

    const updated = await this.prisma.serviceListing.update({
      where: { id: listing.id },
      data: {
        status: ServiceListingStatus.PENDING_REVIEW,
        rejectionReason: null,
        submittedAt: new Date(),
        reviewedAt: null,
      },
      include: {
        provider: {
          select: {
            userId: true,
            businessName: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_LISTING_SUBMITTED, {
      listingId: updated.id,
      listingTitle: updated.title,
      providerId: updated.providerId,
      providerUserId: updated.provider.userId,
      businessName: updated.provider.businessName,
      providerName: updated.provider.user.name,
    });

    const orderStats =
      (await this.getListingOrderStats(profile.id, [updated.id])).get(
        updated.id,
      ) ?? createEmptyListingOrderStats();

    return {
      message: 'Listing submitted for admin review',
      listing: this.mapListing(updated, orderStats),
    };
  }

  async updateListing(
    userId: string,
    listingId: string,
    dto: UpdateListingDto,
    imageFile?: Express.Multer.File,
  ) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    const listing = await this.findOwnedListingOrFail(profile.id, listingId);

    if (listing.status === ServiceListingStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Listing is pending review — wait for admin decision before editing',
      );
    }

    const statusUpdate = this.resolveProviderStatusUpdate(listing.status, dto.status);

    let image = listing.image;
    if (imageFile) {
      await this.uploadService.deleteLocalFile(listing.image);
      image = await this.uploadService.saveServiceListingImage(
        imageFile,
        profile.id,
      );
    }

    const menuItems =
      dto.menuItems === undefined
        ? undefined
        : parseAndNormalizeMenuItemsInput(dto.menuItems) ?? [];

    const updated = await this.prisma.serviceListing.update({
      where: { id: listing.id },
      data: {
        title: dto.title,
        description: dto.description,
        deliveryFee: dto.deliveryFee,
        image,
        link: dto.link,
        ...(menuItems !== undefined
          ? { menuItems: menuItems as unknown as Prisma.InputJsonValue }
          : {}),
        metadata: (dto.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ...(statusUpdate !== undefined
          ? {
              status: statusUpdate,
              ...(statusUpdate === ServiceListingStatus.PAUSED
                ? { isFeatured: false }
                : {}),
            }
          : {}),
      },
    });

    const orderStats =
      (await this.getListingOrderStats(profile.id, [updated.id])).get(
        updated.id,
      ) ?? createEmptyListingOrderStats();

    return {
      message: 'Listing updated',
      listing: this.mapListing(updated, orderStats),
    };
  }

  async deleteListing(userId: string, listingId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    const listing = await this.findOwnedListingOrFail(profile.id, listingId);

    const activeOrders = await this.prisma.serviceOrder.count({
      where: {
        listingId: listing.id,
        status: {
          in: [
            ServiceOrderStatus.PENDING,
            ServiceOrderStatus.ACCEPTED,
            ServiceOrderStatus.PREPARING,
            ServiceOrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
    });

    if (activeOrders > 0) {
      throw new BadRequestException('Cannot delete listing with active orders');
    }

    await this.uploadService.deleteLocalFile(listing.image);
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

  mapListing(
    listing: {
    id: string;
    providerId: string;
    categoryId: string;
    title: string;
    description: string | null;
    deliveryFee: { toNumber?: () => number } | number;
    image: string | null;
    link: string | null;
    menuItems: unknown;
    metadata: unknown;
    isFeatured?: boolean;
    rejectionReason?: string | null;
    submittedAt?: Date | null;
    reviewedAt?: Date | null;
    status: ServiceListingStatus;
    createdAt: Date;
    updatedAt: Date;
  },
    orderStats: ListingOrderStats = createEmptyListingOrderStats(),
  ) {
    return {
      id: listing.id,
      providerId: listing.providerId,
      categoryId: listing.categoryId,
      title: listing.title,
      description: listing.description,
      deliveryFee: decimalToNumber(listing.deliveryFee),
      image: this.toPublicUrl(listing.image),
      link: listing.link,
      menuItems: this.mapListingMenuItems(listing.menuItems),
      orderStats,
      metadata: listing.metadata,
      isFeatured: listing.isFeatured ?? false,
      rejectionReason: listing.rejectionReason ?? null,
      submittedAt: listing.submittedAt ?? null,
      reviewedAt: listing.reviewedAt ?? null,
      status: listing.status,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  }

  mapListingMenuItems(value: unknown): ListingMenuItem[] {
    if (value === null || value === undefined) {
      return [];
    }

    return parseListingMenuItemsJson(value);
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

  private resolveProviderStatusUpdate(
    currentStatus: ServiceListingStatus,
    requestedStatus?: ServiceListingStatus,
  ): ServiceListingStatus | undefined {
    if (requestedStatus === undefined) {
      return undefined;
    }

    if (requestedStatus === ServiceListingStatus.ACTIVE) {
      throw new BadRequestException(
        'Use POST /provider/listings/:id/submit to request publication',
      );
    }

    if (
      requestedStatus === ServiceListingStatus.PENDING_REVIEW ||
      requestedStatus === ServiceListingStatus.REJECTED
    ) {
      throw new BadRequestException('Invalid listing status for provider update');
    }

    if (requestedStatus === ServiceListingStatus.PAUSED) {
      if (currentStatus !== ServiceListingStatus.ACTIVE) {
        throw new BadRequestException('Only active listings can be paused');
      }
      return ServiceListingStatus.PAUSED;
    }

    if (requestedStatus === ServiceListingStatus.DRAFT) {
      throw new BadRequestException('Cannot revert listing to draft via update');
    }

    throw new BadRequestException('Invalid listing status');
  }
}
