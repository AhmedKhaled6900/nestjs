import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileStatus, RoleName } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id!: string;

  @ApiProperty({ example: 'Ahmed Ali' })
  name!: string;

  @ApiProperty({ example: 'ahmed@example.com', nullable: true })
  email!: string | null;

  @ApiProperty({ example: '+201234567890', nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: RoleName, example: 'CUSTOMER' })
  role!: string;

  @ApiProperty({ example: false, description: 'Whether email has been verified' })
  isVerified!: boolean;

  @ApiPropertyOptional({
    description: 'True if owner submitted extended profile (not INCOMPLETE)',
    example: false,
  })
  isProfileComplete?: boolean;

  @ApiPropertyOptional({ enum: ProfileStatus, example: 'INCOMPLETE' })
  profileStatus?: string | null;

  @ApiPropertyOptional({ example: null, description: 'Set after profile completion' })
  ownerType?: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (15 min)' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token (7 days)' })
  refreshToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({
    type: [String],
    example: ['property.read', 'booking.create'],
    description: 'Permission actions for the user role (store in localStorage)',
  })
  permissions!: string[];
}

export class MeResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({
    type: [String],
    example: ['property.read', 'booking.create'],
    description: 'Permission actions for the user role',
  })
  permissions!: string[];
}

export class RegisterPendingResponseDto {
  @ApiProperty({ example: 'Registration successful. Please verify your email.' })
  message!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'OTP sent successfully' })
  message!: string;
}
