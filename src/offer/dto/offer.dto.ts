import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfferStatus, PricePeriod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CreateOfferDto {
  @ApiProperty({ example: 2800000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty({
    enum: PricePeriod,
    example: 'MONTH',
    description: 'Offer duration: per day, month, or year',
  })
  @IsEnum(PricePeriod)
  pricePeriod!: PricePeriod;

  @ApiPropertyOptional({ example: 'Flexible move-in date, willing to pay upfront.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CounterOfferDto extends CreateOfferDto {}

export class QueryOwnerOffersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by property UUID' })
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional({ enum: OfferStatus })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;
}

export class RejectOfferDto {
  @ApiPropertyOptional({ example: 'Price is too low for this unit.' })
  @IsOptional()
  @IsString()
  reason?: string;
}
