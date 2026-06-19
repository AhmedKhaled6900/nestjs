import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, ServiceLeadStatus, ServiceProviderStatus } from '@prisma/client';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../../common/dto/pagination.dto';
import { NOTIFICATION_EVENTS } from '../../notification/events/notification.events';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateServiceLeadDto,
  QueryProviderLeadsDto,
  UpdateServiceLeadStatusDto,
} from '../dto/lead.dto';
import {
  assertProviderApproved,
  getProviderProfileOrFail,
  parseDateRange,
} from '../helpers/provider.helpers';

const LEAD_STATUS_FLOW: Record<ServiceLeadStatus, ServiceLeadStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUOTED', 'LOST'],
  QUOTED: ['COMPLETED', 'LOST'],
  COMPLETED: [],
  LOST: [],
};

@Injectable()
export class ServiceLeadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createLead(customerId: string, dto: CreateServiceLeadDto) {
    const provider = await this.prisma.serviceProviderProfile.findFirst({
      where: { id: dto.providerId, status: ServiceProviderStatus.APPROVED },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!provider) {
      throw new NotFoundException('Approved provider not found');
    }

    await this.assertCoverage(provider.id, dto.pickupCity, dto.pickupArea);

    const customer = await this.prisma.user.findUniqueOrThrow({
      where: { id: customerId },
      select: { id: true, name: true },
    });

    const lead = await this.prisma.serviceLead.create({
      data: {
        customerId,
        providerId: provider.id,
        type: dto.type,
        pickupCity: dto.pickupCity,
        pickupArea: dto.pickupArea,
        destination: dto.destination,
        passengers: dto.passengers ?? 1,
        preferredDateTime: dto.preferredDateTime
          ? new Date(dto.preferredDateTime)
          : undefined,
        notes: dto.notes,
      },
      include: {
        provider: { select: { id: true, businessName: true } },
      },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_LEAD_RECEIVED, {
      providerUserId: provider.user.id,
      providerId: provider.id,
      customerId: customer.id,
      customerName: customer.name,
      leadId: lead.id,
      destination: lead.destination,
    });

    return {
      message: 'Transport lead submitted',
      lead: this.mapLead(lead),
    };
  }

  async listMyLeads(customerId: string, query: QueryProviderLeadsDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { fromDate, toDate } = parseDateRange(query.from, query.to);

    const where: Prisma.ServiceLeadWhereInput = {
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
      this.prisma.serviceLead.findMany({
        where,
        skip,
        take: limit,
        include: {
          provider: { select: { id: true, businessName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceLead.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((l) => this.mapLead(l)),
      total,
      page,
      limit,
    );
  }

  async listProviderLeads(userId: string, query: QueryProviderLeadsDto) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderApproved(profile);

    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const { fromDate, toDate } = parseDateRange(query.from, query.to);

    const where: Prisma.ServiceLeadWhereInput = {
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
      this.prisma.serviceLead.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceLead.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((l) => this.mapLead(l)),
      total,
      page,
      limit,
    );
  }

  async updateLeadStatus(
    userId: string,
    leadId: string,
    dto: UpdateServiceLeadStatusDto,
  ) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderApproved(profile);

    const lead = await this.prisma.serviceLead.findFirst({
      where: { id: leadId, providerId: profile.id },
      include: { customer: { select: { id: true, name: true } } },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const allowed = LEAD_STATUS_FLOW[lead.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition lead from ${lead.status} to ${dto.status}`,
      );
    }

    const updated = await this.prisma.serviceLead.update({
      where: { id: lead.id },
      data: { status: dto.status },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        provider: { select: { id: true, businessName: true } },
      },
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.SERVICE_LEAD_STATUS_UPDATED, {
      customerId: updated.customerId,
      leadId: updated.id,
      destination: updated.destination,
      status: dto.status,
    });

    return {
      message: 'Lead status updated',
      lead: this.mapLead(updated),
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
      throw new BadRequestException('Provider does not cover this pickup area');
    }
  }

  private mapLead(lead: {
    id: string;
    customerId: string;
    providerId: string;
    type: string;
    pickupCity: string;
    pickupArea: string | null;
    destination: string;
    passengers: number;
    preferredDateTime: Date | null;
    notes: string | null;
    status: ServiceLeadStatus;
    createdAt: Date;
    updatedAt: Date;
    provider?: { id: string; businessName: string };
    customer?: { id: string; name: string; phone?: string | null };
  }) {
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
      provider: lead.provider,
      customer: lead.customer,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }
}
