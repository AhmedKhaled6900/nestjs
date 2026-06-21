import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceListingStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateListingDto {
  @ApiProperty({ example: 'منيو المطعم' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Extra metadata (vehicle type, capacity, etc.)',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ServiceListingStatus })
  @IsOptional()
  @IsEnum(ServiceListingStatus)
  status?: ServiceListingStatus;
}
