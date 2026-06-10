import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyPurpose, PropertyStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryPropertyDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PropertyPurpose })
  @IsOptional()
  @IsEnum(PropertyPurpose)
  purpose?: PropertyPurpose;

  @ApiPropertyOptional({ description: 'Subcategory ID' })
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
}
