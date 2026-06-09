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
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public, RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthUser } from '../auth/interfaces/auth.interface';
import {
  MAX_PROPERTY_IMAGE_SIZE_BYTES,
  MAX_PROPERTY_IMAGES,
} from '../upload/upload.constants';
import { CreatePropertyDto } from './dto/create-property.dto';
import {
  RejectPropertyDto,
  UpdatePropertyImageDto,
  UploadPropertyImagesDto,
} from './dto/property-image.dto';
import { QueryOwnerPropertyDto, QueryPropertyDto } from './dto/query-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyImageService } from './property-image.service';
import { PropertyService } from './property.service';

const propertyImagesInterceptor = FilesInterceptor('images', MAX_PROPERTY_IMAGES, {
  storage: memoryStorage(),
  limits: { fileSize: MAX_PROPERTY_IMAGE_SIZE_BYTES },
});

@ApiTags('Properties')
@Controller('properties')
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly propertyImageService: PropertyImageService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List approved properties (public catalog)' })
  findApproved(@Query() query: QueryPropertyDto) {
    return this.propertyService.findApproved(query);
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
  @Get(':id')
  @ApiOperation({ summary: 'Get property details (approved only for public)' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  findOne(@Param('id') id: string) {
    return this.propertyService.findById(id);
  }

  @Post()
  @RequirePermissions('property.create')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create property as DRAFT (verified owner)' })
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
