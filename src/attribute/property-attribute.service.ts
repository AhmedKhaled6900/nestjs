import { BadRequestException, Injectable } from '@nestjs/common';
import { AttributeType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PropertyAttributesInputDto,
  PropertyCustomAttributeInputDto,
} from './dto/attribute.dto';
import { AttributeService } from './attribute.service';

@Injectable()
export class PropertyAttributeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attributeService: AttributeService,
  ) {}

  async replaceForProperty(
    propertyId: string,
    subcategoryId: string,
    input?: PropertyAttributesInputDto,
  ) {
    const attributes = input?.attributes ?? [];
    const customAttributes = input?.customAttributes ?? [];

    const linked = await this.attributeService.assertSubcategoryAttributesValid(
      subcategoryId,
      attributes.map((item) => item.attributeId),
      { requireAllRequired: true },
    );

    const attributeById = new Map(linked.map((item) => [item.id, item]));

    for (const item of attributes) {
      const definition = attributeById.get(item.attributeId);
      if (!definition) {
        continue;
      }
      this.validateValue(definition.type, definition.options, item.value);
    }

    for (const item of customAttributes) {
      this.validateCustomAttribute(item);
    }

    await this.prisma.$transaction([
      this.prisma.propertyAttributeValue.deleteMany({ where: { propertyId } }),
      ...attributes.map((item) =>
        this.prisma.propertyAttributeValue.create({
          data: {
            propertyId,
            attributeId: item.attributeId,
            value: item.value as Prisma.InputJsonValue,
          },
        }),
      ),
      ...customAttributes.map((item) =>
        this.prisma.propertyAttributeValue.create({
          data: {
            propertyId,
            attributeId: null,
            customName: item.name.trim(),
            customType: item.type,
            value: item.value as Prisma.InputJsonValue,
          },
        }),
      ),
    ]);
  }

  async findForProperty(propertyId: string) {
    const values = await this.prisma.propertyAttributeValue.findMany({
      where: { propertyId },
      include: { attribute: true },
      orderBy: { id: 'asc' },
    });

    return {
      system: values
        .filter((item) => item.attributeId && item.attribute)
        .map((item) => ({
          id: item.id,
          attributeId: item.attributeId,
          name: item.attribute!.name,
          slug: item.attribute!.slug,
          type: item.attribute!.type,
          value: item.value,
        })),
      custom: values
        .filter((item) => !item.attributeId)
        .map((item) => ({
          id: item.id,
          name: item.customName,
          type: item.customType,
          value: item.value,
        })),
    };
  }

  private validateCustomAttribute(item: PropertyCustomAttributeInputDto) {
    if (!item.name?.trim()) {
      throw new BadRequestException('custom attribute name is required');
    }

    const options =
      item.type === AttributeType.SELECT ||
      item.type === AttributeType.MULTI_SELECT
        ? item.options
        : undefined;

    if (
      item.type === AttributeType.SELECT ||
      item.type === AttributeType.MULTI_SELECT
    ) {
      if (!options?.length) {
        throw new BadRequestException(
          'custom attribute options are required for SELECT types',
        );
      }
    }

    this.validateValue(item.type, options ?? null, item.value);
  }

  private validateValue(
    type: AttributeType,
    options: string[] | null,
    value: unknown,
  ) {
    switch (type) {
      case AttributeType.TEXT:
      case AttributeType.DATE:
        if (typeof value !== 'string' || !value.trim()) {
          throw new BadRequestException(`Expected non-empty string for ${type}`);
        }
        break;
      case AttributeType.NUMBER:
        if (typeof value !== 'number' || Number.isNaN(value)) {
          throw new BadRequestException('Expected number value');
        }
        break;
      case AttributeType.BOOLEAN:
        if (typeof value !== 'boolean') {
          throw new BadRequestException('Expected boolean value');
        }
        break;
      case AttributeType.SELECT:
        if (typeof value !== 'string' || !options?.includes(value)) {
          throw new BadRequestException('Invalid SELECT value');
        }
        break;
      case AttributeType.MULTI_SELECT:
        if (
          !Array.isArray(value) ||
          !value.every((entry) => typeof entry === 'string') ||
          !value.every((entry) => options?.includes(entry))
        ) {
          throw new BadRequestException('Invalid MULTI_SELECT value');
        }
        break;
      default:
        throw new BadRequestException(`Unsupported attribute type: ${type}`);
    }
  }
}
