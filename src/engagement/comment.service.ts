import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../auth/interfaces/auth.interface';
import {
  buildPaginatedResult,
  PaginationQueryDto,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { EngagementHelperService } from './engagement-helper.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engagementHelper: EngagementHelperService,
  ) {}

  async create(user: AuthUser, propertyId: string, dto: CreateCommentDto) {
    this.engagementHelper.assertCustomer(user);

    const property = await this.engagementHelper.assertApprovedProperty(propertyId);
    this.engagementHelper.assertNotPropertyOwner(user.id, property.ownerId);

    const comment = await this.prisma.propertyComment.create({
      data: {
        propertyId,
        userId: user.id,
        body: dto.body.trim(),
      },
      include: this.authorInclude(),
    });

    return this.mapComment(comment);
  }

  async findByProperty(propertyId: string, query: PaginationQueryDto) {
    await this.engagementHelper.assertApprovedProperty(propertyId);

    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where = { propertyId };

    const [items, total] = await Promise.all([
      this.prisma.propertyComment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.authorInclude(),
      }),
      this.prisma.propertyComment.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.mapComment(item)),
      total,
      page,
      limit,
    );
  }

  async findMine(userId: string, query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);
    const where = { userId };

    const [items, total] = await Promise.all([
      this.prisma.propertyComment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ...this.authorInclude(),
          property: { select: { id: true, title: true, status: true } },
        },
      }),
      this.prisma.propertyComment.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => ({
        ...this.mapComment(item),
        property: item.property,
      })),
      total,
      page,
      limit,
    );
  }

  async update(user: AuthUser, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.findCommentOrFail(commentId);
    this.engagementHelper.assertAuthorOrAdmin(user, comment.userId);

    const updated = await this.prisma.propertyComment.update({
      where: { id: commentId },
      data: {
        ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
      },
      include: this.authorInclude(),
    });

    return this.mapComment(updated);
  }

  async remove(user: AuthUser, commentId: string) {
    const comment = await this.findCommentOrFail(commentId);
    this.engagementHelper.assertAuthorOrAdmin(user, comment.userId);

    await this.prisma.propertyComment.delete({ where: { id: commentId } });

    return { message: 'Comment deleted successfully' };
  }

  private async findCommentOrFail(commentId: string) {
    const comment = await this.prisma.propertyComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  private authorInclude() {
    return {
      user: { select: { id: true, name: true } },
    };
  }

  private mapComment(comment: {
    id: string;
    propertyId: string;
    userId: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; name: string };
  }) {
    return {
      id: comment.id,
      propertyId: comment.propertyId,
      userId: comment.userId,
      body: comment.body,
      author: {
        id: comment.user.id,
        name: comment.user.name,
      },
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
