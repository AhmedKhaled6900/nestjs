import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Is parking included?' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  body!: string;
}

export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 'Updated comment text.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  body?: string;
}
