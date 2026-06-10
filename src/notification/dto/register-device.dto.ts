import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    example: 'fcm-device-token-from-firebase-sdk',
    description: 'FCM registration token from Firebase Messaging SDK on client',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiPropertyOptional({ example: 'web', enum: ['web', 'android', 'ios'] })
  @IsOptional()
  @IsIn(['web', 'android', 'ios'])
  platform?: string;
}
