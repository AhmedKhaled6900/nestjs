import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  buildPaginatedResult,
  PaginationQueryDto,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyService } from '../property/property.service';
import { EngagementHelperService } from './engagement-helper.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly propertyService: PropertyService,
    private readonly engagementHelper: EngagementHelperService,
  ) {}

  async add(userId: string, propertyId: string) {
    await this.engagementHelper.assertApprovedProperty(propertyId);

    try {
      await this.prisma.cartItem.create({
        data: { userId, propertyId },
      });
    } catch {
      throw new ConflictException('Property is already in cart');
    }

    return { message: 'Property added to cart' };
  }

  async findMine(userId: string, query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where = { userId };

    const [items, total] = await Promise.all([
      this.prisma.cartItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { include: this.propertyService.propertyInclude() },
        },
      }),
      this.prisma.cartItem.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => ({
        propertyId: item.propertyId,
        addedAt: item.createdAt,
        property: this.propertyService.mapProperty(item.property),
      })),
      total,
      page,
      limit,
    );
  }

  async remove(userId: string, propertyId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { userId_propertyId: { userId, propertyId } },
    });

    return { message: 'Property removed from cart' };
  }

  async clear(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });

    return { message: 'Cart cleared' };
  }

  async isInCart(userId: string, propertyId: string): Promise<boolean> {
    const item = await this.prisma.cartItem.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
      select: { userId: true },
    });

    return Boolean(item);
  }
}
