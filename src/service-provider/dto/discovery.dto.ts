import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryProvidersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'الإسكندرية' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'سيدي بشر' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Service category slug or ID' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class QueryFeaturedListingsDto extends PaginationQueryDto {}
