import { ApiPropertyOptional } from '@nestjs/swagger';
import { PricePeriod, PropertyPurpose, PropertyStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class PropertyCategoryFilterDto {
  @ApiPropertyOptional({
    description: 'Main category UUID — returns properties in all its subcategories',
    example: 'uuid-of-residential',
  })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @ApiPropertyOptional({
    description: 'Subcategory UUID (leaf category)',
    example: 'uuid-of-apartment',
  })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @ApiPropertyOptional({
    description: 'Alias for subcategoryId (backward compatible)',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class QueryPropertyDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PropertyPurpose })
  @IsOptional()
  @IsEnum(PropertyPurpose)
  purpose?: PropertyPurpose;

  @ApiPropertyOptional({
    enum: PricePeriod,
    description: 'Filter rent listings by billing period (use with purpose=RENT)',
  })
  @IsOptional()
  @IsEnum(PricePeriod)
  pricePeriod?: PricePeriod;

  @ApiPropertyOptional({
    description: 'Main category UUID — all subcategories under it',
  })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @ApiPropertyOptional({ description: 'Subcategory UUID only' })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @ApiPropertyOptional({ description: 'Alias for subcategoryId' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Cairo' })
  @IsOptional()
  @IsString()
  city?: string;
}

export class QueryOwnerPropertyDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PropertyStatus })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({ description: 'Main category UUID' })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @ApiPropertyOptional({ description: 'Subcategory UUID' })
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @ApiPropertyOptional({ description: 'Alias for subcategoryId' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
