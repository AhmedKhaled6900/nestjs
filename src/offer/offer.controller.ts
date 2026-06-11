import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
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
import {
  CounterOfferDto,
  CreateOfferDto,
  QueryOwnerOffersDto,
  RejectOfferDto,
} from './dto/offer.dto';
import { OfferService } from './offer.service';

@ApiTags('Price Offers')
@ApiBearerAuth('access-token')
@Controller()
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post('properties/:propertyId/offers')
  @RequirePermissions('offer.create')
  @ApiOperation({
    summary: 'Submit a price offer (verified customer, negotiable property)',
  })
  @ApiParam({ name: 'propertyId', example: 'uuid-here' })
  create(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOfferDto,
  ) {
    return this.offerService.create(propertyId, user, dto);
  }

  @Get('offers/sent')
  @RequirePermissions('offer.read')
  @ApiOperation({ summary: 'List my submitted offers (customer)' })
  findSent(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.offerService.findSentByCustomer(user.id, query);
  }

  @Get('offers/received')
  @RequirePermissions('offer.read')
  @ApiOperation({
    summary: 'List offers received on my properties (owner)',
    description: 'Optional propertyId and status filters.',
  })
  findReceived(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryOwnerOffersDto,
  ) {
    return this.offerService.findReceivedByOwner(user.id, query);
  }

  @Get('offers/received/by-property')
  @RequirePermissions('offer.read')
  @ApiOperation({
    summary: 'Offers grouped by property (owner dashboard)',
    description: 'Each property with summary counts and full offer list.',
  })
  findReceivedGrouped(@CurrentUser() user: AuthUser) {
    return this.offerService.findReceivedGroupedByProperty(user.id);
  }

  @Get('offers/:id')
  @RequirePermissions('offer.read')
  @ApiOperation({ summary: 'Get offer details (customer, owner, or admin)' })
  @ApiParam({ name: 'id', example: 'uuid-here' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.offerService.findById(id, user);
  }

  @Post('offers/:id/accept')
  @RequirePermissions('offer.respond')
  @ApiOperation({ summary: 'Accept offer (owner)' })
  accept(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.offerService.accept(id, user);
  }

  @Post('offers/:id/reject')
  @RequirePermissions('offer.respond')
  @ApiOperation({ summary: 'Reject offer (owner)' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: RejectOfferDto,
  ) {
    return this.offerService.reject(id, user, dto.reason);
  }

  @Post('offers/:id/counter')
  @ApiOperation({
    summary: 'Counter-offer',
    description:
      'Owner counters when status is PENDING or after customer round. ' +
      'Customer counters only during NEGOTIATING after owner round. Max 3 offers per side.',
  })
  counter(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CounterOfferDto,
  ) {
    const isOwnerActor =
      user.permissions.includes('offer.respond') &&
      (user.role === 'OWNER' || user.role === 'ADMIN');
    const isCustomerActor = user.permissions.includes('offer.counter');

    if (isOwnerActor) {
      return this.offerService.counterByOwner(id, user, dto);
    }

    if (isCustomerActor) {
      return this.offerService.counterByCustomer(id, user, dto);
    }

    throw new ForbiddenException('You are not allowed to counter this offer');
  }
}
