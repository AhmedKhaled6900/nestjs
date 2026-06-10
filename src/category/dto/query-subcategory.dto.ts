import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QuerySubcategoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by main (parent) category UUID',
    example: 'uuid-of-residential',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
