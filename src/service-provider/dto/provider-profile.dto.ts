import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProviderProfileDto {
  @ApiProperty({ example: 'مطعم البحر' })
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @ApiProperty({ description: 'Service category ID' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  @IsOptional()
  @IsString()
  whatsapp?: string;
}

export class UpdateProviderProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsapp?: string;
}

export class SubmitProviderProfileDto {
  @ApiPropertyOptional({ description: 'National ID document URL if already uploaded' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Commercial register document URL if already uploaded' })
  @IsOptional()
  @IsString()
  commercialRegister?: string;
}

export class RejectProviderProfileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class SuspendProviderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export type ProviderKycUploadedFiles = {
  nationalId?: Express.Multer.File[];
  commercialRegister?: Express.Multer.File[];
  logo?: Express.Multer.File[];
};
