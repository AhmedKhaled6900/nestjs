import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OfferStatus,
  PricePeriod,
  Prisma,
  PropertyPurpose,
  PropertyStatus,
  RentalSource,
  RentalStatus,
  RoleName,
} from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth.interface';
import {
  buildPaginatedResult,
  PaginationQueryDto,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { NOTIFICATION_EVENTS } from '../notification/events/notification.events';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/booking.dto';
import { buildPropertyRentalPayload } from './rental-payload';
import { computeRentalEndDate } from './rental.utils';

type RentalWithRelations = Prisma.PropertyRentalGetPayload<{
  include: typeof RentalService.rentalInclude;
}>;

@Injectable()
export class RentalService {
  static readonly rentalInclude = {
    property: {
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
        images: { orderBy: { order: 'asc' as const } },
        rentals: {
          where: { status: RentalStatus.ACTIVE },
          take: 1,
          include: {
            tenant: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    },
    tenant: { select: { id: true, name: true, email: true, phone: true } },
    offer: { select: { id: true, status: true } },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createDirectBooking(user: AuthUser, dto: CreateBookingDto) {
    await this.assertVerifiedCustomer(user);

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        purpose: true,
        status: true,
        price: true,
        pricePeriod: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.purpose !== PropertyPurpose.RENT) {
      throw new BadRequestException('Only RENT properties can be booked');
    }

    if (property.status !== PropertyStatus.APPROVED) {
      throw new BadRequestException('Property is not available for booking');
    }

    if (property.ownerId === user.id) {
      throw new BadRequestException('You cannot book your own property');
    }

    await this.assertNoActiveRental(property.id);

    const pricePeriod = dto.pricePeriod ?? property.pricePeriod;
    if (!pricePeriod) {
      throw new BadRequestException('Property has no rental price period');
    }

    const rental = await this.createRental({
      propertyId: property.id,
      tenantId: user.id,
      source: RentalSource.DIRECT_BOOKING,
      agreedPrice: property.price,
      pricePeriod,
      duration: dto.duration,
      notes: dto.notes,
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.PROPERTY_RENTED, {
      ownerUserId: property.ownerId,
      tenantId: user.id,
      tenantName: user.name,
      propertyId: property.id,
      propertyTitle: property.title,
      rentalId: rental.id,
      agreedPrice: rental.agreedPrice.toNumber(),
      pricePeriod: rental.pricePeriod,
      duration: rental.duration,
      endsAt: rental.endsAt.toISOString(),
      source: RentalSource.DIRECT_BOOKING,
    });

    return {
      message: 'Property booked successfully',
      rental: this.mapRental(rental, { id: user.id, role: user.role }, rental.property),
      propertyId: rental.propertyId,
    };
  }

  async activateFromAcceptedOffer(offerId: string) {
    const offer = await this.prisma.priceOffer.findUnique({
      where: { id: offerId },
      include: {
        rounds: { orderBy: { createdAt: 'asc' } },
        property: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            purpose: true,
            status: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.property.purpose !== PropertyPurpose.RENT) {
      throw new BadRequestException('Negotiated rentals apply to RENT properties only');
    }

    await this.assertNoActiveRental(offer.propertyId);

    const latestRound = offer.rounds[offer.rounds.length - 1];
    if (!latestRound) {
      throw new BadRequestException('Offer has no price rounds');
    }

    const rental = await this.createRental({
      propertyId: offer.propertyId,
      tenantId: offer.customerId,
      offerId: offer.id,
      source: RentalSource.NEGOTIATION,
      agreedPrice: latestRound.price,
      pricePeriod: latestRound.pricePeriod,
      duration: latestRound.duration,
      notes: latestRound.notes,
    });

    const customer = await this.prisma.user.findUnique({
      where: { id: offer.customerId },
      select: { name: true },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.PROPERTY_RENTED, {
      ownerUserId: offer.property.ownerId,
      tenantId: offer.customerId,
      tenantName: customer?.name ?? 'Customer',
      propertyId: offer.property.id,
      propertyTitle: offer.property.title,
      rentalId: rental.id,
      agreedPrice: rental.agreedPrice.toNumber(),
      pricePeriod: rental.pricePeriod,
      duration: rental.duration,
      endsAt: rental.endsAt.toISOString(),
      source: RentalSource.NEGOTIATION,
    });

    await this.prisma.priceOffer.updateMany({
      where: {
        propertyId: offer.propertyId,
        id: { not: offer.id },
        status: { in: [OfferStatus.PENDING, OfferStatus.NEGOTIATING] },
      },
      data: { status: OfferStatus.REJECTED },
    });

    return rental;
  }

  async findMyRentals(tenantId: string, query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where = { tenantId };

    const [items, total] = await Promise.all([
      this.prisma.propertyRental.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: RentalService.rentalInclude,
      }),
      this.prisma.propertyRental.count({ where }),
    ]);

    const viewer = { id: tenantId, role: RoleName.CUSTOMER };

    return buildPaginatedResult(
      items.map((item) => ({
        ...this.mapRental(item, viewer, item.property),
        propertyId: item.propertyId,
      })),
      total,
      page,
      limit,
    );
  }

  async findByPropertyForOwner(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId !== ownerId) {
      throw new ForbiddenException('Not your property');
    }

    const rentals = await this.prisma.propertyRental.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      include: RentalService.rentalInclude,
    });

    const viewer = { id: ownerId, role: RoleName.OWNER };

    return rentals.map((rental) =>
      this.mapRental(rental, viewer, rental.property),
    );
  }

  private async createRental(input: {
    propertyId: string;
    tenantId: string;
    offerId?: string;
    source: RentalSource;
    agreedPrice: Prisma.Decimal | number;
    pricePeriod: PricePeriod;
    duration: number;
    notes?: string | null;
  }) {
    const startedAt = new Date();
    const endsAt = computeRentalEndDate(
      startedAt,
      input.pricePeriod,
      input.duration,
    );

    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.propertyRental.create({
        data: {
          propertyId: input.propertyId,
          tenantId: input.tenantId,
          offerId: input.offerId,
          source: input.source,
          agreedPrice: new Prisma.Decimal(input.agreedPrice),
          pricePeriod: input.pricePeriod,
          duration: input.duration,
          startedAt,
          endsAt,
          status: RentalStatus.ACTIVE,
          notes: input.notes?.trim() || null,
        },
        include: RentalService.rentalInclude,
      });

      await tx.property.update({
        where: { id: input.propertyId },
        data: { status: PropertyStatus.RENTED },
      });

      return rental;
    });
  }

  private async assertNoActiveRental(propertyId: string) {
    const active = await this.prisma.propertyRental.findFirst({
      where: { propertyId, status: RentalStatus.ACTIVE },
    });

    if (active) {
      throw new BadRequestException('Property is already rented');
    }
  }

  private async assertVerifiedCustomer(user: AuthUser) {
    if (user.role !== RoleName.CUSTOMER && user.role !== RoleName.ADMIN) {
      throw new ForbiddenException('Only customers can book properties');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { isVerified: true },
    });

    if (!dbUser?.isVerified) {
      throw new ForbiddenException('Email must be verified before booking');
    }
  }

  mapRentalRecord(
    rental: RentalWithRelations,
    viewer?: { id: string; role: string },
    property?: { ownerId: string },
  ) {
    return this.mapRental(rental, viewer, property ?? rental.property);
  }

  private mapRental(
    rental: RentalWithRelations,
    viewer?: { id: string; role: string },
    property?: { ownerId: string },
  ) {
    const payload =
      property && rental.tenant
        ? buildPropertyRentalPayload(rental, viewer, property)
        : undefined;

    return {
      id: rental.id,
      propertyId: rental.propertyId,
      tenantId: rental.tenantId,
      offerId: rental.offerId,
      source: rental.source,
      agreedPrice: rental.agreedPrice.toNumber(),
      pricePeriod: rental.pricePeriod,
      duration: rental.duration,
      startedAt: rental.startedAt,
      endsAt: rental.endsAt,
      status: rental.status,
      notes: rental.notes,
      tenant: payload?.tenant,
      createdAt: rental.createdAt,
      updatedAt: rental.updatedAt,
    };
  }
}
