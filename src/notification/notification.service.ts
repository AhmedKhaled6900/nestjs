import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, RoleName } from '@prisma/client';
import {
  buildPaginatedResult,
  PaginationQueryDto,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceTokenService } from './device-token.service';

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
    private readonly deviceTokenService: DeviceTokenService,
  ) {}

  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as Prisma.InputJsonValue | undefined,
      },
    });

    this.logger.log(
      `Notification [${notification.type}] → user ${notification.userId}: ${notification.title}`,
    );

    const mapped = this.mapNotification(notification);
    await this.pushFcm(input.userId, mapped);

    return mapped;
  }

  async createForAllAdmins(input: Omit<CreateNotificationInput, 'userId'>) {
    const adminIds = await this.getAdminUserIds();

    if (adminIds.length === 0) {
      this.logger.warn(`No admin users found for notification: ${input.type}`);
      return [];
    }

    return Promise.all(
      adminIds.map((userId) =>
        this.create({
          ...input,
          userId,
        }),
      ),
    );
  }

  async findForUser(userId: string, query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where = { userId };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.mapNotification(item)),
      total,
      page,
      limit,
    );
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });

    return { unreadCount: count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.readAt) {
      return this.mapNotification(notification);
    }

    const updated = await this.prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });

    return this.mapNotification(updated);
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return {
      message: 'All notifications marked as read',
      updatedCount: result.count,
    };
  }

  private async pushFcm(
    userId: string,
    notification: ReturnType<NotificationService['mapNotification']>,
  ): Promise<void> {
    if (!this.firebaseService.isEnabled()) {
      return;
    }

    try {
      const tokens = await this.deviceTokenService.getTokensForUser(userId);
      if (tokens.length === 0) {
        return;
      }

      const invalidTokens = await this.firebaseService.sendToTokens(tokens, {
        title: notification.title,
        body: notification.body,
        data: {
          notificationId: notification.id,
          type: notification.type,
          userId: notification.userId,
          createdAt: notification.createdAt.toISOString(),
          ...(notification.data
            ? { payload: JSON.stringify(notification.data) }
            : {}),
        },
      });

      await this.deviceTokenService.removeInvalidTokens(invalidTokens);
    } catch (error) {
      this.logger.error(`FCM push failed for user ${userId}`, error);
    }
  }

  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: { name: RoleName.ADMIN } },
      select: { id: true },
    });

    return admins.map((admin) => admin.id);
  }

  private mapNotification(notification: {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data: Prisma.JsonValue;
    readAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      isRead: notification.readAt !== null,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
