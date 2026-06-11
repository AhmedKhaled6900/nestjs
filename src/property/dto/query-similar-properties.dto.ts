import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyPurpose } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QuerySimilarPropertiesDto extends PaginationQueryDto {
  @ApiProperty({ example: 'New Cairo' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({
    description: 'Subcategory UUID (e.g. apartment)',
    example: 'uuid-of-apartment',
  })
  @ValidateIf((dto: QuerySimilarPropertiesDto) => !dto.type)
  @IsUUID()
  subcategoryId?: string;

  @ApiPropertyOptional({
    description: 'Subcategory slug or name (e.g. apartment, Apartment)',
    example: 'apartment',
  })
  @ValidateIf((dto: QuerySimilarPropertiesDto) => !dto.subcategoryId)
  @IsString()
  @IsNotEmpty()
  type?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiProperty({ example: 3000000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ enum: PropertyPurpose, example: 'SALE' })
  @IsOptional()
  @IsEnum(PropertyPurpose)
  purpose?: PropertyPurpose;

  @ApiPropertyOptional({
    description: 'Exclude a property (e.g. the one currently viewed)',
  })
  @IsOptional()
  @IsUUID()
  excludePropertyId?: string;
}
