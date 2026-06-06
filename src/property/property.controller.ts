import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions, RequireRoles } from '../auth/decorators/permissions.decorator';
import { AuthUser } from '../auth/interfaces/auth.interface';

@ApiTags('Properties')
@ApiBearerAuth('access-token')
@Controller('properties')
export class PropertyController {
  @Get()
  @RequirePermissions('property.read')
  @ApiOperation({ summary: 'List published properties', description: 'Permission: `property.read`' })
  @ApiResponse({ status: 200, description: 'List of properties' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Missing property.read permission' })
  findAll(@CurrentUser() user: AuthUser) {
    return {
      message: 'Published properties visible to authenticated users with property.read',
      requestedBy: { id: user.id, role: user.role },
    };
  }

  @Post()
  @RequirePermissions('property.create')
  @ApiOperation({ summary: 'Create property', description: 'Permission: `property.create` (Owner/Admin)' })
  @ApiResponse({ status: 201, description: 'Property created' })
  @ApiResponse({ status: 403, description: 'Missing property.create permission' })
  create(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return {
      message: 'Property created',
      ownerId: user.id,
      data: body,
    };
  }

  @Patch(':id')
  @RequirePermissions('property.update')
  @ApiOperation({ summary: 'Update property', description: 'Permission: `property.update`' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  @ApiResponse({ status: 200, description: 'Property updated' })
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: `Property ${id} updated by owner`,
      ownerId: user.id,
      data: body,
    };
  }

  @Post(':id/publish')
  @RequirePermissions('property.publish')
  @ApiOperation({ summary: 'Publish property', description: 'Permission: `property.publish`' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  @ApiResponse({ status: 200, description: 'Property published' })
  publish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return {
      message: `Property ${id} published`,
      publishedBy: user.id,
    };
  }

  @Delete(':id')
  @RequirePermissions('property.delete')
  @ApiOperation({ summary: 'Delete property', description: 'Permission: `property.delete`' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  @ApiResponse({ status: 200, description: 'Property deleted' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return {
      message: `Property ${id} deleted`,
      deletedBy: user.id,
    };
  }

  @Get('admin/all')
  @RequireRoles('ADMIN')
  @RequirePermissions('property.read')
  @ApiOperation({ summary: 'Admin: list all properties', description: 'Role: ADMIN + Permission: `property.read`' })
  @ApiResponse({ status: 200, description: 'All properties including drafts' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  adminListAll(@CurrentUser() user: AuthUser) {
    return {
      message: 'Admin-only: all properties including drafts',
      adminId: user.id,
    };
  }
}

@ApiTags('Bookings')
@ApiBearerAuth('access-token')
@Controller('bookings')
export class BookingController {
  @Post()
  @RequirePermissions('booking.create')
  @ApiOperation({ summary: 'Create booking', description: 'Permission: `booking.create` (Customer)' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  create(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthUser) {
    return {
      message: 'Booking created',
      customerId: user.id,
      data: body,
    };
  }

  @Get('my')
  @RequirePermissions('booking.read')
  @ApiOperation({ summary: 'Get my bookings', description: 'Permission: `booking.read`' })
  @ApiResponse({ status: 200, description: 'User bookings list' })
  myBookings(@CurrentUser() user: AuthUser) {
    return {
      message: 'Your bookings',
      userId: user.id,
    };
  }

  @Patch(':id/cancel')
  @RequirePermissions('booking.cancel')
  @ApiOperation({ summary: 'Cancel booking', description: 'Permission: `booking.cancel`' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return {
      message: `Booking ${id} cancelled`,
      cancelledBy: user.id,
    };
  }
}
