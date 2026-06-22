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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
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
import {
  UpdateProviderLogoMultipartDto,
} from '../dto/listing.dto';
import { QueryAdminProvidersDto } from '../dto/admin-provider.dto';
import { AdminProviderService } from '../services/admin-provider.service';
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

const providerLogoUpload = FileInterceptor('logo', {
  storage: memoryStorage(),
  limits: { fileSize: MAX_KYC_IMAGE_SIZE_BYTES },
});

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
  @ApiOperation({ summary: 'Update service provider profile (JSON)' })
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProviderProfileDto,
  ) {
    return this.providerProfileService.updateProfile(user.id, dto);
  }

  @Patch('logo')
  @RequirePermissions('provider.profile.update')
  @UseInterceptors(providerLogoUpload)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProviderLogoMultipartDto })
  @ApiOperation({ summary: 'Update provider logo image' })
  updateLogo(
    @CurrentUser() user: AuthUser,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return this.providerProfileService.updateLogo(user.id, logo);
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
  constructor(
    private readonly providerProfileService: ProviderProfileService,
    private readonly adminProviderService: AdminProviderService,
  ) {}

  @Get()
  @RequirePermissions('provider.review')
  @ApiOperation({
    summary: 'List all service providers (full details)',
    description:
      'Returns paginated providers with status, user, category, coverage areas, listings, orders (with items), leads, promotions, and stats.',
  })
  listAll(@Query() query: QueryAdminProvidersDto) {
    return this.adminProviderService.listAll(query);
  }

  @Get('pending')
  @RequirePermissions('provider.review')
  @ApiOperation({ summary: 'List pending service provider profiles' })
  listPending(@Query() query: PaginationQueryDto) {
    return this.providerProfileService.listPendingProfiles(query);
  }

  @Get(':providerId')
  @RequirePermissions('provider.review')
  @ApiOperation({
    summary: 'Get one service provider (full admin details)',
    description:
      'Use service provider profile id (not userId). Includes all listings, orders, leads, coverage, KYC docs, and stats.',
  })
  getById(@Param('providerId') providerId: string) {
    return this.adminProviderService.getById(providerId);
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
