import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceLeadStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateServiceLeadDto {
  @ApiProperty()
  @IsUUID()
  providerId!: string;

  @ApiProperty({ example: 'microbus' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ example: 'الإسكندرية' })
  @IsString()
  @IsNotEmpty()
  pickupCity!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickupArea?: string;

  @ApiProperty({ example: 'مارينا' })
  @IsString()
  @IsNotEmpty()
  destination!: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  passengers?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  preferredDateTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateServiceLeadStatusDto {
  @ApiProperty({ enum: ServiceLeadStatus })
  @IsEnum(ServiceLeadStatus)
  status!: ServiceLeadStatus;
}

export class QueryProviderLeadsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ServiceLeadStatus })
  @IsOptional()
  @IsEnum(ServiceLeadStatus)
  status?: ServiceLeadStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string;
}
