import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DashboardSummaryQueryDto {
  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsString()
  to?: string;
}

export class DashboardAnalyticsQueryDto extends DashboardSummaryQueryDto {
  @ApiPropertyOptional({ enum: ['daily', 'weekly'], default: 'daily' })
  @IsOptional()
  @IsString()
  groupBy?: 'daily' | 'weekly';
}
