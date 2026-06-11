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
export class FavoriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly propertyService: PropertyService,
    private readonly engagementHelper: EngagementHelperService,
  ) {}

  async add(userId: string, propertyId: string) {
    await this.engagementHelper.assertApprovedProperty(propertyId);

    try {
      await this.prisma.favorite.create({
        data: { userId, propertyId },
      });
    } catch {
      throw new ConflictException('Property is already in favorites');
    }

    return { message: 'Property added to favorites' };
  }

  async findMine(userId: string, query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where = { userId };

    const [items, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { include: this.propertyService.propertyInclude() },
        },
      }),
      this.prisma.favorite.count({ where }),
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
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favorite.delete({
      where: { userId_propertyId: { userId, propertyId } },
    });

    return { message: 'Property removed from favorites' };
  }

  async isFavorited(userId: string, propertyId: string): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
      select: { userId: true },
    });

    return Boolean(favorite);
  }
}
