import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PropertyStatus, RoleName } from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EngagementHelperService {
  constructor(private readonly prisma: PrismaService) {}

  assertAuthorOrAdmin(user: AuthUser, authorId: string): void {
    if (user.role === RoleName.ADMIN) {
      return;
    }

    if (user.id !== authorId) {
      throw new ForbiddenException('You can only modify your own content');
    }
  }

  assertCustomer(user: AuthUser): void {
    if (user.role !== RoleName.CUSTOMER && user.role !== RoleName.ADMIN) {
      throw new ForbiddenException('Only customers can perform this action');
    }
  }

  async assertApprovedProperty(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, status: true, ownerId: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== PropertyStatus.APPROVED) {
      throw new BadRequestException(
        'This action is only allowed on approved properties',
      );
    }

    return property;
  }

  assertNotPropertyOwner(userId: string, ownerId: string): void {
    if (userId === ownerId) {
      throw new BadRequestException('You cannot review or comment on your own property');
    }
  }
}
