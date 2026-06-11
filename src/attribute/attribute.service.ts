import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttributeScope,
  AttributeType,
  Prisma,
} from '@prisma/client';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAttributeDto,
  QueryAttributeDto,
  SyncSubcategoryAttributesDto,
  UpdateAttributeDto,
} from './dto/attribute.dto';

const SELECT_TYPES: AttributeType[] = [
  AttributeType.SELECT,
  AttributeType.MULTI_SELECT,
];

@Injectable()
export class AttributeService {
  constructor(private readonly prisma: PrismaService) {}

  async adminFindAll(query: QueryAttributeDto) {
    const { page, limit, skip } = resolvePagination(query.page, query.limit);

    const where: Prisma.AttributeWhereInput = {
      ...(query.scope ? { scope: query.scope } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.attribute.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.attribute.count({ where }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.mapAttribute(item)),
      total,
      page,
      limit,
    );
  }

  async adminFindById(id: string) {
    const attribute = await this.findAttributeOrFail(id);
    return this.mapAttribute(attribute);
  }

  async adminCreate(dto: CreateAttributeDto, createdById?: string) {
    this.validateAttributeDefinition(dto.type, dto.options, dto.scope, dto.companyId);

    await this.assertSlugAvailable(dto.slug);

    const attribute = await this.prisma.attribute.create({
      data: {
        name: dto.name.trim(),
        slug: dto.slug,
        type: dto.type,
        scope: dto.scope,
        options: dto.options?.length ? dto.options : Prisma.JsonNull,
        companyId: dto.scope === AttributeScope.COMPANY ? dto.companyId : null,
        createdById,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return this.mapAttribute(attribute);
  }

  async adminUpdate(id: string, dto: UpdateAttributeDto) {
    const attribute = await this.findAttributeOrFail(id);

    const nextType = dto.type ?? attribute.type;
    const nextOptions =
      dto.options !== undefined
        ? dto.options
        : attribute.options
          ? (attribute.options as string[])
          : undefined;
    const nextScope = dto.scope ?? attribute.scope;
    const nextCompanyId =
      dto.companyId !== undefined ? dto.companyId : attribute.companyId;

    this.validateAttributeDefinition(
      nextType,
      nextOptions,
      nextScope,
      nextCompanyId,
    );

    if (dto.slug && dto.slug !== attribute.slug) {
      await this.assertSlugAvailable(dto.slug, id);
    }

    const updated = await this.prisma.attribute.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.scope !== undefined ? { scope: dto.scope } : {}),
        ...(dto.options !== undefined
          ? { options: dto.options.length ? dto.options : Prisma.JsonNull }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(nextScope === AttributeScope.COMPANY
          ? { companyId: nextCompanyId }
          : { companyId: null }),
      },
    });

    return this.mapAttribute(updated);
  }

  async adminRemove(id: string) {
    await this.findAttributeOrFail(id);

    const inUse = await this.prisma.propertyAttributeValue.count({
      where: { attributeId: id },
    });

    if (inUse > 0) {
      throw new BadRequestException(
        'Cannot delete attribute linked to properties. Set isActive to false instead.',
      );
    }

    await this.prisma.subcategoryAttribute.deleteMany({ where: { attributeId: id } });
    await this.prisma.attribute.delete({ where: { id } });

    return { message: 'Attribute deleted successfully' };
  }

  async syncSubcategoryAttributes(
    subcategoryId: string,
    dto: SyncSubcategoryAttributesDto,
  ) {
    await this.assertSubcategoryOrFail(subcategoryId);

    const attributeIds = dto.items.map((item) => item.attributeId);
    if (new Set(attributeIds).size !== attributeIds.length) {
      throw new BadRequestException('Duplicate attributeId in items');
    }

    if (attributeIds.length) {
      const attributes = await this.prisma.attribute.findMany({
        where: { id: { in: attributeIds }, scope: AttributeScope.SYSTEM },
      });

      if (attributes.length !== attributeIds.length) {
        throw new BadRequestException(
          'All linked attributes must exist and have SYSTEM scope',
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.subcategoryAttribute.deleteMany({
        where: { subcategoryId },
      }),
      ...dto.items.map((item) =>
        this.prisma.subcategoryAttribute.create({
          data: {
            subcategoryId,
            attributeId: item.attributeId,
            isRequired: item.isRequired ?? false,
            sortOrder: item.sortOrder ?? 0,
          },
        }),
      ),
    ]);

    return this.findAttributesForSubcategory(subcategoryId, {
      activeOnly: false,
    });
  }

  async findSelectMenu(options: {
    scope?: AttributeScope;
    activeOnly: boolean;
    isActive?: boolean;
  }) {
    const scope = options.scope ?? AttributeScope.SYSTEM;

    const items = await this.prisma.attribute.findMany({
      where: {
        scope,
        ...(options.isActive !== undefined ? { isActive: options.isActive } : {}),
        ...(options.activeOnly && options.isActive === undefined
          ? { isActive: true }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        type: item.type,
        scope: item.scope,
        options: Array.isArray(item.options)
          ? (item.options as string[])
          : null,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
      })),
    };
  }

  async findAttributesForSubcategory(
    subcategoryId: string,
    options: { activeOnly: boolean },
  ) {
    await this.assertSubcategoryOrFail(subcategoryId);

    const links = await this.prisma.subcategoryAttribute.findMany({
      where: {
        subcategoryId,
        attribute: options.activeOnly ? { isActive: true } : undefined,
      },
      orderBy: { sortOrder: 'asc' },
      include: { attribute: true },
    });

    return {
      subcategoryId,
      items: links.map((link) => ({
        ...this.mapAttribute(link.attribute),
        isRequired: link.isRequired,
        linkSortOrder: link.sortOrder,
      })),
    };
  }

  async assertSubcategoryAttributesValid(
    subcategoryId: string,
    attributeIds: string[],
    options?: { requireAllRequired?: boolean },
  ) {
    const { items } = await this.findAttributesForSubcategory(subcategoryId, {
      activeOnly: true,
    });

    const allowedIds = new Set(items.map((item) => item.id));
    for (const attributeId of attributeIds) {
      if (!allowedIds.has(attributeId)) {
        throw new BadRequestException(
          `attributeId ${attributeId} is not linked to the selected subcategory`,
        );
      }
    }

    if (options?.requireAllRequired) {
      const provided = new Set(attributeIds);
      const missing = items.filter(
        (item) => item.isRequired && !provided.has(item.id),
      );

      if (missing.length) {
        throw new BadRequestException(
          `Missing required attributes: ${missing.map((item) => item.slug).join(', ')}`,
        );
      }
    }

    return items;
  }

  private validateAttributeDefinition(
    type: AttributeType,
    options: string[] | undefined,
    scope: AttributeScope,
    companyId?: string | null,
  ) {
    if (SELECT_TYPES.includes(type)) {
      if (!options?.length) {
        throw new BadRequestException(
          'options are required for SELECT and MULTI_SELECT attribute types',
        );
      }
    } else if (options?.length) {
      throw new BadRequestException(
        'options are only allowed for SELECT and MULTI_SELECT attribute types',
      );
    }

    if (scope === AttributeScope.COMPANY && !companyId) {
      throw new BadRequestException('companyId is required when scope is COMPANY');
    }

    if (scope === AttributeScope.SYSTEM && companyId) {
      throw new BadRequestException('companyId is not allowed for SYSTEM scope');
    }
  }

  private async assertSubcategoryOrFail(subcategoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: subcategoryId },
    });

    if (!category) {
      throw new NotFoundException('Subcategory not found');
    }

    if (!category.parentId) {
      throw new BadRequestException(
        'categoryId must be a subcategory (leaf category), not a main category',
      );
    }

    return category;
  }

  private async findAttributeOrFail(id: string) {
    const attribute = await this.prisma.attribute.findUnique({ where: { id } });

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    return attribute;
  }

  private async assertSlugAvailable(slug: string, excludeId?: string) {
    const existing = await this.prisma.attribute.findUnique({ where: { slug } });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Slug "${slug}" is already in use`);
    }
  }

  mapAttribute(attribute: {
    id: string;
    name: string;
    slug: string;
    type: AttributeType;
    scope: AttributeScope;
    options: Prisma.JsonValue;
    companyId: string | null;
    createdById: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: attribute.id,
      name: attribute.name,
      slug: attribute.slug,
      type: attribute.type,
      scope: attribute.scope,
      options: Array.isArray(attribute.options)
        ? (attribute.options as string[])
        : null,
      companyId: attribute.companyId,
      createdById: attribute.createdById,
      isActive: attribute.isActive,
      sortOrder: attribute.sortOrder,
      createdAt: attribute.createdAt,
      updatedAt: attribute.updatedAt,
    };
  }
}
