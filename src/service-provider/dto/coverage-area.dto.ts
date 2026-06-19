import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCoverageAreaDto {
  @ApiProperty({ example: 'الإسكندرية' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({
    example: 'سيدي بشر',
    description: 'Omit or null for whole-city coverage',
  })
  @IsOptional()
  @IsString()
  area?: string;
}

export class UpdateCoverageAreaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
