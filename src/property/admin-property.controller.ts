import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth.interface';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions, RequireRoles } from '../auth/decorators/permissions.decorator';
import { QueryOwnerPropertyDto } from './dto/query-property.dto';
import { RejectPropertyDto } from './dto/property-image.dto';
import { SuspendPropertyDto } from './dto/suspend-property.dto';
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
  findAll(
    @Query() query: QueryOwnerPropertyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.propertyService.adminFindAll(query, {
      id: user.id,
      role: user.role,
    });
  }

  @Get('pending/list')
  @RequireRoles('ADMIN')
  @RequirePermissions('property.review')
  @ApiOperation({ summary: 'List properties pending review (paginated)' })
  findPending(
    @Query() query: QueryOwnerPropertyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.propertyService.adminFindPending(query, {
      id: user.id,
      role: user.role,
    });
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

  @Patch(':id/suspend')
  @RequireRoles('ADMIN')
  @RequirePermissions('property.update')
  @ApiOperation({
    summary: 'Suspend property (hidden from public catalog, not deleted)',
  })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  suspend(@Param('id') id: string, @Body() dto: SuspendPropertyDto) {
    return this.propertyService.adminSuspend(id, dto.reason);
  }

  @Patch(':id/reactivate')
  @RequireRoles('ADMIN')
  @RequirePermissions('property.update')
  @ApiOperation({
    summary: 'Reactivate suspended property (→ APPROVED)',
  })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  reactivate(@Param('id') id: string) {
    return this.propertyService.adminReactivate(id);
  }

  @Delete(':id')
  @RequireRoles('ADMIN')
  @RequirePermissions('property.delete')
  @ApiOperation({
    summary: 'Delete any property (any status, any owner)',
    description:
      'Permanently removes the property and its images. Works even if approved or owner is verified.',
  })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  remove(@Param('id') id: string) {
    return this.propertyService.adminRemove(id);
  }
}
