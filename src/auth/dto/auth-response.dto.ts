import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';

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
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (15 min)' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token (7 days)' })
  refreshToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'OTP sent successfully' })
  message!: string;
}
