import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions, RequireRoles } from '../auth/decorators/permissions.decorator';
import { QueryOwnerPropertyDto } from './dto/query-property.dto';
import { RejectPropertyDto } from './dto/property-image.dto';
import { PropertyService } from './property.service';

@ApiTags('Admin - Properties')
@ApiBearerAuth('access-token')
@Controller('admin/properties')
export class AdminPropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get()
  @RequireRoles('ADMIN')
  @RequirePermissions('property.read')
  @ApiOperation({ summary: 'List all properties (all statuses)' })
  findAll(@Query() query: QueryOwnerPropertyDto) {
    return this.propertyService.adminFindAll(query);
  }

  @Get('pending/list')
  @RequireRoles('ADMIN')
  @RequirePermissions('property.review')
  @ApiOperation({ summary: 'List properties pending review (paginated)' })
  findPending(@Query() query: QueryOwnerPropertyDto) {
    return this.propertyService.adminFindPending(query);
  }

  @Patch(':id/approve')
  @RequireRoles('ADMIN')
  @RequirePermissions('property.review')
  @ApiOperation({ summary: 'Approve property (→ APPROVED)' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  approve(@Param('id') id: string) {
    return this.propertyService.adminApprove(id);
  }

  @Patch(':id/reject')
  @RequireRoles('ADMIN')
  @RequirePermissions('property.review')
  @ApiOperation({ summary: 'Reject property (→ REJECTED)' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  reject(@Param('id') id: string, @Body() dto: RejectPropertyDto) {
    return this.propertyService.adminReject(id, dto.reason);
  }
}
