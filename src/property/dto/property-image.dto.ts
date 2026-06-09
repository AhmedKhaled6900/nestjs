import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UploadPropertyImagesDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'One or more property images (JPEG/PNG/WebP, max 10 MB each)',
  })
  images!: unknown;

  @ApiPropertyOptional({
    example: 0,
    description: 'Index of uploaded file to mark as primary (0-based)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  primaryIndex?: number;
}

export class UpdatePropertyImageDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class RejectPropertyDto {
  @ApiProperty({ example: 'Images are unclear or listing details are incomplete' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
