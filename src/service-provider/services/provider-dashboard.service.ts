import { Injectable } from '@nestjs/common';
import { ServiceOrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DashboardAnalyticsQueryDto,
  DashboardSummaryQueryDto,
} from '../dto/dashboard.dto';
import {
  assertProviderApproved,
  decimalToNumber,
  getProviderProfileOrFail,
  parseDateRange,
} from '../helpers/provider.helpers';

@Injectable()
export class ProviderDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string, query: DashboardSummaryQueryDto) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderApproved(profile);

    const { fromDate, toDate } = parseDateRange(query.from, query.to);
    const dateFilter = this.buildCreatedAtFilter(fromDate, toDate);

    const [
      orderStats,
      leadStats,
      deliveredOrders,
      acceptedOrders,
      totalOrders,
      topAreas,
    ] = await Promise.all([
      this.prisma.serviceOrder.aggregate({
        where: { providerId: profile.id, ...dateFilter },
        _count: { id: true },
        _sum: { subtotal: true, platformFee: true, providerNet: true },
      }),
      this.prisma.serviceLead.groupBy({
        by: ['status'],
        where: { providerId: profile.id, ...dateFilter },
        _count: { id: true },
      }),
      this.prisma.serviceOrder.count({
        where: {
          providerId: profile.id,
          status: ServiceOrderStatus.DELIVERED,
          ...dateFilter,
        },
      }),
      this.prisma.serviceOrder.count({
        where: {
          providerId: profile.id,
          status: {
            in: [
              ServiceOrderStatus.ACCEPTED,
              ServiceOrderStatus.PREPARING,
              ServiceOrderStatus.OUT_FOR_DELIVERY,
              ServiceOrderStatus.DELIVERED,
            ],
          },
          ...dateFilter,
        },
      }),
      this.prisma.serviceOrder.count({
        where: { providerId: profile.id, ...dateFilter },
      }),
      this.prisma.serviceOrder.groupBy({
        by: ['deliveryArea'],
        where: {
          providerId: profile.id,
          deliveryArea: { not: null },
          ...dateFilter,
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    const leadCount = leadStats.reduce((sum, row) => sum + row._count.id, 0);
    const acceptanceRate =
      totalOrders > 0 ? Math.round((acceptedOrders / totalOrders) * 100) / 100 : 0;

    return {
      period: { from: fromDate ?? null, to: toDate ?? null },
      orders: {
        total: orderStats._count.id,
        delivered: deliveredOrders,
        acceptanceRate,
      },
      leads: {
        total: leadCount,
        byStatus: leadStats.map((row) => ({
          status: row.status,
          count: row._count.id,
        })),
      },
      revenue: {
        totalSales: decimalToNumber(orderStats._sum.subtotal ?? 0),
        platformFee: decimalToNumber(orderStats._sum.platformFee ?? 0),
        providerNet: decimalToNumber(orderStats._sum.providerNet ?? 0),
      },
      topDeliveryAreas: topAreas.map((row) => ({
        area: row.deliveryArea,
        orderCount: row._count.id,
      })),
    };
  }

  async getAnalytics(userId: string, query: DashboardAnalyticsQueryDto) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderApproved(profile);

    const { fromDate, toDate } = parseDateRange(query.from, query.to);
    const groupBy = query.groupBy ?? 'daily';

    const orders = await this.prisma.serviceOrder.findMany({
      where: {
        providerId: profile.id,
        status: ServiceOrderStatus.DELIVERED,
        ...this.buildCreatedAtFilter(fromDate, toDate),
      },
      select: {
        createdAt: true,
        subtotal: true,
        platformFee: true,
        providerNet: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<
      string,
      { orders: number; sales: number; platformFee: number; providerNet: number }
    >();

    for (const order of orders) {
      const key = this.bucketKey(order.createdAt, groupBy);
      const current = buckets.get(key) ?? {
        orders: 0,
        sales: 0,
        platformFee: 0,
        providerNet: 0,
      };

      current.orders += 1;
      current.sales += decimalToNumber(order.subtotal);
      current.platformFee += decimalToNumber(order.platformFee);
      current.providerNet += decimalToNumber(order.providerNet);

      buckets.set(key, current);
    }

    return {
      groupBy,
      period: { from: fromDate ?? null, to: toDate ?? null },
      series: Array.from(buckets.entries()).map(([period, stats]) => ({
        period,
        ...stats,
      })),
    };
  }

  private buildCreatedAtFilter(
    fromDate?: Date,
    toDate?: Date,
  ): { createdAt?: { gte?: Date; lte?: Date } } {
    if (!fromDate && !toDate) {
      return {};
    }

    return {
      createdAt: {
        ...(fromDate ? { gte: fromDate } : {}),
        ...(toDate ? { lte: toDate } : {}),
      },
    };
  }

  private bucketKey(date: Date, groupBy: 'daily' | 'weekly'): string {
    if (groupBy === 'weekly') {
      const day = date.getUTCDay();
      const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(date);
      weekStart.setUTCDate(diff);
      return weekStart.toISOString().slice(0, 10);
    }

    return date.toISOString().slice(0, 10);
  }
}
