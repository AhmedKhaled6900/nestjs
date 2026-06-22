import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import {
  QueryAdminListingsDto,
  RejectListingDto,
  SetListingFeaturedDto,
} from '../dto/admin-listing.dto';
import { AdminListingService } from '../services/admin-listing.service';

@ApiTags('Admin - Service Listings')
@ApiBearerAuth('access-token')
@Controller('admin/listings')
export class AdminListingController {
  constructor(private readonly adminListingService: AdminListingService) {}

  @Get()
  @RequirePermissions('provider.review')
  @ApiOperation({ summary: 'List all service listings (filter by status / featured)' })
  listAll(@Query() query: QueryAdminListingsDto) {
    return this.adminListingService.listAll(query);
  }

  @Get('pending')
  @RequirePermissions('provider.review')
  @ApiOperation({ summary: 'List listings pending admin review' })
  listPending(@Query() query: QueryAdminListingsDto) {
    return this.adminListingService.listPending(query);
  }

  @Get(':id')
  @RequirePermissions('provider.review')
  @ApiOperation({ summary: 'Get one listing with provider info' })
  getById(@Param('id') id: string) {
    return this.adminListingService.getById(id);
  }

  @Patch(':id/approve')
  @RequirePermissions('provider.review')
  @ApiOperation({ summary: 'Approve listing — publishes immediately (ACTIVE)' })
  approve(@Param('id') id: string) {
    return this.adminListingService.approve(id);
  }

  @Patch(':id/reject')
  @RequirePermissions('provider.review')
  @ApiOperation({ summary: 'Reject listing publication request' })
  reject(@Param('id') id: string, @Body() dto: RejectListingDto) {
    return this.adminListingService.reject(id, dto.reason);
  }

  @Patch(':id/featured')
  @RequirePermissions('provider.review')
  @ApiOperation({ summary: 'Mark or unmark an active listing as featured (banner)' })
  setFeatured(@Param('id') id: string, @Body() dto: SetListingFeaturedDto) {
    return this.adminListingService.setFeatured(id, dto.isFeatured);
  }
}
