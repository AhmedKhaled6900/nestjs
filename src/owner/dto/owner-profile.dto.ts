import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { OwnerType } from '@prisma/client';

export class CompleteOwnerProfileDto {
  @ApiProperty({ enum: OwnerType, example: 'INDIVIDUAL' })
  @IsEnum(OwnerType)
  ownerType!: OwnerType;

  @ApiPropertyOptional({ example: 'شركة العقارات المتميزة' })
  @ValidateIf((o: CompleteOwnerProfileDto) => o.ownerType === OwnerType.COMPANY)
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @ApiPropertyOptional({ example: '+201098765432' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'owner@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Cairo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Nasr City' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ example: 'Experienced property owner with 10+ years.' })
  @IsOptional()
  @IsString()
  bio?: string;
}

export class RejectOwnerProfileDto {
  @ApiProperty({ example: 'Invalid commercial register document' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export type KycUploadedFiles = {
  nationalId?: Express.Multer.File[];
  taxNumber?: Express.Multer.File[];
  commercialRegister?: Express.Multer.File[];
};

export class CompleteOwnerProfileMultipartDto extends CompleteOwnerProfileDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'National ID card image — required for INDIVIDUAL',
  })
  nationalId?: unknown;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Tax card image — required for COMPANY',
  })
  taxNumber?: unknown;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Commercial register image — required for COMPANY',
  })
  commercialRegister?: unknown;
}
