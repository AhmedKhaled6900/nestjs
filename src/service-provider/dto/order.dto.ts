import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceOrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class OrderMenuItemDto {
  @ApiPropertyOptional({
    description:
      'Menu item id. For profile orders: profile menu item id. For listing orders: id from listing.menuItems[]',
  })
  @ValidateIf((item: OrderMenuItemDto) => !item.name)
  @IsUUID()
  menuItemId?: string;

  @ApiPropertyOptional({
    description: 'Fallback: match active profile menu item by name',
  })
  @ValidateIf((item: OrderMenuItemDto) => !item.menuItemId)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateServiceOrderDto {
  @ApiPropertyOptional({
    description: 'Service provider profile id (required unless listingId is sent)',
  })
  @ValidateIf((dto: CreateServiceOrderDto) => !dto.listingId)
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({
    description: 'Listing/ad id — providerId can be derived from this',
  })
  @ValidateIf((dto: CreateServiceOrderDto) => !dto.providerId)
  @IsUUID()
  listingId?: string;

  @ApiProperty({ type: [OrderMenuItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderMenuItemDto)
  items!: OrderMenuItemDto[];

  @ApiProperty({ example: 'الإسكندرية' })
  @IsString()
  @IsNotEmpty()
  deliveryCity!: string;

  @ApiPropertyOptional({ example: 'سيدي بشر' })
  @IsOptional()
  @IsString()
  deliveryArea?: string;

  @ApiProperty({ example: 'شارع الكورنيش 12' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateServiceOrderStatusDto {
  @ApiProperty({ enum: ServiceOrderStatus })
  @IsEnum(ServiceOrderStatus)
  status!: ServiceOrderStatus;
}

export class QueryProviderOrdersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ServiceOrderStatus })
  @IsOptional()
  @IsEnum(ServiceOrderStatus)
  status?: ServiceOrderStatus;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsString()
  to?: string;
}

export class RejectOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
