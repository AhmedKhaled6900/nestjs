import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalAuth, Public, RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthUser } from '../auth/interfaces/auth.interface';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import {
  MAX_PROPERTY_IMAGE_SIZE_BYTES,
  MAX_PROPERTY_IMAGES,
  MAX_PROPERTY_VIDEO_SIZE_BYTES,
} from '../upload/upload.constants';
import { CreatePropertyDto } from './dto/create-property.dto';
import {
  RejectPropertyDto,
  UpdatePropertyImageDto,
  UploadPropertyImagesDto,
  UploadPropertyVideoDto,
} from './dto/property-image.dto';
import { QueryOwnerPropertyDto, QueryPropertyDto } from './dto/query-property.dto';
import { QuerySimilarPropertiesDto } from './dto/query-similar-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyImageService } from './property-image.service';
import { PropertyService } from './property.service';

const propertyImagesInterceptor = FilesInterceptor('images', MAX_PROPERTY_IMAGES, {
  storage: memoryStorage(),
  limits: { fileSize: MAX_PROPERTY_IMAGE_SIZE_BYTES },
});

const propertyVideoInterceptor = FileInterceptor('video', {
  storage: memoryStorage(),
  limits: { fileSize: MAX_PROPERTY_VIDEO_SIZE_BYTES },
});

@ApiTags('Properties')
@Controller('properties')
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly propertyImageService: PropertyImageService,
  ) {}

  @Public()
  @OptionalAuth()
  @Get()
  @ApiOperation({ summary: 'List approved and rented properties (public catalog)' })
  findApproved(
    @Query() query: QueryPropertyDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.propertyService.findApproved(
      query,
      user ? { id: user.id, role: user.role } : undefined,
    );
  }

  @Get('my/list')
  @RequirePermissions('property.read')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List my properties (owner)' })
  findMine(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryOwnerPropertyDto,
  ) {
    return this.propertyService.findMine(user.id, query);
  }

  @Public()
  @Get('similar')
  @ApiOperation({
    summary: 'Similar properties (public)',
    description:
      'Matches: same city, same subcategory (type), bedrooms ±1, price ±16.67%. ' +
      'Provide subcategoryId or type (slug/name e.g. apartment).',
  })
  findSimilar(@Query() query: QuerySimilarPropertiesDto) {
    return this.propertyService.findSimilar(query);
  }

  @Public()
  @OptionalAuth()
  @Get(':id/similar')
  @ApiOperation({
    summary: 'Similar properties for a listing',
    description:
      'Uses the property city, subcategory, bedrooms, and price. Excludes the current property.',
  })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  findSimilarById(
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.propertyService.findSimilarById(
      id,
      query,
      user ? { id: user.id, role: user.role } : undefined,
    );
  }

  @Public()
  @OptionalAuth()
  @Get(':id')
  @ApiOperation({
    summary: 'Get property details',
    description:
      'Public: APPROVED only. With Bearer token: owner sees own property (any status), admin sees all.',
  })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.propertyService.findById(
      id,
      user ? { id: user.id, role: user.role } : undefined,
    );
  }

  @Post()
  @RequirePermissions('property.create')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create property as DRAFT (verified owner or admin)',
    description:
      'Owners need verified email + approved KYC. Admins can create without KYC; property is owned by the admin account.',
  })
  @ApiResponse({ status: 201, description: 'Property created' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePropertyDto) {
    return this.propertyService.create(user.id, dto);
  }

  @Patch(':id')
  @RequirePermissions('property.update')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update property (DRAFT or REJECTED only)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertyService.update(id, user.id, dto);
  }

  @Delete(':id')
  @RequirePermissions('property.delete')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete property (DRAFT or REJECTED only)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.propertyService.remove(id, user.id);
  }

  @Post(':id/images')
  @RequirePermissions('property.update')
  @ApiBearerAuth('access-token')
  @UseInterceptors(propertyImagesInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPropertyImagesDto })
  @ApiOperation({ summary: 'Upload property images' })
  uploadImages(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadPropertyImagesDto,
  ) {
    return this.propertyImageService.uploadImages(
      id,
      user.id,
      files ?? [],
      dto.primaryIndex ?? 0,
    );
  }

  @Post(':id/video')
  @RequirePermissions('property.update')
  @ApiBearerAuth('access-token')
  @UseInterceptors(propertyVideoInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPropertyVideoDto })
  @ApiOperation({
    summary: 'Upload optional property video (DRAFT or REJECTED only)',
    description: 'Replaces existing video if one is already uploaded. MP4, WebM, or MOV — max 50 MB.',
  })
  uploadVideo(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.propertyService.uploadVideo(id, user.id, file);
  }

  @Delete(':id/video')
  @RequirePermissions('property.update')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove property video' })
  removeVideo(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.propertyService.removeVideo(id, user.id);
  }

  @Patch(':id/images/:imageId')
  @RequirePermissions('property.update')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update image order or primary flag' })
  updateImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePropertyImageDto,
  ) {
    return this.propertyImageService.updateImage(id, imageId, user.id, dto);
  }

  @Delete(':id/images/:imageId')
  @RequirePermissions('property.update')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete property image' })
  removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.propertyImageService.removeImage(id, imageId, user.id);
  }

  @Post(':id/submit')
  @RequirePermissions('property.publish')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit property for admin review (→ PENDING)' })
  submit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.propertyService.submitForReview(id, user.id);
  }

  @Patch(':id/mark-sold')
  @RequirePermissions('property.update')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark approved SALE property as SOLD' })
  markSold(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.propertyService.markSold(id, user.id);
  }

  @Patch(':id/mark-rented')
  @RequirePermissions('property.update')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark approved RENT property as RENTED' })
  markRented(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.propertyService.markRented(id, user.id);
  }
}
