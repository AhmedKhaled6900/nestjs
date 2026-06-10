import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import {
  EmailVerificationFilter,
  ProfileCompletionFilter,
} from '../enums/admin-user.enums';

export class QueryAdminCustomersDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: EmailVerificationFilter,
    description: 'Filter by email verification status',
  })
  @IsOptional()
  @IsEnum(EmailVerificationFilter)
  emailVerification?: EmailVerificationFilter;

  @ApiPropertyOptional({
    enum: ProfileCompletionFilter,
    description:
      'For customers: same as email verification (no KYC profile). COMPLETE = verified email.',
  })
  @IsOptional()
  @IsEnum(ProfileCompletionFilter)
  profileCompletion?: ProfileCompletionFilter;
}

export class QueryAdminOwnersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EmailVerificationFilter })
  @IsOptional()
  @IsEnum(EmailVerificationFilter)
  emailVerification?: EmailVerificationFilter;

  @ApiPropertyOptional({
    enum: ProfileCompletionFilter,
    description: 'COMPLETE = submitted KYC (not INCOMPLETE). INCOMPLETE = never submitted.',
  })
  @IsOptional()
  @IsEnum(ProfileCompletionFilter)
  profileCompletion?: ProfileCompletionFilter;

  @ApiPropertyOptional({
    enum: ProfileStatus,
    description: 'Filter by exact owner profile status',
  })
  @IsOptional()
  @IsEnum(ProfileStatus)
  profileStatus?: ProfileStatus;
}
