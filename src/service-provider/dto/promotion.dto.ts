import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderPromotionType } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProviderPromotionDto {
  @ApiProperty({ enum: ProviderPromotionType })
  @IsEnum(ProviderPromotionType)
  type!: ProviderPromotionType;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class ConfirmPromotionPaymentDto {
  @ApiProperty({ description: 'Paymob order/transaction reference' })
  @IsString()
  @IsNotEmpty()
  paymobOrderId!: string;
}
