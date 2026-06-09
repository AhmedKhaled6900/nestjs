import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyPurpose } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Modern 3BR Apartment in Nasr City' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title!: string;

  @ApiProperty({ example: 'Spacious apartment with balcony and parking.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  description!: string;

  @ApiProperty({ example: 2500000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty({ example: 'Cairo' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'Nasr City' })
  @IsString()
  @IsNotEmpty()
  area!: string;

  @ApiProperty({ example: '123 Abbas El Akkad Street' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiPropertyOptional({ example: 30.0626 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 31.3219 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({ example: 180, description: 'Area in square meters' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  areaSize?: number;

  @ApiProperty({ enum: PropertyPurpose, example: 'SALE' })
  @IsEnum(PropertyPurpose)
  purpose!: PropertyPurpose;

  @ApiProperty({ example: 'uuid-of-subcategory', description: 'Leaf subcategory ID' })
  @IsUUID()
  categoryId!: string;
}
