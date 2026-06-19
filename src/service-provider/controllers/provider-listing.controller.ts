import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { AuthUser } from '../../auth/interfaces/auth.interface';
import { CreateListingDto, UpdateListingDto } from '../dto/listing.dto';
import { ProviderListingService } from '../services/provider-listing.service';

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
  @ApiOperation({ summary: 'Create service listing' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateListingDto) {
    return this.listingService.createListing(user.id, dto);
  }

  @Patch(':id')
  @RequirePermissions('provider.listing.manage')
  @ApiOperation({ summary: 'Update service listing' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingService.updateListing(user.id, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('provider.listing.manage')
  @ApiOperation({ summary: 'Delete service listing' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.listingService.deleteListing(user.id, id);
  }
}
