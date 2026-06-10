import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  buildPaginatedResult,
  PaginationQueryDto,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { QueryAdminCategoryDto } from './dto/query-admin-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllTree(query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where = { isActive: true, parentId: null };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return buildPaginatedResult(
      categories.map((category) => this.mapCategory(category)),
      total,
      page,
      limit,
    );
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.mapCategory(category);
  }

  async adminFindAll(query: QueryAdminCategoryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    if (query.parentId) {
      return this.adminFindSubcategories(query.parentId, query, page, limit, skip);
    }

    const where: Prisma.CategoryWhereInput = {
      parentId: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            where:
              query.isActive !== undefined
                ? { isActive: query.isActive }
                : undefined,
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return buildPaginatedResult(
      categories.map((category) => this.mapAdminCategory(category)),
      total,
      page,
      limit,
    );
  }

  async adminFindById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { properties: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.mapAdminCategory(category);
  }

  async adminCreate(dto: CreateCategoryDto) {
    await this.assertSlugAvailable(dto.slug);

    if (dto.parentId) {
      await this.assertMainCategory(dto.parentId);
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug: dto.slug,
        description: dto.description?.trim() || null,
        parentId: dto.parentId ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: {
        parent: true,
        children: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return {
      message: dto.parentId
        ? 'Subcategory created successfully'
        : 'Category created successfully',
      category: this.mapAdminCategory(category),
    };
  }

  async adminUpdate(id: string, dto: UpdateCategoryDto) {
    const category = await this.findCategoryOrFail(id);

    if (dto.slug && dto.slug !== category.slug) {
      await this.assertSlugAvailable(dto.slug, id);
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        parent: true,
        children: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return {
      message: 'Category updated successfully',
      category: this.mapAdminCategory(updated),
    };
  }

  async adminRemove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { properties: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.properties > 0) {
      throw new BadRequestException(
        'Cannot delete category linked to properties. Deactivate it instead.',
      );
    }

    if (category._count.children > 0) {
      throw new BadRequestException(
        'Cannot delete main category with subcategories. Delete subcategories first.',
      );
    }

    await this.prisma.category.delete({ where: { id } });

    return { message: 'Category deleted successfully' };
  }

  async assertLeafCategory(categoryId: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { children: true },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found');
    }

    if (!category.parentId || category.children.length > 0) {
      throw new BadRequestException(
        'categoryId must be a subcategory (leaf category)',
      );
    }
  }

  private async adminFindSubcategories(
    parentId: string,
    query: QueryAdminCategoryDto,
    page: number,
    limit: number,
    skip: number,
  ) {
    await this.assertMainCategory(parentId);

    const where: Prisma.CategoryWhereInput = {
      parentId,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: { parent: true },
      }),
      this.prisma.category.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.mapAdminCategory(item)),
      total,
      page,
      limit,
    );
  }

  private async findCategoryOrFail(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private async assertMainCategory(parentId: string): Promise<void> {
    const parent = await this.prisma.category.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }

    if (parent.parentId) {
      throw new BadRequestException(
        'parentId must be a main category (not a subcategory)',
      );
    }
  }

  private async assertSlugAvailable(slug: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.category.findUnique({ where: { slug } });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Slug "${slug}" is already in use`);
    }
  }

  private mapCategory(category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    sortOrder: number;
    children?: Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      parentId: string | null;
      sortOrder: number;
    }>;
    parent?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.name,
            slug: category.parent.slug,
          }
        : null,
      sortOrder: category.sortOrder,
      subcategories: category.children?.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        parentId: child.parentId,
        sortOrder: child.sortOrder,
      })),
    };
  }

  private mapAdminCategory(category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    children?: Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      parentId: string | null;
      sortOrder: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    parent?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    _count?: { properties: number; children: number };
  }) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      propertyCount: category._count?.properties,
      subcategoryCount: category._count?.children,
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.name,
            slug: category.parent.slug,
          }
        : null,
      subcategories: category.children?.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        description: child.description,
        parentId: child.parentId,
        sortOrder: child.sortOrder,
        isActive: child.isActive,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      })),
    };
  }
}
