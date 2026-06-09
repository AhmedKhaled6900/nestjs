import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PropertyImage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MAX_PROPERTY_IMAGES } from '../upload/upload.constants';
import { UploadService } from '../upload/upload.service';
import { UpdatePropertyImageDto } from './dto/property-image.dto';
import { PropertyService } from './property.service';

@Injectable()
export class PropertyImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly propertyService: PropertyService,
  ) {}

  async uploadImages(
    propertyId: string,
    ownerId: string,
    files: Express.Multer.File[],
    primaryIndex = 0,
  ) {
    const property = await this.propertyService.findOwnedEditableProperty(
      propertyId,
      ownerId,
    );

    if (!files.length) {
      throw new BadRequestException('At least one image file is required');
    }

    const existingCount = property.images.length;
    if (existingCount + files.length > MAX_PROPERTY_IMAGES) {
      throw new BadRequestException(
        `A property can have at most ${MAX_PROPERTY_IMAGES} images`,
      );
    }

    const hasPrimary = property.images.some((image) => image.isPrimary);
    const shouldSetPrimary =
      !hasPrimary || primaryIndex >= 0;

    if (shouldSetPrimary && !hasPrimary && primaryIndex >= files.length) {
      throw new BadRequestException('primaryIndex is out of range');
    }

    const createdImages: PropertyImage[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const imageUrl = await this.uploadService.savePropertyImage(
        file,
        property.id,
      );
      const order = existingCount + index;
      const isPrimary = !hasPrimary && index === primaryIndex;

      if (isPrimary) {
        await this.clearPrimary(property.id);
      }

      const image = await this.prisma.propertyImage.create({
        data: {
          propertyId: property.id,
          imageUrl,
          order,
          isPrimary,
        },
      });

      createdImages.push(image);
    }

    const updated = await this.prisma.property.findUniqueOrThrow({
      where: { id: property.id },
      include: {
        category: {
          select: { id: true, name: true, slug: true, parentId: true },
        },
        images: { orderBy: { order: 'asc' } },
      },
    });

    return {
      message: 'Images uploaded successfully',
      images: this.propertyService
        .mapProperty(updated)
        .images.filter((image) =>
          createdImages.some((created) => created.id === image.id),
        ),
      property: this.propertyService.mapProperty(updated),
    };
  }

  async updateImage(
    propertyId: string,
    imageId: string,
    ownerId: string,
    dto: UpdatePropertyImageDto,
  ) {
    await this.propertyService.findOwnedEditableProperty(propertyId, ownerId);

    const image = await this.findOwnedImage(propertyId, imageId);

    if (dto.order !== undefined) {
      const conflict = await this.prisma.propertyImage.findFirst({
        where: {
          propertyId,
          order: dto.order,
          NOT: { id: imageId },
        },
      });

      if (conflict) {
        throw new BadRequestException('Another image already uses this order');
      }
    }

    if (dto.isPrimary) {
      await this.clearPrimary(propertyId);
    }

    const updated = await this.prisma.propertyImage.update({
      where: { id: image.id },
      data: {
        ...(dto.isPrimary !== undefined ? { isPrimary: dto.isPrimary } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });

    return {
      message: 'Image updated successfully',
      image: this.toPublicImage(updated),
    };
  }

  async removeImage(propertyId: string, imageId: string, ownerId: string) {
    await this.propertyService.findOwnedEditableProperty(propertyId, ownerId);

    const image = await this.findOwnedImage(propertyId, imageId);
    await this.uploadService.deleteLocalFile(image.imageUrl);
    await this.prisma.propertyImage.delete({ where: { id: image.id } });

    const remaining = await this.prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: { order: 'asc' },
    });

    for (let index = 0; index < remaining.length; index += 1) {
      await this.prisma.propertyImage.update({
        where: { id: remaining[index].id },
        data: { order: index },
      });
    }

    if (remaining.length > 0 && !remaining.some((item) => item.isPrimary)) {
      await this.prisma.propertyImage.update({
        where: { id: remaining[0].id },
        data: { isPrimary: true },
      });
    }

    return { message: 'Image deleted successfully' };
  }

  private async findOwnedImage(propertyId: string, imageId: string) {
    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId },
    });

    if (!image) {
      throw new NotFoundException('Property image not found');
    }

    return image;
  }

  private async clearPrimary(propertyId: string): Promise<void> {
    await this.prisma.propertyImage.updateMany({
      where: { propertyId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  private toPublicImage(image: {
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    order: number;
  }) {
    const appUrl = this.propertyService.getAppUrl();

    return {
      id: image.id,
      imageUrl: this.uploadService.toPublicUrl(image.imageUrl, appUrl),
      isPrimary: image.isPrimary,
      order: image.order,
    };
  }
}
