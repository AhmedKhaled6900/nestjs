import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from '../dto/menu-item.dto';
import {
  assertProviderCanManage,
  decimalToNumber,
  getProviderProfileOrFail,
} from '../helpers/provider.helpers';

@Injectable()
export class ProviderMenuService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyMenu(userId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);

    const items = await this.prisma.serviceProviderMenuItem.findMany({
      where: { providerId: profile.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return { items: items.map((item) => this.mapMenuItem(item)) };
  }

  async listPublicMenu(providerId: string) {
    const profile = await this.prisma.serviceProviderProfile.findFirst({
      where: { id: providerId, status: 'APPROVED' },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Provider not found');
    }

    const items = await this.prisma.serviceProviderMenuItem.findMany({
      where: { providerId: profile.id, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return { items: items.map((item) => this.mapMenuItem(item)) };
  }

  async createMenuItem(userId: string, dto: CreateMenuItemDto) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    const item = await this.prisma.serviceProviderMenuItem.create({
      data: {
        providerId: profile.id,
        name: dto.name,
        price: dto.price,
        prepTimeMinutes: dto.prepTimeMinutes,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return {
      message: 'Menu item created',
      item: this.mapMenuItem(item),
    };
  }

  async updateMenuItem(userId: string, itemId: string, dto: UpdateMenuItemDto) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    const existing = await this.findOwnedItemOrFail(profile.id, itemId);

    const updated = await this.prisma.serviceProviderMenuItem.update({
      where: { id: existing.id },
      data: {
        name: dto.name,
        price: dto.price,
        prepTimeMinutes: dto.prepTimeMinutes,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });

    return {
      message: 'Menu item updated',
      item: this.mapMenuItem(updated),
    };
  }

  async deleteMenuItem(userId: string, itemId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    const existing = await this.findOwnedItemOrFail(profile.id, itemId);

    await this.prisma.serviceProviderMenuItem.delete({
      where: { id: existing.id },
    });

    return { message: 'Menu item deleted' };
  }

  async resolveOrderItems(
    providerId: string,
    items: Array<{
      menuItemId?: string;
      name?: string;
      quantity: number;
      notes?: string;
    }>,
  ) {
    if (!items.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const menuItemIds = items
      .map((item) => item.menuItemId)
      .filter((id): id is string => Boolean(id));

    const menuItemsById =
      menuItemIds.length > 0
        ? await this.prisma.serviceProviderMenuItem.findMany({
            where: {
              id: { in: menuItemIds },
              providerId,
              isActive: true,
            },
          })
        : [];

    if (menuItemIds.length > 0 && menuItemsById.length !== menuItemIds.length) {
      throw new BadRequestException('One or more menu items are invalid or inactive');
    }

    const menuById = new Map(menuItemsById.map((item) => [item.id, item]));

    const resolved = [];

    for (const item of items) {
      let menu = item.menuItemId ? menuById.get(item.menuItemId) : undefined;

      if (!menu && item.name) {
        const byName = await this.prisma.serviceProviderMenuItem.findFirst({
          where: {
            providerId,
            name: item.name,
            isActive: true,
          },
        });
        menu = byName ?? undefined;
      }

      if (!menu) {
        throw new BadRequestException(
          item.menuItemId
            ? `Menu item not found: ${item.menuItemId}`
            : `Menu item not found by name: ${item.name}`,
        );
      }

      resolved.push({
        menuItemId: menu.id,
        name: menu.name,
        quantity: item.quantity,
        unitPrice: menu.price,
        prepTimeMinutes: menu.prepTimeMinutes,
        notes: item.notes,
      });
    }

    return resolved;
  }

  private async findOwnedItemOrFail(providerId: string, itemId: string) {
    const item = await this.prisma.serviceProviderMenuItem.findFirst({
      where: { id: itemId, providerId },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }

  mapMenuItem(item: {
    id: string;
    providerId: string;
    name: string;
    price: { toNumber?: () => number } | number;
    prepTimeMinutes: number;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      providerId: item.providerId,
      name: item.name,
      price: decimalToNumber(item.price),
      prepTimeMinutes: item.prepTimeMinutes,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
