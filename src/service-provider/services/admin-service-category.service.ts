import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
} from '../dto/admin.dto';

@Injectable()
export class AdminServiceCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return {
      items: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        commissionRate: Number(c.commissionRate),
        isActive: c.isActive,
        sortOrder: c.sortOrder,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
  }

  async createCategory(dto: CreateServiceCategoryDto) {
    const existing = await this.prisma.serviceCategory.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException('Category slug already exists');
    }

    const category = await this.prisma.serviceCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        commissionRate: dto.commissionRate ?? 0,
      },
    });

    return {
      message: 'Service category created',
      category: {
        ...category,
        commissionRate: Number(category.commissionRate),
      },
    };
  }

  async updateCategory(categoryId: string, dto: UpdateServiceCategoryDto) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Service category not found');
    }

    const updated = await this.prisma.serviceCategory.update({
      where: { id: categoryId },
      data: {
        name: dto.name,
        description: dto.description,
        commissionRate: dto.commissionRate,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });

    return {
      message: 'Service category updated',
      category: {
        ...updated,
        commissionRate: Number(updated.commissionRate),
      },
    };
  }
}
