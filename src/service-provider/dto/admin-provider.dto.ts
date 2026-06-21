import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceProviderStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryAdminProvidersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ServiceProviderStatus })
  @IsOptional()
  @IsEnum(ServiceProviderStatus)
  status?: ServiceProviderStatus;
}
