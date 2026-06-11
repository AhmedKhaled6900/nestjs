import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../auth/interfaces/auth.interface';
import {
  buildPaginatedResult,
  PaginationQueryDto,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { EngagementHelperService } from './engagement-helper.service';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engagementHelper: EngagementHelperService,
  ) {}

  async create(user: AuthUser, propertyId: string, dto: CreateReviewDto) {
    this.engagementHelper.assertCustomer(user);

    const property = await this.engagementHelper.assertApprovedProperty(propertyId);
    this.engagementHelper.assertNotPropertyOwner(user.id, property.ownerId);

    try {
      const review = await this.prisma.propertyReview.create({
        data: {
          propertyId,
          userId: user.id,
          rating: dto.rating,
          body: dto.body.trim(),
        },
        include: this.authorInclude(),
      });

      return this.mapReview(review);
    } catch {
      throw new ConflictException('You already reviewed this property');
    }
  }

  async findByProperty(propertyId: string, query: PaginationQueryDto) {
    await this.engagementHelper.assertApprovedProperty(propertyId);

    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where = { propertyId };

    const [items, total, aggregate] = await Promise.all([
      this.prisma.propertyReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.authorInclude(),
      }),
      this.prisma.propertyReview.count({ where }),
      this.prisma.propertyReview.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const result = buildPaginatedResult(
      items.map((item) => this.mapReview(item)),
      total,
      page,
      limit,
    );

    return {
      ...result,
      summary: {
        averageRating: aggregate._avg.rating
          ? Number(aggregate._avg.rating.toFixed(2))
          : null,
        totalReviews: aggregate._count.rating,
      },
    };
  }

  async findMine(userId: string, query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where = { userId };

    const [items, total] = await Promise.all([
      this.prisma.propertyReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ...this.authorInclude(),
          property: { select: { id: true, title: true, status: true } },
        },
      }),
      this.prisma.propertyReview.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => ({
        ...this.mapReview(item),
        property: item.property,
      })),
      total,
      page,
      limit,
    );
  }

  async update(user: AuthUser, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.findReviewOrFail(reviewId);
    this.engagementHelper.assertAuthorOrAdmin(user, review.userId);

    const updated = await this.prisma.propertyReview.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined ? { rating: dto.rating } : {}),
        ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
      },
      include: this.authorInclude(),
    });

    return this.mapReview(updated);
  }

  async remove(user: AuthUser, reviewId: string) {
    const review = await this.findReviewOrFail(reviewId);
    this.engagementHelper.assertAuthorOrAdmin(user, review.userId);

    await this.prisma.propertyReview.delete({ where: { id: reviewId } });

    return { message: 'Review deleted successfully' };
  }

  private async findReviewOrFail(reviewId: string) {
    const review = await this.prisma.propertyReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  private authorInclude() {
    return {
      user: { select: { id: true, name: true } },
    };
  }

  private mapReview(review: {
    id: string;
    propertyId: string;
    userId: string;
    rating: number;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; name: string };
  }) {
    return {
      id: review.id,
      propertyId: review.propertyId,
      userId: review.userId,
      rating: review.rating,
      body: review.body,
      author: {
        id: review.user.id,
        name: review.user.name,
      },
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
