import {
  Body,
  Controller,
  Delete,
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
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { AuthUser } from '../../auth/interfaces/auth.interface';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { MAX_KYC_IMAGE_SIZE_BYTES } from '../../upload/upload.constants';
import {
  CreateProviderProfileDto,
  ProviderKycUploadedFiles,
  RejectProviderProfileDto,
  SubmitProviderProfileDto,
  SuspendProviderDto,
  UpdateProviderProfileDto,
} from '../dto/provider-profile.dto';
import { ProviderProfileService } from '../services/provider-profile.service';

const providerKycUpload = FileFieldsInterceptor(
  [
    { name: 'logo', maxCount: 1 },
    { name: 'nationalId', maxCount: 1 },
    { name: 'commercialRegister', maxCount: 1 },
  ],
  {
    storage: memoryStorage(),
    limits: { fileSize: MAX_KYC_IMAGE_SIZE_BYTES },
  },
);

@ApiTags('Provider Profile')
@ApiBearerAuth('access-token')
@Controller('provider/profile')
export class ProviderProfileController {
  constructor(private readonly providerProfileService: ProviderProfileService) {}

  @Get()
  @RequirePermissions('provider.profile.read')
  @ApiOperation({ summary: 'Get my service provider profile' })
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.providerProfileService.getMyProfile(user.id);
  }

  @Post()
  @RequirePermissions('provider.profile.update')
  @ApiOperation({ summary: 'Create service provider profile' })
  createProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProviderProfileDto,
  ) {
    return this.providerProfileService.createProfile(user.id, dto);
  }

  @Patch()
  @RequirePermissions('provider.profile.update')
  @ApiOperation({ summary: 'Update service provider profile' })
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProviderProfileDto,
  ) {
    return this.providerProfileService.updateProfile(user.id, dto);
  }

  @Post('submit')
  @RequirePermissions('provider.profile.update')
  @UseInterceptors(providerKycUpload)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit provider profile for admin review' })
  submitProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitProviderProfileDto,
    @UploadedFiles() files: ProviderKycUploadedFiles,
  ) {
    return this.providerProfileService.submitForReview(user.id, dto, files);
  }
}

@ApiTags('Admin - Service Providers')
@ApiBearerAuth('access-token')
@Controller('admin/providers')
export class AdminProviderController {
  constructor(private readonly providerProfileService: ProviderProfileService) {}

  @Get('pending')
  @RequirePermissions('provider.review')
  @ApiOperation({ summary: 'List pending service provider profiles' })
  listPending(@Query() query: PaginationQueryDto) {
    return this.providerProfileService.listPendingProfiles(query);
  }

  @Patch(':userId/approve')
  @RequirePermissions('provider.review')
  @ApiOperation({ summary: 'Approve service provider' })
  approve(@Param('userId') userId: string) {
    return this.providerProfileService.approveProfile(userId);
  }

  @Patch(':userId/reject')
  @RequirePermissions('provider.review')
  @ApiOperation({ summary: 'Reject service provider' })
  reject(
    @Param('userId') userId: string,
    @Body() dto: RejectProviderProfileDto,
  ) {
    return this.providerProfileService.rejectProfile(userId, dto.reason);
  }

  @Patch(':userId/suspend')
  @RequirePermissions('provider.review')
  @ApiOperation({ summary: 'Suspend service provider' })
  suspend(
    @Param('userId') userId: string,
    @Body() dto: SuspendProviderDto,
  ) {
    return this.providerProfileService.suspendProfile(userId, dto.reason);
  }
}
