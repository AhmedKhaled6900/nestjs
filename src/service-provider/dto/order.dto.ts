import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceOrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class OrderMenuItemDto {
  @ApiProperty({ description: 'Profile menu item id' })
  @IsUUID()
  menuItemId!: string;

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
  @ApiProperty({ description: 'Service provider profile id' })
  @IsUUID()
  providerId!: string;

  @ApiPropertyOptional({
    description: 'Optional listing/ad attribution if customer came from a specific ad',
  })
  @IsOptional()
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

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

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
