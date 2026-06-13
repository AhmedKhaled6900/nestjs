import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AttributeScope, AttributeType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  Allow,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateAttributeDto {
  @ApiProperty({ example: 'Elevator' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'elevator' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers, and hyphens only',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  slug!: string;

  @ApiProperty({ enum: AttributeType, example: 'BOOLEAN' })
  @IsEnum(AttributeType)
  type!: AttributeType;

  @ApiProperty({
    enum: AttributeScope,
    example: 'SYSTEM',
    description: 'SYSTEM = platform-wide (admin). COMPANY = per company (future).',
  })
  @IsEnum(AttributeScope)
  scope!: AttributeScope;

  @ApiPropertyOptional({
    example: ['Fully finished', 'Semi-finished', 'Core & shell'],
    description: 'Required for SELECT and MULTI_SELECT types',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Required when scope is COMPANY' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAttributeDto extends PartialType(CreateAttributeDto) {}

export class QueryAttributeDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: AttributeScope })
  @IsOptional()
  @IsEnum(AttributeScope)
  scope?: AttributeScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

export class QueryAttributeSelectMenuDto {
  @ApiPropertyOptional({
    enum: AttributeScope,
    default: 'SYSTEM',
    description: 'Defaults to SYSTEM (for linking to subcategories)',
  })
  @IsOptional()
  @IsEnum(AttributeScope)
  scope?: AttributeScope;

  @ApiPropertyOptional({
    description: 'When omitted on admin route, inactive attributes are included',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}

export class SubcategoryAttributeLinkDto {
  @ApiProperty({ example: 'clxyz123attributeid' })
  @IsString()
  @IsNotEmpty()
  attributeId!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SyncSubcategoryAttributesDto {
  @ApiProperty({ type: [SubcategoryAttributeLinkDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubcategoryAttributeLinkDto)
  items!: SubcategoryAttributeLinkDto[];
}

export class PropertyAttributeValueInputDto {
  @ApiProperty({ example: 'clxyz123attributeid' })
  @IsString()
  @IsNotEmpty()
  attributeId!: string;

  @ApiProperty({
    description: 'Value shape depends on attribute type (string, number, boolean, array)',
    example: true,
  })
  @Allow()
  value!: unknown;
}

export class PropertyCustomAttributeInputDto {
  @ApiProperty({ example: 'Private rooftop access' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: AttributeType, example: 'TEXT' })
  @IsEnum(AttributeType)
  type!: AttributeType;

  @ApiPropertyOptional({
    description: 'Options when type is SELECT or MULTI_SELECT',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({ example: 'Available on weekends only' })
  @Allow()
  value!: unknown;
}

export class PropertyAttributesInputDto {
  @ApiPropertyOptional({ type: [PropertyAttributeValueInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyAttributeValueInputDto)
  attributes?: PropertyAttributeValueInputDto[];

  @ApiPropertyOptional({
    type: [PropertyCustomAttributeInputDto],
    description: 'Attributes specific to this property only (not in system catalog)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => PropertyCustomAttributeInputDto)
  customAttributes?: PropertyCustomAttributeInputDto[];
}
