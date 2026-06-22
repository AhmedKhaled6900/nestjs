import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceListingStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryAdminListingsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ServiceListingStatus })
  @IsOptional()
  @IsEnum(ServiceListingStatus)
  status?: ServiceListingStatus;

  @ApiPropertyOptional({ description: 'Filter featured listings only' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  featured?: boolean;
}

export class RejectListingDto {
  @ApiProperty({ example: 'الصورة غير واضحة أو المحتوى مخالف' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class SetListingFeaturedDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isFeatured!: boolean;
}
