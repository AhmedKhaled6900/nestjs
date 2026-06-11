import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PricePeriod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-of-property' })
  @IsUUID()
  propertyId!: string;

  @ApiProperty({
    example: 12,
    description: 'Rental length in units of pricePeriod (e.g. 12 months)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration!: number;

  @ApiPropertyOptional({
    enum: PricePeriod,
    description: 'Defaults to the property listing pricePeriod',
  })
  @IsOptional()
  @IsEnum(PricePeriod)
  pricePeriod?: PricePeriod;

  @ApiPropertyOptional({ example: 'Move-in from next week.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
