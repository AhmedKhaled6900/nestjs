import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuthUser } from '../auth/interfaces/auth.interface';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { PropertyService } from '../property/property.service';
import { CreateBookingDto } from './dto/booking.dto';
import { RentalService } from './rental.service';

@ApiTags('Bookings')
@ApiBearerAuth('access-token')
@Controller('bookings')
export class BookingController {
  constructor(
    private readonly rentalService: RentalService,
    private readonly propertyService: PropertyService,
  ) {}

  @Post()
  @RequirePermissions('booking.create')
  @ApiOperation({
    summary: 'Direct booking (verified customer)',
    description:
      'Books a RENT property at list price, marks it RENTED, and returns rental end date.',
  })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateBookingDto) {
    const result = await this.rentalService.createDirectBooking(user, dto);
    const property = await this.propertyService.findById(result.propertyId, {
      id: user.id,
      role: user.role,
    });

    return { ...result, property };
  }

  @Get('my')
  @RequirePermissions('booking.read')
  @ApiOperation({ summary: 'List my rentals / bookings' })
  findMine(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.rentalService.findMyRentals(user.id, query);
  }

  @Get('property/:propertyId')
  @RequirePermissions('booking.read', 'property.read')
  @ApiOperation({
    summary: 'Rental history for a property (owner)',
  })
  @ApiParam({ name: 'propertyId', example: 'uuid-here' })
  findByProperty(
    @CurrentUser() user: AuthUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.rentalService.findByPropertyForOwner(propertyId, user.id);
  }
}
