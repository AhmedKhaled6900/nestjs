import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceListingStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  Allow,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

function optionalNumber() {
  return Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return undefined;
    }
    return Number(value);
  });
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
    description:
      'Menu for this listing. Send as JSON array or JSON string in multipart, e.g. [{"name":"بطاطا","price":40,"prepTimeMinutes":10}]',
    example: [{ name: 'بطاطا بالعسل', price: 40, prepTimeMinutes: 10 }],
  })
  @IsOptional()
  @Allow()
  menuItems?: unknown;

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

  @ApiPropertyOptional({
    enum: ServiceListingStatus,
    description: 'Provider may only set PAUSED to unpublish an active listing',
  })
  @IsOptional()
  @IsEnum(ServiceListingStatus)
  status?: ServiceListingStatus;

  @ApiPropertyOptional({
    description:
      'Replace listing menu. JSON array or JSON string. Omit to keep current menu.',
    example: [{ name: 'بطاطا بالعسل', price: 40, prepTimeMinutes: 10 }],
  })
  @IsOptional()
  @Allow()
  menuItems?: unknown;

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
