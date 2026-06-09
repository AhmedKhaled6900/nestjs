import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllTree() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return categories.map((category) => this.mapCategory(category));
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
}
