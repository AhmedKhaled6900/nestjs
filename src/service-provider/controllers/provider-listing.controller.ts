import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { AuthUser } from '../../auth/interfaces/auth.interface';
import { MAX_PROPERTY_IMAGE_SIZE_BYTES } from '../../upload/upload.constants';
import {
  CreateListingDto,
  CreateListingMultipartDto,
  UpdateListingDto,
  UpdateListingMultipartDto,
} from '../dto/listing.dto';
import { ProviderListingService } from '../services/provider-listing.service';

const listingImageInterceptor = FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: MAX_PROPERTY_IMAGE_SIZE_BYTES },
});

@ApiTags('Provider Listings')
@ApiBearerAuth('access-token')
@Controller('provider/listings')
export class ProviderListingController {
  constructor(private readonly listingService: ProviderListingService) {}

  @Get()
  @RequirePermissions('provider.listing.manage')
  @ApiOperation({ summary: 'List my service listings (free ads)' })
  list(@CurrentUser() user: AuthUser) {
    return this.listingService.listMyListings(user.id);
  }

  @Post()
  @RequirePermissions('provider.listing.manage')
  @UseInterceptors(listingImageInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateListingMultipartDto })
  @ApiOperation({ summary: 'Create service listing (image required)' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateListingDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.listingService.createListing(user.id, dto, image);
  }

  @Patch(':id')
  @RequirePermissions('provider.listing.manage')
  @UseInterceptors(listingImageInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateListingMultipartDto })
  @ApiOperation({ summary: 'Update service listing (optional new image)' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.listingService.updateListing(user.id, id, dto, image);
  }

  @Delete(':id')
  @RequirePermissions('provider.listing.manage')
  @ApiOperation({ summary: 'Delete service listing' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.listingService.deleteListing(user.id, id);
  }
}
