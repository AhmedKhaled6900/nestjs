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
import { CreateSubcategoryDto, UpdateSubcategoryDto } from './dto/subcategory.dto';
import { QueryAdminCategoryDto } from './dto/query-admin-category.dto';
import { QuerySubcategoryDto } from './dto/query-subcategory.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findMainCategories(query: PaginationQueryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where = { isActive: true, parentId: null };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return buildPaginatedResult(
      categories.map((category) => this.mapMainCategory(category)),
      total,
      page,
      limit,
    );
  }

  /** @deprecated Use findMainCategories — kept for internal compatibility */
  async findAllTree(query: PaginationQueryDto) {
    return this.findMainCategories(query);
  }

  async findSelectMenu(options: { activeOnly: boolean }) {
    const mains = await this.prisma.category.findMany({
      where: {
        parentId: null,
        ...(options.activeOnly ? { isActive: true } : {}),
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: options.activeOnly ? { isActive: true } : undefined,
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return {
      items: mains.map((main) => ({
        id: main.id,
        name: main.name,
        slug: main.slug,
        description: main.description,
        sortOrder: main.sortOrder,
        isActive: main.isActive,
        subcategories: main.children.map((sub) => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          parentId: sub.parentId,
          sortOrder: sub.sortOrder,
          isActive: sub.isActive,
        })),
      })),
    };
  }

  async findSubcategorySelectMenu(options: {
    parentId?: string;
    activeOnly: boolean;
    isActive?: boolean;
  }) {
    if (options.parentId) {
      await this.assertMainCategory(options.parentId);
    }

    const where: Prisma.CategoryWhereInput = {
      parentId: options.parentId ?? { not: null },
      ...(options.isActive !== undefined ? { isActive: options.isActive } : {}),
      ...(options.activeOnly
        ? { isActive: true, parent: { isActive: true } }
        : {}),
    };

    const [items, parent] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: options.parentId
          ? { sortOrder: 'asc' }
          : [{ parent: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: options.activeOnly
            ? undefined
            : { select: { properties: true } },
        },
      }),
      options.parentId
        ? this.prisma.category.findUnique({ where: { id: options.parentId } })
        : Promise.resolve(null),
    ]);

    return {
      ...(parent
        ? {
            parent: {
              id: parent.id,
              name: parent.name,
              slug: parent.slug,
              description: parent.description,
              sortOrder: parent.sortOrder,
              isActive: parent.isActive,
            },
          }
        : {}),
      items: items.map((item) =>
        this.mapSubcategory(item, options.activeOnly),
      ),
    };
  }

  async findSubcategories(
    query: QuerySubcategoryDto,
    options: { activeOnly: boolean; isActive?: boolean },
  ) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    if (query.parentId) {
      await this.assertMainCategory(query.parentId);
    }

    const where: Prisma.CategoryWhereInput = {
      parentId: query.parentId ? query.parentId : { not: null },
      ...(options.isActive !== undefined ? { isActive: options.isActive } : {}),
      ...(options.activeOnly
        ? { isActive: true, parent: { isActive: true } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ parent: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          _count: options.activeOnly
            ? undefined
            : { select: { properties: true } },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.mapSubcategory(item, options.activeOnly)),
      total,
      page,
      limit,
    );
  }

  async assertSubcategoryUnderParent(
    subcategoryId: string,
    parentCategoryId: string,
  ): Promise<void> {
    const sub = await this.prisma.category.findUnique({
      where: { id: subcategoryId },
    });

    if (!sub || !sub.parentId) {
      throw new NotFoundException('Subcategory not found');
    }

    if (sub.parentId !== parentCategoryId) {
      throw new BadRequestException(
        'subcategoryId does not belong to the given parentCategoryId',
      );
    }
  }

  async buildPropertyCategoryFilter(query: {
    parentCategoryId?: string;
    subcategoryId?: string;
    categoryId?: string;
  }): Promise<Prisma.PropertyWhereInput> {
    const subId = query.subcategoryId ?? query.categoryId;

    if (subId && query.parentCategoryId) {
      await this.assertSubcategoryUnderParent(subId, query.parentCategoryId);
      return { categoryId: subId };
    }

    if (subId) {
      await this.assertLeafCategory(subId);
      return { categoryId: subId };
    }

    if (query.parentCategoryId) {
      await this.assertMainCategory(query.parentCategoryId);
      return {
        category: {
          parentId: query.parentCategoryId,
          isActive: true,
        },
      };
    }

    return {};
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

  async adminFindSubcategories(query: QueryAdminCategoryDto) {
    return this.findSubcategories(
      { page: query.page, limit: query.limit, parentId: query.parentId },
      { activeOnly: false, isActive: query.isActive },
    );
  }

  async adminFindAll(query: QueryAdminCategoryDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    if (query.parentId) {
      return this.adminFindSubcategories(query);
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

  async adminFindSubcategoriesByParent(
    parentId: string,
    query: QueryAdminCategoryDto,
  ) {
    return this.findSubcategories(
      { page: query.page, limit: query.limit, parentId },
      { activeOnly: false, isActive: query.isActive },
    );
  }

  async adminCreateSubcategory(
    parentId: string,
    dto: Omit<CreateSubcategoryDto, 'parentId'> | CreateSubcategoryDto,
  ) {
    return this.adminCreate({
      ...dto,
      parentId,
    });
  }

  async adminFindSubcategoryById(id: string) {
    const category = await this.assertSubcategoryOrFail(id);
    return this.mapAdminCategory(category);
  }

  async adminUpdateSubcategory(id: string, dto: UpdateSubcategoryDto) {
    await this.assertSubcategoryOrFail(id);
    const result = await this.adminUpdate(id, dto);
    return { ...result, message: 'Subcategory updated successfully' };
  }

  async adminRemoveSubcategory(id: string) {
    await this.assertSubcategoryOrFail(id);
    const result = await this.adminRemove(id);
    return { message: 'Subcategory deleted successfully' };
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

  private async listSubcategoriesPaginated(
    parentId: string,
    query: QueryAdminCategoryDto,
    page: number,
    limit: number,
    skip: number,
  ) {
    return this.findSubcategories(
      { page, limit, parentId },
      { activeOnly: false, isActive: query.isActive },
    );
  }

  private async assertSubcategoryOrFail(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { properties: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Subcategory not found');
    }

    if (!category.parentId) {
      throw new BadRequestException(
        'This endpoint is for subcategories only. Use /admin/categories for main categories.',
      );
    }

    return category;
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

  private mapMainCategory(category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
  }) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      sortOrder: category.sortOrder,
    };
  }

  private mapSubcategory(
    category: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      parentId: string | null;
      sortOrder: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      parent?: { id: string; name: string; slug: string } | null;
      _count?: { properties: number };
    },
    publicView: boolean,
  ) {
    const base = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      parent: category.parent ?? null,
    };

    if (publicView) {
      return base;
    }

    return {
      ...base,
      isActive: category.isActive,
      propertyCount: category._count?.properties,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
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
      isSubcategory: category.parentId !== null,
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
