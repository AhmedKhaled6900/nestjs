import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCoverageAreaDto,
  UpdateCoverageAreaDto,
} from '../dto/coverage-area.dto';
import {
  assertProviderCanManage,
  getProviderProfileOrFail,
} from '../helpers/provider.helpers';

@Injectable()
export class ProviderCoverageService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyCoverageAreas(userId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);

    const areas = await this.prisma.serviceCoverageArea.findMany({
      where: { providerId: profile.id },
      orderBy: [{ city: 'asc' }, { area: 'asc' }],
    });

    return { items: areas };
  }

  async createCoverageArea(userId: string, dto: CreateCoverageAreaDto) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    const area = dto.area?.trim() || null;

    const existing = await this.prisma.serviceCoverageArea.findFirst({
      where: { providerId: profile.id, city: dto.city, area },
    });

    if (existing) {
      throw new BadRequestException('Coverage area already exists');
    }

    const created = await this.prisma.serviceCoverageArea.create({
      data: {
        providerId: profile.id,
        city: dto.city,
        area,
      },
    });

    return { message: 'Coverage area added', area: created };
  }

  async updateCoverageArea(
    userId: string,
    areaId: string,
    dto: UpdateCoverageAreaDto,
  ) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    const area = await this.findOwnedAreaOrFail(profile.id, areaId);

    const updated = await this.prisma.serviceCoverageArea.update({
      where: { id: area.id },
      data: { isActive: dto.isActive },
    });

    return { message: 'Coverage area updated', area: updated };
  }

  async deleteCoverageArea(userId: string, areaId: string) {
    const profile = await getProviderProfileOrFail(this.prisma, userId);
    assertProviderCanManage(profile);

    const area = await this.findOwnedAreaOrFail(profile.id, areaId);

    await this.prisma.serviceCoverageArea.delete({ where: { id: area.id } });

    return { message: 'Coverage area removed' };
  }

  private async findOwnedAreaOrFail(providerId: string, areaId: string) {
    const area = await this.prisma.serviceCoverageArea.findFirst({
      where: { id: areaId, providerId },
    });

    if (!area) {
      throw new NotFoundException('Coverage area not found');
    }

    return area;
  }
}
