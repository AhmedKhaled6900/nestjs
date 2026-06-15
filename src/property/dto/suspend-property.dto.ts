import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SuspendPropertyDto {
  @ApiPropertyOptional({
    example: 'Listing violates platform policy',
    description: 'Optional reason shown to the owner',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
