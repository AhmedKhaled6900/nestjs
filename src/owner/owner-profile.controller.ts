import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthUser } from '../auth/interfaces/auth.interface';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { MAX_KYC_IMAGE_SIZE_BYTES } from '../upload/upload.constants';
import {
  CompleteOwnerProfileDto,
  CompleteOwnerProfileMultipartDto,
  KycUploadedFiles,
  RejectOwnerProfileDto,
} from './dto/owner-profile.dto';
import { OwnerProfileService } from './owner-profile.service';

const kycUploadInterceptor = FileFieldsInterceptor(
  [
    { name: 'nationalId', maxCount: 1 },
    { name: 'taxNumber', maxCount: 1 },
    { name: 'commercialRegister', maxCount: 1 },
  ],
  {
    storage: memoryStorage(),
    limits: { fileSize: MAX_KYC_IMAGE_SIZE_BYTES },
  },
);

@ApiTags('Owner Profile')
@ApiBearerAuth('access-token')
@Controller('owner/profile')
export class OwnerProfileController {
  constructor(private readonly ownerProfileService: OwnerProfileService) {}

  @Get()
  @RequirePermissions('owner.profile.read')
  @ApiOperation({ summary: 'Get my owner profile' })
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.ownerProfileService.getMyProfile(user.id);
  }

  @Post('complete')
  @RequirePermissions('owner.profile.update')
  @UseInterceptors(kycUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CompleteOwnerProfileMultipartDto })
  @ApiOperation({
    summary: 'Complete owner profile (individual or company)',
    description:
      'Submit or update KYC documents as images. Sets profileStatus → KYC_PENDING. Can resubmit while pending or after rejection.',
  })
  @ApiResponse({ status: 200, description: 'Profile submitted' })
  completeProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: CompleteOwnerProfileDto,
    @UploadedFiles() files: KycUploadedFiles,
  ) {
    return this.ownerProfileService.completeProfile(user.id, dto, files);
  }
}

@ApiTags('Admin - Owner Review')
@ApiBearerAuth('access-token')
@Controller('admin/owners')
export class AdminOwnerController {
  constructor(private readonly ownerProfileService: OwnerProfileService) {}

  @Get('pending')
  @RequirePermissions('owner.review')
  @ApiOperation({
    summary: 'List owners needing admin attention (paginated)',
    description:
      'Returns owners with KYC_PENDING or email not verified (isVerified=false). ' +
      'Use pendingType: KYC_REVIEW | EMAIL_NOT_VERIFIED. Approve/reject only applies to KYC_REVIEW.',
  })
  listPending(@Query() query: PaginationQueryDto) {
    return this.ownerProfileService.listPendingProfiles(query);
  }

  @Patch(':userId/approve')
  @RequirePermissions('owner.review')
  @ApiOperation({ summary: 'Approve owner profile' })
  approve(@Param('userId') userId: string) {
    return this.ownerProfileService.approveProfile(userId);
  }

  @Patch(':userId/reject')
  @RequirePermissions('owner.review')
  @ApiOperation({ summary: 'Reject owner profile' })
  reject(
    @Param('userId') userId: string,
    @Body() dto: RejectOwnerProfileDto,
  ) {
    return this.ownerProfileService.rejectProfile(userId, dto.reason);
  }
}
