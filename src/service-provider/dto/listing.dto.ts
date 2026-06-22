import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceListingStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Min,
  ValidateNested,
  Allow,
} from 'class-validator';

function optionalNumber() {
  return Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return undefined;
    }
    return Number(value);
  });
}

function requiredNumber() {
  return Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return value;
    }
    return Number(value);
  });
}

function requiredInt() {
  return Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : value;
  });
}

function parseJsonArray(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }
  return value;
}

function parseMenuItems(value: unknown) {
  const parsed = parseJsonArray(value);
  if (!Array.isArray(parsed)) {
    return parsed;
  }

  return parsed.map((item) => {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const record = item as Record<string, unknown>;
    return {
      ...record,
      price:
        record.price === '' || record.price === undefined || record.price === null
          ? record.price
          : Number(record.price),
      prepTimeMinutes:
        record.prepTimeMinutes === '' ||
        record.prepTimeMinutes === undefined ||
        record.prepTimeMinutes === null
          ? record.prepTimeMinutes
          : Math.trunc(Number(record.prepTimeMinutes)),
      sortOrder:
        record.sortOrder === '' ||
        record.sortOrder === undefined ||
        record.sortOrder === null
          ? record.sortOrder
          : Math.trunc(Number(record.sortOrder)),
    };
  });
}

export class ListingMenuItemInputDto {
  @ApiPropertyOptional({
    description: 'Existing item id when updating listing menu (omit for new items)',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'بطاطا بالعسل' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 40 })
  @requiredNumber()
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 10, description: 'Preparation time in minutes' })
  @requiredInt()
  @IsInt()
  @Min(1)
  prepTimeMinutes!: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @requiredInt()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateListingDto {
  @ApiProperty({ example: 'عرض الصيف' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 15,
    description: 'Delivery fee when customer orders via this listing/ad',
  })
  @IsOptional()
  @optionalNumber()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @ApiPropertyOptional({
    example: 'https://example.com/promo',
    description: 'Optional external link for the ad',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'link must be a valid URL' })
  link?: string;

  @ApiPropertyOptional({
    description: 'Extra metadata (vehicle type, capacity, etc.)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.trim()) {
      try {
        return JSON.parse(value) as Record<string, unknown>;
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: [ListingMenuItemInputDto],
    description:
      'Menu for this listing/ad. In multipart send as JSON string, e.g. [{"name":"بطاطا","price":40,"prepTimeMinutes":10}]',
    example: [{ name: 'بطاطا بالعسل', price: 40, prepTimeMinutes: 10 }],
  })
  @IsOptional()
  @Transform(({ value }) => parseMenuItems(value))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListingMenuItemInputDto)
  menuItems?: ListingMenuItemInputDto[];

  /** Ignored on JSON body — file must be sent as multipart field `image` */
  @Allow()
  @IsOptional()
  image?: unknown;
}

export class UpdateListingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @optionalNumber()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @ApiPropertyOptional({ example: 'https://example.com/promo' })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'link must be a valid URL' })
  link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.trim()) {
      try {
        return JSON.parse(value) as Record<string, unknown>;
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ServiceListingStatus })
  @IsOptional()
  @IsEnum(ServiceListingStatus)
  status?: ServiceListingStatus;

  @ApiPropertyOptional({
    type: [ListingMenuItemInputDto],
    description:
      'Replace listing menu. In multipart send as JSON string. Omit to keep current menu.',
  })
  @IsOptional()
  @Transform(({ value }) => parseMenuItems(value))
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListingMenuItemInputDto)
  menuItems?: ListingMenuItemInputDto[];

  /** Ignored on JSON body — file must be sent as multipart field `image` */
  @Allow()
  @IsOptional()
  image?: unknown;
}

export class CreateListingMultipartDto extends CreateListingDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Listing image (required)' })
  image!: unknown;
}

export class UpdateListingMultipartDto extends UpdateListingDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Replace listing image' })
  image?: unknown;
}

export class UpdateProviderLogoMultipartDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Provider logo image' })
  logo!: unknown;
}
