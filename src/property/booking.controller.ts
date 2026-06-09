import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthUser } from '../auth/interfaces/auth.interface';

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
