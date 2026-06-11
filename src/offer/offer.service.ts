import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OfferSenderRole,
  OfferStatus,
  Prisma,
  PropertyStatus,
  RoleName,
} from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth.interface';
import {
  buildPaginatedResult,
  PaginationQueryDto,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { NOTIFICATION_EVENTS } from '../notification/events/notification.events';
import { RentalService } from '../rental/rental.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACTIVE_OFFER_STATUSES,
  CLOSED_OFFER_STATUSES,
  MAX_OFFERS_PER_SIDE,
  OFFER_EXPIRY_DAYS,
} from './offer.constants';
import { CounterOfferDto, CreateOfferDto, QueryOwnerOffersDto } from './dto/offer.dto';

type OfferWithRounds = Prisma.PriceOfferGetPayload<{
  include: typeof OfferService.offerInclude;
}>;

@Injectable()
export class OfferService {
  static readonly offerInclude = {
    rounds: { orderBy: { createdAt: 'asc' as const } },
    property: {
      select: {
        id: true,
        title: true,
        ownerId: true,
        isNegotiable: true,
        status: true,
        price: true,
        pricePeriod: true,
        purpose: true,
      },
    },
    customer: { select: { id: true, name: true, email: true } },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly rentalService: RentalService,
  ) {}

  async create(propertyId: string, user: AuthUser, dto: CreateOfferDto) {
    await this.assertVerifiedCustomer(user);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        isNegotiable: true,
        status: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== PropertyStatus.APPROVED) {
      throw new BadRequestException('Offers are only allowed on approved properties');
    }

    if (!property.isNegotiable) {
      throw new BadRequestException('This property does not accept price offers');
    }

    if (property.ownerId === user.id) {
      throw new BadRequestException('You cannot send an offer on your own property');
    }

    const activeOffer = await this.prisma.priceOffer.findFirst({
      where: {
        propertyId,
        customerId: user.id,
        status: { in: ACTIVE_OFFER_STATUSES },
      },
    });

    if (activeOffer) {
      throw new BadRequestException(
        'You already have an active offer on this property',
      );
    }

    const expiresAt = this.computeExpiryDate();

    const offer = await this.prisma.priceOffer.create({
      data: {
        propertyId,
        customerId: user.id,
        status: OfferStatus.PENDING,
        expiresAt,
        customerOfferCount: 1,
        rounds: {
          create: {
            senderRole: OfferSenderRole.CUSTOMER,
            senderId: user.id,
            price: new Prisma.Decimal(dto.price),
            pricePeriod: dto.pricePeriod,
            duration: dto.duration,
            notes: dto.notes?.trim() || null,
          },
        },
      },
      include: OfferService.offerInclude,
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.PRICE_OFFER_RECEIVED, {
      ownerUserId: property.ownerId,
      customerId: user.id,
      customerName: user.name,
      propertyId: property.id,
      propertyTitle: property.title,
      offerId: offer.id,
      price: dto.price,
      pricePeriod: dto.pricePeriod,
    });

    return this.mapOffer(offer);
  }

  async findById(offerId: string, user: AuthUser) {
    await this.expireStaleOffers([offerId]);

    const offer = await this.findOfferOrFail(offerId);
    this.assertOfferParticipant(user, offer);

    return this.mapOffer(offer);
  }

  async findSentByCustomer(customerId: string, query: PaginationQueryDto) {
    await this.expireStaleOffersForUser(customerId, 'customer');

    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where = { customerId };

    const [items, total] = await Promise.all([
      this.prisma.priceOffer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: OfferService.offerInclude,
      }),
      this.prisma.priceOffer.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.mapOffer(item)),
      total,
      page,
      limit,
    );
  }

  async findReceivedByOwner(ownerId: string, query: QueryOwnerOffersDto) {
    await this.expireStaleOffersForOwner(ownerId);

    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where: Prisma.PriceOfferWhereInput = {
      property: { ownerId },
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.priceOffer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: OfferService.offerInclude,
      }),
      this.prisma.priceOffer.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.mapOffer(item)),
      total,
      page,
      limit,
    );
  }

  async findReceivedGroupedByProperty(ownerId: string) {
    await this.expireStaleOffersForOwner(ownerId);

    const properties = await this.prisma.property.findMany({
      where: {
        ownerId,
        priceOffers: { some: {} },
      },
      select: {
        id: true,
        title: true,
        status: true,
        isNegotiable: true,
        price: true,
        pricePeriod: true,
        priceOffers: {
          orderBy: { updatedAt: 'desc' },
          include: OfferService.offerInclude,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      items: properties.map((property) => ({
        property: {
          id: property.id,
          title: property.title,
          status: property.status,
          isNegotiable: property.isNegotiable,
          price: property.price.toNumber(),
          pricePeriod: property.pricePeriod,
        },
        summary: this.summarizeOffers(property.priceOffers),
        offers: property.priceOffers.map((offer) => this.mapOffer(offer)),
      })),
    };
  }

  async accept(offerId: string, user: AuthUser) {
    const offer = await this.loadActiveOfferForOwner(offerId, user);
    this.assertOwnerTurn(offer);

    const updated = await this.prisma.priceOffer.update({
      where: { id: offer.id },
      data: { status: OfferStatus.ACCEPTED },
      include: OfferService.offerInclude,
    });

    const latest = this.getLatestRound(updated);
    const rental = await this.rentalService.activateFromAcceptedOffer(updated.id);

    this.eventEmitter.emit(NOTIFICATION_EVENTS.PRICE_OFFER_ACCEPTED, {
      customerId: updated.customerId,
      propertyId: updated.propertyId,
      propertyTitle: updated.property.title,
      offerId: updated.id,
      price: latest.price.toNumber(),
      pricePeriod: latest.pricePeriod,
      endsAt: rental.endsAt.toISOString(),
    });

    return {
      ...this.mapOffer(updated),
      rental: this.rentalService.mapRentalRecord(rental, {
        id: user.id,
        role: user.role,
      }),
    };
  }

  async reject(offerId: string, user: AuthUser, reason?: string) {
    const offer = await this.loadActiveOfferForOwner(offerId, user);
    this.assertOwnerTurn(offer);

    const updated = await this.prisma.priceOffer.update({
      where: { id: offer.id },
      data: { status: OfferStatus.REJECTED },
      include: OfferService.offerInclude,
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.PRICE_OFFER_REJECTED, {
      customerId: updated.customerId,
      propertyId: updated.propertyId,
      propertyTitle: updated.property.title,
      offerId: updated.id,
      reason: reason?.trim() || null,
    });

    return this.mapOffer(updated);
  }

  async counterByOwner(offerId: string, user: AuthUser, dto: CounterOfferDto) {
    const offer = await this.loadActiveOfferForOwner(offerId, user);
    this.assertOwnerTurn(offer);

    if (offer.ownerOfferCount >= MAX_OFFERS_PER_SIDE) {
      return this.failNegotiation(offer.id, offer.customerId, offer.property);
    }

    return this.addCounterRound(offer, OfferSenderRole.OWNER, user.id, dto);
  }

  async counterByCustomer(offerId: string, user: AuthUser, dto: CounterOfferDto) {
    await this.assertVerifiedCustomer(user);

    const offer = await this.loadActiveOfferForCustomer(offerId, user);
    this.assertCustomerTurn(offer);

    if (offer.customerOfferCount >= MAX_OFFERS_PER_SIDE) {
      return this.failNegotiation(offer.id, offer.customerId, offer.property);
    }

    return this.addCounterRound(offer, OfferSenderRole.CUSTOMER, user.id, dto);
  }

  private async addCounterRound(
    offer: OfferWithRounds,
    senderRole: OfferSenderRole,
    senderId: string,
    dto: CounterOfferDto,
  ) {
    const nextCustomerCount =
      senderRole === OfferSenderRole.CUSTOMER
        ? offer.customerOfferCount + 1
        : offer.customerOfferCount;
    const nextOwnerCount =
      senderRole === OfferSenderRole.OWNER
        ? offer.ownerOfferCount + 1
        : offer.ownerOfferCount;

    const updated = await this.prisma.priceOffer.update({
      where: { id: offer.id },
      data: {
        status: OfferStatus.NEGOTIATING,
        expiresAt: this.computeExpiryDate(),
        customerOfferCount: nextCustomerCount,
        ownerOfferCount: nextOwnerCount,
        rounds: {
          create: {
            senderRole,
            senderId,
            price: new Prisma.Decimal(dto.price),
            pricePeriod: dto.pricePeriod,
            duration: dto.duration,
            notes: dto.notes?.trim() || null,
          },
        },
      },
      include: OfferService.offerInclude,
    });

    const latest = this.getLatestRound(updated);
    const notifyUserId =
      senderRole === OfferSenderRole.OWNER
        ? updated.customerId
        : updated.property.ownerId;

    this.eventEmitter.emit(NOTIFICATION_EVENTS.PRICE_OFFER_COUNTERED, {
      recipientUserId: notifyUserId,
      senderRole,
      propertyId: updated.propertyId,
      propertyTitle: updated.property.title,
      offerId: updated.id,
      price: latest.price.toNumber(),
      pricePeriod: latest.pricePeriod,
    });

    return this.mapOffer(updated);
  }

  private async failNegotiation(
    offerId: string,
    customerId: string,
    property: { id: string; title: string; ownerId: string },
  ) {
    const updated = await this.prisma.priceOffer.update({
      where: { id: offerId },
      data: { status: OfferStatus.NEGOTIATING_FAIL },
      include: OfferService.offerInclude,
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.PRICE_OFFER_NEGOTIATING_FAILED, {
      customerId,
      ownerUserId: property.ownerId,
      propertyId: property.id,
      propertyTitle: property.title,
      offerId,
    });

    return this.mapOffer(updated);
  }

  private async loadActiveOfferForOwner(offerId: string, user: AuthUser) {
    await this.expireStaleOffers([offerId]);

    const offer = await this.findOfferOrFail(offerId);

    if (offer.property.ownerId !== user.id && user.role !== RoleName.ADMIN) {
      throw new ForbiddenException('Only the property owner can respond to this offer');
    }

    if (!ACTIVE_OFFER_STATUSES.includes(offer.status)) {
      throw new BadRequestException(`Offer is already ${offer.status}`);
    }

    return offer;
  }

  private async loadActiveOfferForCustomer(offerId: string, user: AuthUser) {
    await this.expireStaleOffers([offerId]);

    const offer = await this.findOfferOrFail(offerId);

    if (offer.customerId !== user.id) {
      throw new ForbiddenException('You can only counter your own offers');
    }

    if (offer.status !== OfferStatus.NEGOTIATING) {
      throw new BadRequestException('You can only counter during active negotiation');
    }

    return offer;
  }

  private assertOwnerTurn(offer: OfferWithRounds) {
    if (offer.status === OfferStatus.PENDING) {
      return;
    }

    if (offer.status !== OfferStatus.NEGOTIATING) {
      throw new BadRequestException(`Offer is ${offer.status}`);
    }

    const lastRound = this.getLatestRound(offer);

    if (lastRound.senderRole !== OfferSenderRole.CUSTOMER) {
      throw new BadRequestException('Waiting for the customer to respond');
    }
  }

  private assertCustomerTurn(offer: OfferWithRounds) {
    const lastRound = this.getLatestRound(offer);

    if (lastRound.senderRole !== OfferSenderRole.OWNER) {
      throw new BadRequestException('Waiting for the owner to respond');
    }
  }

  private async assertVerifiedCustomer(user: AuthUser) {
    if (user.role !== RoleName.CUSTOMER && user.role !== RoleName.ADMIN) {
      throw new ForbiddenException('Only customers can submit price offers');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { isVerified: true },
    });

    if (!dbUser?.isVerified) {
      throw new ForbiddenException('Email must be verified before submitting offers');
    }
  }

  private assertOfferParticipant(user: AuthUser, offer: OfferWithRounds) {
    const isCustomer = offer.customerId === user.id;
    const isOwner = offer.property.ownerId === user.id;
    const isAdmin = user.role === RoleName.ADMIN;

    if (!isCustomer && !isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have access to this offer');
    }
  }

  private async findOfferOrFail(offerId: string) {
    const offer = await this.prisma.priceOffer.findUnique({
      where: { id: offerId },
      include: OfferService.offerInclude,
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return offer;
  }

  private async expireStaleOffers(offerIds?: string[]) {
    const now = new Date();

    const stale = await this.prisma.priceOffer.findMany({
      where: {
        status: { in: ACTIVE_OFFER_STATUSES },
        expiresAt: { lt: now },
        ...(offerIds ? { id: { in: offerIds } } : {}),
      },
      include: {
        property: { select: { id: true, title: true, ownerId: true } },
      },
    });

    if (!stale.length) {
      return;
    }

    await this.prisma.priceOffer.updateMany({
      where: { id: { in: stale.map((item) => item.id) } },
      data: { status: OfferStatus.EXPIRED },
    });

    for (const offer of stale) {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.PRICE_OFFER_EXPIRED, {
        customerId: offer.customerId,
        ownerUserId: offer.property.ownerId,
        propertyId: offer.propertyId,
        propertyTitle: offer.property.title,
        offerId: offer.id,
      });
    }
  }

  private async expireStaleOffersForUser(userId: string, role: 'customer') {
    const offers = await this.prisma.priceOffer.findMany({
      where: { customerId: userId, status: { in: ACTIVE_OFFER_STATUSES } },
      select: { id: true },
    });

    await this.expireStaleOffers(offers.map((item) => item.id));
  }

  private async expireStaleOffersForOwner(ownerId: string) {
    const offers = await this.prisma.priceOffer.findMany({
      where: {
        property: { ownerId },
        status: { in: ACTIVE_OFFER_STATUSES },
      },
      select: { id: true },
    });

    await this.expireStaleOffers(offers.map((item) => item.id));
  }

  private computeExpiryDate(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + OFFER_EXPIRY_DAYS);
    return expiresAt;
  }

  private getLatestRound(offer: OfferWithRounds) {
    const round = offer.rounds[offer.rounds.length - 1];

    if (!round) {
      throw new BadRequestException('Offer has no rounds');
    }

    return round;
  }

  private summarizeOffers(offers: OfferWithRounds[]) {
    return {
      total: offers.length,
      pending: offers.filter((item) => item.status === OfferStatus.PENDING).length,
      negotiating: offers.filter((item) => item.status === OfferStatus.NEGOTIATING)
        .length,
      accepted: offers.filter((item) => item.status === OfferStatus.ACCEPTED).length,
      rejected: offers.filter((item) => item.status === OfferStatus.REJECTED).length,
      expired: offers.filter((item) => item.status === OfferStatus.EXPIRED).length,
      negotiatingFailed: offers.filter(
        (item) => item.status === OfferStatus.NEGOTIATING_FAIL,
      ).length,
      active: offers.filter((item) => ACTIVE_OFFER_STATUSES.includes(item.status))
        .length,
      closed: offers.filter((item) => CLOSED_OFFER_STATUSES.includes(item.status))
        .length,
    };
  }

  private mapOffer(offer: OfferWithRounds) {
    const latestRound = offer.rounds[offer.rounds.length - 1];

    return {
      id: offer.id,
      propertyId: offer.propertyId,
      customerId: offer.customerId,
      status: offer.status,
      expiresAt: offer.expiresAt,
      customerOfferCount: offer.customerOfferCount,
      ownerOfferCount: offer.ownerOfferCount,
      maxOffersPerSide: MAX_OFFERS_PER_SIDE,
      expiresInDays: OFFER_EXPIRY_DAYS,
      property: {
        id: offer.property.id,
        title: offer.property.title,
        ownerId: offer.property.ownerId,
        isNegotiable: offer.property.isNegotiable,
        status: offer.property.status,
        listPrice: offer.property.price.toNumber(),
        listPricePeriod: offer.property.pricePeriod,
        purpose: offer.property.purpose,
      },
      customer: offer.customer,
      latestRound: latestRound
        ? {
            id: latestRound.id,
            senderRole: latestRound.senderRole,
            senderId: latestRound.senderId,
            price: latestRound.price.toNumber(),
            pricePeriod: latestRound.pricePeriod,
            duration: latestRound.duration,
            notes: latestRound.notes,
            createdAt: latestRound.createdAt,
          }
        : null,
      rounds: offer.rounds.map((round) => ({
        id: round.id,
        senderRole: round.senderRole,
        senderId: round.senderId,
        price: round.price.toNumber(),
        pricePeriod: round.pricePeriod,
        duration: round.duration,
        notes: round.notes,
        createdAt: round.createdAt,
      })),
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    };
  }
}
