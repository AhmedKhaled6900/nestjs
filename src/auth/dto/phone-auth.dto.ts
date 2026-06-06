import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendPhoneOtpDto {
  @ApiProperty({ example: '+201234567890' })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class VerifyPhoneOtpDto {
  @ApiProperty({ example: '+201234567890' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP from SMS' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Ahmed Ali', description: 'Used when auto-registering a new user' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}
