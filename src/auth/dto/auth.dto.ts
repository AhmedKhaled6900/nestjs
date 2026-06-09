import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { RoleName } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Ahmed Ali' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+201234567890' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    enum: [RoleName.CUSTOMER, RoleName.OWNER],
    example: 'CUSTOMER',
    description: 'CUSTOMER or OWNER only',
  })
  @IsEnum(RoleName)
  role!: RoleName;
}

export class LoginDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token from login/register response' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiPropertyOptional({ example: 'ahmed@example.com', description: 'Required if phone is not provided' })
  @ValidateIf((o: ForgotPasswordDto) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+201234567890', description: 'Required if email is not provided' })
  @ValidateIf((o: ForgotPasswordDto) => !o.email)
  @IsString()
  @IsNotEmpty()
  phone?: string;
}

export class VerifyResetOtpDto {
  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @ValidateIf((o: VerifyResetOtpDto) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  @ValidateIf((o: VerifyResetOtpDto) => !o.email)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class ResetPasswordDto {
  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @ValidateIf((o: ResetPasswordDto) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  @ValidateIf((o: ResetPasswordDto) => !o.email)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'newPassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit code from verification email' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email!: string;
}
